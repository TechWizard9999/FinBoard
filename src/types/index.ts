// Widget Types
export type WidgetDisplayMode = 'card' | 'table' | 'chart';
export type ChartType = 'line' | 'bar' | 'area' | 'candlestick';

export interface WidgetField {
  path: string;
  label: string;
  value?: unknown;
  type?: string;
}

export interface Widget {
  id: string;
  name: string;
  apiUrl: string;
  refreshInterval: number;
  displayMode: WidgetDisplayMode;
  chartType?: ChartType;
  selectedFields: WidgetField[];
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  lastUpdated?: string;
  data?: unknown;
  isLoading?: boolean;
  error?: string | null;
}

export interface DashboardState {
  widgets: Widget[];
  theme: 'dark' | 'light';
  isAddWidgetModalOpen: boolean;
  editingWidget: Widget | null;
}

export interface ApiTestResult {
  success: boolean;
  data?: unknown;
  fields?: FieldNode[];
  error?: string;
  topLevelFieldCount?: number;
}

export interface FieldNode {
  path: string;
  key: string;
  value: unknown;
  type: string;
  children?: FieldNode[];
  isArray?: boolean;
  isExpanded?: boolean;
}

