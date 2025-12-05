import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Widget, DashboardState } from '@/types';

interface DashboardStore extends DashboardState {
  // Widget actions
  addWidget: (widget: Widget) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  removeWidget: (id: string) => void;
  setWidgetData: (id: string, data: unknown, error?: string | null) => void;
  setWidgetLoading: (id: string, isLoading: boolean) => void;
  updateWidgetPosition: (id: string, position: Widget['position']) => void;
  
  // Modal actions
  openAddWidgetModal: () => void;
  closeAddWidgetModal: () => void;
  setEditingWidget: (widget: Widget | null) => void;
  
  // Theme actions
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  
  // Persistence actions
  exportConfig: () => string;
  importConfig: (config: string) => boolean;
  clearAllWidgets: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      widgets: [],
      theme: 'dark',
      isAddWidgetModalOpen: false,
      editingWidget: null,

      addWidget: (widget) =>
        set((state) => ({
          widgets: [...state.widgets, widget],
        })),

      updateWidget: (id, updates) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),

      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        })),

      setWidgetData: (id, data, error = null) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id
              ? {
                  ...w,
                  data,
                  error,
                  lastUpdated: new Date().toLocaleTimeString(),
                  isLoading: false,
                }
              : w
          ),
        })),

      setWidgetLoading: (id, isLoading) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, isLoading } : w
          ),
        })),

      updateWidgetPosition: (id, position) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, position } : w
          ),
        })),

      openAddWidgetModal: () => set({ isAddWidgetModalOpen: true }),
      closeAddWidgetModal: () =>
        set({ isAddWidgetModalOpen: false, editingWidget: null }),
      setEditingWidget: (widget) => set({ editingWidget: widget }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      setTheme: (theme) => set({ theme }),

      exportConfig: () => {
        const { widgets, theme } = get();
        return JSON.stringify({ widgets, theme }, null, 2);
      },

      importConfig: (config) => {
        try {
          const parsed = JSON.parse(config);
          if (parsed.widgets && Array.isArray(parsed.widgets)) {
            set({
              widgets: parsed.widgets,
              theme: parsed.theme || 'dark',
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      clearAllWidgets: () => set({ widgets: [] }),
    }),
    {
      name: 'finboard-storage',
      partialize: (state) => ({
        // Only persist configuration, not runtime data
        widgets: state.widgets.map(w => ({
          id: w.id,
          name: w.name,
          apiUrl: w.apiUrl,
          refreshInterval: w.refreshInterval,
          displayMode: w.displayMode,
          selectedFields: w.selectedFields,
          position: w.position,
          // Don't persist: data, error, isLoading, lastUpdated
        })),
        theme: state.theme,
      }),
    }
  )
);

