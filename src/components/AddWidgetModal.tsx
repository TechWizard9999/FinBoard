'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Check, AlertCircle, Loader2, Search } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';
import { Widget, WidgetDisplayMode, WidgetField, FieldNode, ApiTestResult } from '@/types';
import { testApiConnection, generateId, getArrayFields } from '@/utils/apiUtils';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddWidgetModal({ isOpen, onClose }: AddWidgetModalProps) {
  const { addWidget, updateWidget, editingWidget, widgets } = useDashboardStore();

  // Form state
  const [name, setName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [displayMode, setDisplayMode] = useState<WidgetDisplayMode>('card');
  const [selectedFields, setSelectedFields] = useState<WidgetField[]>([]);

  // API test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null);
  const [fieldSearch, setFieldSearch] = useState('');
  const [showArraysOnly, setShowArraysOnly] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingWidget) {
        setName(editingWidget.name);
        setApiUrl(editingWidget.apiUrl);
        setRefreshInterval(editingWidget.refreshInterval);
        setDisplayMode(editingWidget.displayMode);
        setSelectedFields(editingWidget.selectedFields);
      } else {
        setName('');
        setApiUrl('');
        setRefreshInterval(60);
        setDisplayMode('card');
        setSelectedFields([]);
      }
      setTestResult(null);
      setFieldSearch('');
      setShowArraysOnly(false);
      setExpandedPaths(new Set());
    }
  }, [isOpen, editingWidget]);

  const handleTestApi = useCallback(async () => {
    if (!apiUrl) return;

    setIsTesting(true);
    const result = await testApiConnection(apiUrl);
    setTestResult(result);
    setIsTesting(false);
    
    // Auto-expand root level nodes (especially for array responses)
    if (result.success && result.fields) {
      const initialExpanded = new Set<string>();
      result.fields.forEach((field) => {
        if (field.children && field.children.length > 0) {
          initialExpanded.add(field.path);
        }
      });
      setExpandedPaths(initialExpanded);
    }
  }, [apiUrl]);

  const toggleFieldSelection = (field: FieldNode) => {
    const exists = selectedFields.find((f) => f.path === field.path);
    if (exists) {
      setSelectedFields(selectedFields.filter((f) => f.path !== field.path));
    } else {
      setSelectedFields([
        ...selectedFields,
        {
          path: field.path,
          label: field.key,
          type: field.type,
        },
      ]);
    }
  };

  const removeSelectedField = (path: string) => {
    setSelectedFields(selectedFields.filter((f) => f.path !== path));
  };

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleSubmit = () => {
    if (!name || !apiUrl || selectedFields.length === 0) return;

    // Calculate widget dimensions based on display mode
    const widgetWidth = displayMode === 'table' ? 6 : displayMode === 'chart' ? 4 : 4;
    const widgetHeight = displayMode === 'table' ? 4 : displayMode === 'chart' ? 3 : 2;

    // Calculate next position (horizontal first, then wrap to new row)
    let nextX = 0;
    let nextY = 0;
    
    if (!editingWidget && widgets.length > 0) {
      // Find the position for the new widget
      const cols = 12; // Total columns in grid
      const existingWidgets = widgets.map(w => w.position);
      
      // Simple algorithm: place widgets in a row, wrap when full
      const widgetIndex = widgets.length;
      const widgetsPerRow = Math.floor(cols / widgetWidth);
      nextX = (widgetIndex % widgetsPerRow) * widgetWidth;
      nextY = Math.floor(widgetIndex / widgetsPerRow) * widgetHeight;
    }

    const widgetData: Widget = {
      id: editingWidget?.id || generateId(),
      name,
      apiUrl,
      refreshInterval,
      displayMode,
      selectedFields,
      position: editingWidget?.position || {
        x: nextX,
        y: nextY,
        w: widgetWidth,
        h: widgetHeight,
      },
    };

    if (editingWidget) {
      updateWidget(editingWidget.id, widgetData);
    } else {
      addWidget(widgetData);
    }

    onClose();
  };

  const renderFieldNode = (node: FieldNode, level = 0): React.ReactNode => {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedFields.some((f) => f.path === node.path);
    const hasChildren = node.children && node.children.length > 0;

    // Filter by search
    if (
      fieldSearch &&
      !node.path.toLowerCase().includes(fieldSearch.toLowerCase()) &&
      !node.key.toLowerCase().includes(fieldSearch.toLowerCase())
    ) {
      // Check if any children match
      if (hasChildren) {
        const childrenMatch = node.children!.some(
          (child) =>
            child.path.toLowerCase().includes(fieldSearch.toLowerCase()) ||
            child.key.toLowerCase().includes(fieldSearch.toLowerCase())
        );
        if (!childrenMatch) return null;
      } else {
        return null;
      }
    }

    // Filter arrays only
    if (showArraysOnly && !node.isArray && !hasChildren) return null;

    const valuePreview =
      typeof node.value === 'object'
        ? node.isArray
          ? `Array(${(node.value as unknown[]).length})`
          : 'Object'
        : String(node.value).slice(0, 30);

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 rounded px-2 py-1.5 transition-colors ${
            isSelected ? 'bg-emerald-900/30' : 'hover:bg-slate-700/50'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(node.path)}
              className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-600"
            >
              {isExpanded ? '−' : '+'}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Field Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-emerald-400">{node.key}</span>
              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400">
                {node.type}
              </span>
              {node.isArray && (
                <span className="rounded bg-blue-900/50 px-1.5 py-0.5 text-xs text-blue-400">
                  array
                </span>
              )}
            </div>
            <p className="truncate text-xs text-slate-500">{valuePreview}</p>
          </div>

          {/* Select Button */}
          {!hasChildren && (
            <button
              onClick={() => toggleFieldSelection(node)}
              className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                isSelected
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {isSelected ? <Check className="h-4 w-4" /> : '+'}
            </button>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderFieldNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredFields = showArraysOnly
    ? getArrayFields(testResult?.fields || [])
    : testResult?.fields || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {editingWidget ? 'Edit Widget' : 'Add New Widget'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 p-6">
          {/* Widget Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Widget Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Bitcoin Price Tracker"
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition-colors focus:border-emerald-500"
            />
          </div>

          {/* API URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              API URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="e.g., https://api.coinbase.com/v2/exchange-rates?currency=BTC"
                className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white placeholder-slate-400 outline-none transition-colors focus:border-emerald-500"
              />
              <button
                onClick={handleTestApi}
                disabled={!apiUrl || isTesting}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Test
              </button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  testResult.success
                    ? 'bg-emerald-900/30 text-emerald-400'
                    : 'bg-red-900/30 text-red-400'
                }`}
              >
                {testResult.success ? (
                  <>
                    <Check className="h-4 w-4" />
                    API connection successful! {testResult.topLevelFieldCount} top-level
                    fields found.
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    {testResult.error}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              min={5}
              max={3600}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white outline-none transition-colors focus:border-emerald-500"
            />
          </div>

          {/* Field Selection (only shown after successful API test) */}
          {testResult?.success && (
            <>
              <div className="border-t border-slate-700 pt-4">
                <h3 className="mb-3 text-sm font-medium text-slate-300">
                  Select Fields to Display
                </h3>

                {/* Display Mode */}
                <div className="mb-3">
                  <label className="mb-1.5 block text-xs text-slate-400">
                    Display Mode
                  </label>
                  <div className="flex gap-2">
                    {(['card', 'table', 'chart'] as WidgetDisplayMode[]).map(
                      (mode) => (
                        <button
                          key={mode}
                          onClick={() => setDisplayMode(mode)}
                          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                            displayMode === mode
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {mode}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Search Fields */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    placeholder="Search for fields..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none transition-colors focus:border-emerald-500"
                  />
                </div>

                {/* Show Arrays Only Toggle */}
                <label className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={showArraysOnly}
                    onChange={(e) => setShowArraysOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  Show arrays only (for table view)
                </label>

                {/* Available Fields */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs text-slate-400">
                    Available Fields
                  </label>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-600 bg-slate-900/50">
                    {filteredFields.map((field) => renderFieldNode(field))}
                    {filteredFields.length === 0 && (
                      <p className="p-4 text-center text-sm text-slate-500">
                        No fields found
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected Fields */}
                {selectedFields.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-400">
                      Selected Fields
                    </label>
                    <div className="space-y-1 rounded-lg border border-slate-600 bg-slate-900/50 p-2">
                      {selectedFields.map((field) => (
                        <div
                          key={field.path}
                          className="flex items-center justify-between rounded bg-slate-700/50 px-3 py-1.5"
                        >
                          <span className="font-mono text-sm text-emerald-400">
                            {field.path}
                          </span>
                          <button
                            onClick={() => removeSelectedField(field.path)}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-700 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name || !apiUrl || selectedFields.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editingWidget ? 'Update Widget' : 'Add Widget'}
          </button>
        </div>
      </div>
    </div>
  );
}

