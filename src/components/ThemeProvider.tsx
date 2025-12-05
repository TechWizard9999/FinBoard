'use client';

import { useEffect, ReactNode } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useDashboardStore();

  useEffect(() => {
    // Update document class for theme
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);

    // Update body background
    if (theme === 'light') {
      document.body.style.backgroundColor = '#f1f5f9';
      document.body.style.color = '#0f172a';
    } else {
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#e2e8f0';
    }
  }, [theme]);

  return <>{children}</>;
}

