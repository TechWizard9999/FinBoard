'use client';

import { useDashboardStore } from '@/store/dashboardStore';
import { BarChart3, Plus, Moon, Sun, Download, Upload } from 'lucide-react';
import { useRef } from 'react';

export default function Header() {
  const {
    widgets,
    theme,
    toggleTheme,
    openAddWidgetModal,
    exportConfig,
    importConfig,
  } = useDashboardStore();

  const isLight = theme === 'light';

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const config = exportConfig();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finboard-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importConfig(content);
      if (!success) {
        alert('Failed to import configuration. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const activeWidgetCount = widgets.length;

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md ${
      isLight 
        ? 'border-slate-200/80 bg-white/90' 
        : 'border-slate-700/40 bg-slate-900/90'
    }`}>
      <div className="mx-auto flex h-14 max-w-[1920px] items-center justify-between px-4 sm:px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>FinBoard</h1>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {activeWidgetCount > 0 ? (
                <>
                  {activeWidgetCount} widget{activeWidgetCount !== 1 ? 's' : ''} •{' '}
                  <span className="text-cyan-500">Live</span>
                </>
              ) : (
                'Build your dashboard'
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isLight 
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Export Config */}
          <button
            onClick={handleExport}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isLight 
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Export configuration"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Import Config */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isLight 
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Import configuration"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          {/* Add Widget Button */}
          <button
            onClick={openAddWidgetModal}
            className="ml-2 flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 text-sm font-medium text-white shadow-md shadow-cyan-500/25 transition-all hover:shadow-lg hover:shadow-cyan-500/30"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Widget</span>
          </button>
        </div>
      </div>
    </header>
  );
}
