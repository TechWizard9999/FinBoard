import { FieldNode, ApiTestResult } from '@/types';

// Parse JSON response and extract field structure
export function parseJsonFields(data: unknown, parentPath = ''): FieldNode[] {
  const fields: FieldNode[] = [];

  if (data === null || data === undefined) {
    return fields;
  }

  // Handle root-level arrays (like CoinGecko markets API)
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      // Create a virtual "root" array node
      const rootNode: FieldNode = {
        path: parentPath || 'data',
        key: parentPath || 'data',
        value: data,
        type: 'array',
        isArray: true,
        children: [],
      };
      
      // Parse fields from the first array element
      const firstItem = data[0] as Record<string, unknown>;
      Object.entries(firstItem).forEach(([key, value]) => {
        const currentPath = parentPath ? `${parentPath}[0].${key}` : `[0].${key}`;
        const node: FieldNode = {
          path: currentPath,
          key,
          value,
          type: getValueType(value),
          isArray: Array.isArray(value),
        };

        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value) && value.length > 0) {
            node.children = parseJsonFields(value[0], currentPath + '[0]');
          } else if (!Array.isArray(value)) {
            node.children = parseJsonFields(value, currentPath);
          }
        }

        rootNode.children!.push(node);
      });
      
      fields.push(rootNode);
    }
    return fields;
  }

  // Handle objects
  if (typeof data === 'object') {
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      const node: FieldNode = {
        path: currentPath,
        key,
        value,
        type: getValueType(value),
        isArray: Array.isArray(value),
      };

      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          // For arrays, parse the first element to show structure
          node.children = parseJsonFields(value[0], currentPath + '[0]');
        } else if (!Array.isArray(value)) {
          node.children = parseJsonFields(value, currentPath);
        }
      }

      fields.push(node);
    });
  }

  return fields;
}

// Get value type as string
function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

// Get value at a specific path from an object
export function getValueAtPath(obj: unknown, path: string): unknown {
  if (!obj || !path) return undefined;

  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined) return undefined;
    if (typeof result === 'object') {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return result;
}

// Format value for display
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    // Format large numbers with commas and limit decimal places
    if (Number.isInteger(value)) {
      return value.toLocaleString();
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Test API connection
export async function testApiConnection(url: string): Promise<ApiTestResult> {
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const fields = parseJsonFields(data);
    
    // Count fields properly for both arrays and objects
    let topLevelFieldCount = 0;
    if (Array.isArray(data)) {
      // For arrays, count fields in the first item
      topLevelFieldCount = data.length > 0 && typeof data[0] === 'object' 
        ? Object.keys(data[0]).length 
        : data.length;
    } else if (typeof data === 'object' && data !== null) {
      topLevelFieldCount = Object.keys(data).length;
    }

    return {
      success: true,
      data,
      fields,
      topLevelFieldCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to API',
    };
  }
}

// Fetch widget data
export async function fetchWidgetData(url: string): Promise<unknown> {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Generate unique ID
export function generateId(): string {
  return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all array fields from parsed fields (for table view)
export function getArrayFields(fields: FieldNode[]): FieldNode[] {
  const arrayFields: FieldNode[] = [];

  function traverse(nodes: FieldNode[]) {
    for (const node of nodes) {
      if (node.isArray) {
        arrayFields.push(node);
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(fields);
  return arrayFields;
}

// Flatten nested object for table display
export function flattenObject(
  obj: unknown,
  prefix = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return result;
  }

  Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  });

  return result;
}

