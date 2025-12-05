import { NextRequest, NextResponse } from 'next/server';

// Enhanced cache for handling 20+ widgets
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds - longer cache for many widgets
const STALE_CACHE_DURATION = 600000; // 10 minutes - serve stale data if fresh fetch fails

// Request queue to prevent too many concurrent requests
const pendingRequests = new Map<string, Promise<unknown>>();

// Retry fetch with exponential backoff
async function fetchWithRetry(
  url: string,
  retries = 3,
  delay = 2000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FinBoard/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // If rate limited (429), wait longer before retry
      if (response.status === 429) {
        const waitTime = delay * Math.pow(2, i);
        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    } catch (error) {
      const isLastAttempt = i === retries - 1;
      
      if (isLastAttempt) {
        throw error;
      }

      // Wait before retry with exponential backoff
      const waitTime = delay * Math.pow(1.5, i);
      console.log(`Fetch attempt ${i + 1} failed. Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('All retry attempts failed');
}

// Deduplicate concurrent requests for the same URL
async function fetchWithDeduplication(url: string): Promise<unknown> {
  // Check if there's already a pending request for this URL
  const pending = pendingRequests.get(url);
  if (pending) {
    console.log('Deduplicating request for:', url);
    return pending;
  }

  // Create new request promise
  const requestPromise = (async () => {
    try {
      const response = await fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the successful response
      cache.set(url, { data, timestamp: Date.now() });
      
      return data;
    } finally {
      // Clean up pending request
      pendingRequests.delete(url);
    }
  })();

  pendingRequests.set(url, requestPromise);
  return requestPromise;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check fresh cache first
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache-Status': 'fresh' }
      });
    }

    // Try to fetch with deduplication
    try {
      const data = await fetchWithDeduplication(url);
      return NextResponse.json(data, {
        headers: { 'X-Cache-Status': 'new' }
      });
    } catch (fetchError) {
      // If fetch fails, try to serve stale cache
      if (cached && Date.now() - cached.timestamp < STALE_CACHE_DURATION) {
        console.log('Serving stale cache for:', url);
        return NextResponse.json(cached.data, {
          headers: { 'X-Cache-Status': 'stale' }
        });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Proxy error:', error);

    // Provide user-friendly error messages
    let errorMessage = 'Failed to fetch data';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out';
      } else if (error.message.includes('ECONNRESET')) {
        errorMessage = 'Connection reset - API may be rate limiting';
      } else if (error.message.includes('CONNECT_TIMEOUT') || error.message.includes('timeout')) {
        errorMessage = 'Connection timed out';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
