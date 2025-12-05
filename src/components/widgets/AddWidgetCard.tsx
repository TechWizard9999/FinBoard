'use client';

import { Plus } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';

export default function AddWidgetCard() {
  const { openAddWidgetModal, theme } = useDashboardStore();

  return (
    <button
      onClick={openAddWidgetModal}
      className={`group flex h-full min-h-[200px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
        theme === 'light'
          ? 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
          : 'border-slate-600 hover:border-emerald-500/50 hover:bg-slate-800/50'
      }`}
    >
      <div
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed transition-colors ${
          theme === 'light'
            ? 'border-slate-400 group-hover:border-emerald-500'
            : 'border-slate-500 group-hover:border-emerald-500'
        }`}
      >
        <Plus
          className={`h-6 w-6 transition-colors ${
            theme === 'light'
              ? 'text-slate-400 group-hover:text-emerald-500'
              : 'text-slate-500 group-hover:text-emerald-400'
          }`}
        />
      </div>
      <span className="font-medium text-emerald-500">Add Widget</span>
      <span
        className={`mt-1 text-center text-sm ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-500'
        }`}
      >
        Connect to a finance API and<br />create a custom widget
      </span>
    </button>
  );
}

