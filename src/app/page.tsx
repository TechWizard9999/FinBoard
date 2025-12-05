'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import Header from '@/components/Header';
import ResponsiveDashboard from '@/components/ResponsiveDashboard';
import AddWidgetModal from '@/components/AddWidgetModal';

export default function Home() {
  const { theme, isAddWidgetModalOpen, closeAddWidgetModal } = useDashboardStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  }, [theme, mounted]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className={`min-h-screen ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-900'}`}>
      <Header />
      <ResponsiveDashboard />
      <AddWidgetModal isOpen={isAddWidgetModalOpen} onClose={closeAddWidgetModal} />
    </main>
  );
}
