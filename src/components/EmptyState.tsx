'use client';

import { BarChart3, Plus } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';

export default function EmptyState() {
  const { openAddWidgetModal, theme } = useDashboardStore();
  const isLight = theme === 'light';

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${
          isLight ? 'bg-slate-100' : 'bg-slate-800'
        }`}>
          <BarChart3 className={`h-10 w-10 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
        </div>

        {/* Title */}
        <h2 className={`mb-2 text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Build Your Finance Dashboard
        </h2>

        {/* Description */}
        <p className={`mb-8 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Create custom widgets by connecting to any finance API. Track stocks,
          crypto, forex, or economic indicators — all in real time.
        </p>

        {/* Add Widget Card */}
        <button
          onClick={openAddWidgetModal}
          className={`group mx-auto flex w-64 flex-col items-center rounded-xl border-2 border-dashed p-8 transition-all ${
            isLight 
              ? 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50' 
              : 'border-slate-600 hover:border-emerald-500/50 hover:bg-slate-800/50'
          }`}
        >
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed transition-colors group-hover:border-emerald-500 ${
            isLight ? 'border-slate-300' : 'border-slate-500'
          }`}>
            <Plus className={`h-6 w-6 transition-colors group-hover:text-emerald-500 ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`} />
          </div>
          <span className="font-medium text-emerald-500">Add Widget</span>
          <span className={`mt-1 text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Connect to a finance API and create a custom widget
          </span>
        </button>

        {/* Example APIs */}
        <div className="mt-12">
          <p className={`mb-4 text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Example APIs you can use:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'CoinGecko',
              'Alpha Vantage',
              'Coinbase',
              'Finnhub',
              'Yahoo Finance',
            ].map((api) => (
              <span
                key={api}
                className={`rounded-full px-3 py-1 text-xs ${
                  isLight 
                    ? 'bg-slate-100 text-slate-600' 
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {api}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

