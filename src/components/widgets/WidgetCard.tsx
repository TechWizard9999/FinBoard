'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { RefreshCw, Settings, Trash2, GripVertical, AlertCircle, WifiOff } from 'lucide-react';
import { Widget } from '@/types';
import { useDashboardStore } from '@/store/dashboardStore';
import { fetchWidgetData, getValueAtPath, formatValue } from '@/utils/apiUtils';
import WidgetTable from './WidgetTable';
import WidgetChart from './WidgetChart';

interface WidgetCardProps {
  widget: Widget;
  isDragging?: boolean;
}

// Global counter for staggering initial fetches
let widgetInitCounter = 0;

export default function WidgetCard({ widget, isDragging }: WidgetCardProps) {
  const {
    setWidgetData,
    setWidgetLoading,
    removeWidget,
    openAddWidgetModal,
    setEditingWidget,
    theme,
    widgets,
  } = useDashboardStore();
  
  const isLight = theme === 'light';
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const lastSuccessfulDataRef = useRef<unknown>(null);
  const isMountedRef = useRef(true);
  const widgetIndexRef = useRef(widgetInitCounter++);

  // Calculate dynamic refresh interval based on number of widgets
  const getRefreshInterval = useCallback(() => {
    const baseInterval = widget.refreshInterval * 1000;
    const widgetCount = widgets.length;
    // Add extra time for more widgets to prevent rate limiting
    const multiplier = widgetCount > 10 ? 1.5 : widgetCount > 5 ? 1.2 : 1;
    return baseInterval * multiplier;
  }, [widget.refreshInterval, widgets.length]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setWidgetLoading(widget.id, true);
    
    try {
      const data = await fetchWidgetData(widget.apiUrl);
      
      if (!isMountedRef.current) return;
      
      setWidgetData(widget.id, data);
      lastSuccessfulDataRef.current = data;
      setIsStale(false);
      setRetryCount(0);
      
      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch data';
      
      // If we have previous successful data, keep showing it but mark as stale
      if (lastSuccessfulDataRef.current) {
        setWidgetData(widget.id, lastSuccessfulDataRef.current);
        setIsStale(true);
      } else {
        setWidgetData(widget.id, null, errorMsg);
      }
      
      // Schedule auto-retry with longer delays for many widgets
      setRetryCount(prev => {
        const newCount = prev + 1;
        if (newCount <= 3) {
          const baseDelay = 8000 * Math.pow(1.5, prev);
          const jitter = Math.random() * 2000; // Add jitter to prevent thundering herd
          const delay = baseDelay + jitter;
          
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              fetchData();
            }
          }, delay);
        }
        return newCount;
      });
    }
  }, [widget.id, widget.apiUrl, setWidgetData, setWidgetLoading]);

  // Manual refresh - resets retry count
  const handleManualRefresh = useCallback(() => {
    setRetryCount(0);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    fetchData();
  }, [fetchData]);

  // Initial fetch with staggering and interval refresh
  useEffect(() => {
    isMountedRef.current = true;
    
    // Stagger initial fetch to prevent all widgets fetching at once
    // Each widget waits (index * 500ms) before first fetch
    const staggerDelay = widgetIndexRef.current * 500;
    
    const initialFetchTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        fetchData();
      }
    }, staggerDelay);

    // Set up interval with dynamic timing
    const setupInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(fetchData, getRefreshInterval());
    };
    
    // Start interval after initial fetch
    const intervalSetupTimeout = setTimeout(setupInterval, staggerDelay + 1000);
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(initialFetchTimeout);
      clearTimeout(intervalSetupTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [widget.apiUrl, fetchData, getRefreshInterval]);

  const handleEdit = () => {
    setEditingWidget(widget);
    openAddWidgetModal();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this widget?')) {
      removeWidget(widget.id);
    }
  };

  const renderCardContent = () => {
    if (widget.isLoading && !widget.data) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
            <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</span>
          </div>
        </div>
      );
    }

    if (widget.error && !widget.data) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <AlertCircle className="h-8 w-8 text-rose-400" />
          <p className="text-sm text-rose-400">{widget.error}</p>
          {retryCount > 0 && retryCount <= 3 && (
            <p className="text-xs text-amber-400">Retrying... ({retryCount}/3)</p>
          )}
          <button
            onClick={handleManualRefresh}
            className={`mt-2 flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isLight 
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                : 'bg-slate-700/80 text-slate-200 hover:bg-slate-600'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      );
    }

    if (!widget.data) {
      return (
        <div className={`flex h-full items-center justify-center ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          No data available
        </div>
      );
    }

    // Render based on display mode
    switch (widget.displayMode) {
      case 'table':
        return <WidgetTable widget={widget} />;
      case 'chart':
        return <WidgetChart widget={widget} />;
      default:
        return (
          <div className="space-y-1 p-4">
            {widget.selectedFields.map((field) => {
              const value = getValueAtPath(widget.data, field.path);
              return (
                <div
                  key={field.path}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                    isLight ? 'bg-slate-50' : 'bg-slate-700/30'
                  }`}
                >
                  <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{field.label}</span>
                  <span className={`font-mono text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                    {formatValue(value)}
                  </span>
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${
        isLight 
          ? 'border-slate-200/80 bg-white shadow-sm hover:shadow-md' 
          : 'border-slate-700/60 bg-gradient-to-br from-slate-800/90 to-slate-800/70 hover:border-slate-600/60'
      } ${isDragging ? 'shadow-xl ring-2 ring-cyan-500' : ''} ${isStale ? 'ring-1 ring-amber-400/40' : ''}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b px-4 py-2.5 ${
        isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-700/50 bg-slate-800/50'
      }`}>
        <div className="flex items-center gap-2">
          <div
            className={`cursor-grab drag-handle rounded p-0.5 transition-colors ${
              isLight ? 'text-slate-300 hover:text-slate-500 hover:bg-slate-100' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-700/50'
            }`}
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <h3 className={`font-semibold text-sm ${isLight ? 'text-slate-700' : 'text-slate-100'}`}>{widget.name}</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            widget.displayMode === 'chart' 
              ? 'bg-violet-500/15 text-violet-500' 
              : widget.displayMode === 'table'
              ? 'bg-blue-500/15 text-blue-500'
              : 'bg-cyan-500/15 text-cyan-500'
          }`}>
            {widget.displayMode}
          </span>
          {isStale && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500">
              <WifiOff className="h-3 w-3" />
              Cached
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleManualRefresh}
            disabled={widget.isLoading}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              isLight 
                ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600' 
                : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
            } ${widget.isLoading ? 'animate-spin' : ''}`}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleEdit}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              isLight 
                ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600' 
                : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
            }`}
            title="Edit"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              isLight 
                ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-500' 
                : 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400'
            }`}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">{renderCardContent()}</div>

      {/* Footer */}
      {widget.lastUpdated && (
        <div className={`border-t px-4 py-1.5 text-center text-xs ${
          isLight ? 'border-slate-100 text-slate-400 bg-slate-50/30' : 'border-slate-700/40 text-slate-500 bg-slate-800/30'
        }`}>
          <span>Updated: {widget.lastUpdated}</span>
          {retryCount > 0 && retryCount <= 3 && (
            <span className="ml-2 text-amber-500">• retrying</span>
          )}
        </div>
      )}
    </div>
  );
}
