'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Widget } from '@/types';
import { getValueAtPath } from '@/utils/apiUtils';
import { useDashboardStore } from '@/store/dashboardStore';

interface WidgetChartProps {
  widget: Widget;
}

const CHART_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export default function WidgetChart({ widget }: WidgetChartProps) {
  const { theme } = useDashboardStore();
  const isLight = theme === 'light';
  
  const gridColor = isLight ? '#e2e8f0' : '#374151';
  const textColor = isLight ? '#64748b' : '#9ca3af';
  const tooltipBg = isLight ? '#ffffff' : '#1f2937';
  const tooltipBorder = isLight ? '#e2e8f0' : '#374151';
  // Extract chart data from widget data
  const chartData = useMemo(() => {
    if (!widget.data) return [];

    // Try to find array data for charting
    const findChartData = (obj: unknown, depth = 0): unknown[] | null => {
      if (depth > 3) return null;
      if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
        return obj;
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
          const result = findChartData(value, depth + 1);
          if (result) return result;
        }
      }
      return null;
    };

    // First try selected fields
    for (const field of widget.selectedFields) {
      const value = getValueAtPath(widget.data, field.path);
      if (Array.isArray(value) && value.length > 0) {
        return value;
      }
    }

    // Fall back to finding any array
    const arrayData = findChartData(widget.data);
    if (arrayData) return arrayData;

    // If no array, create a single data point from selected fields
    const singlePoint: Record<string, unknown> = { name: widget.name };
    widget.selectedFields.forEach((field) => {
      const value = getValueAtPath(widget.data, field.path);
      if (typeof value === 'number') {
        singlePoint[field.label] = value;
      }
    });
    
    return Object.keys(singlePoint).length > 1 ? [singlePoint] : [];
  }, [widget.data, widget.selectedFields, widget.name]);

  // Get numeric keys for charting
  const numericKeys = useMemo(() => {
    if (chartData.length === 0) return [];
    const firstItem = chartData[0];
    if (typeof firstItem !== 'object' || firstItem === null) return [];
    
    return Object.entries(firstItem as Record<string, unknown>)
      .filter(([, value]) => typeof value === 'number')
      .map(([key]) => key);
  }, [chartData]);

  // Get x-axis key (first non-numeric string key or index)
  const xAxisKey = useMemo(() => {
    if (chartData.length === 0) return 'index';
    const firstItem = chartData[0];
    if (typeof firstItem !== 'object' || firstItem === null) return 'index';
    
    const stringKey = Object.entries(firstItem as Record<string, unknown>)
      .find(([, value]) => typeof value === 'string');
    
    return stringKey?.[0] || 'name';
  }, [chartData]);

  // Add index if needed
  const processedData = useMemo(() => {
    return chartData.map((item, index) => ({
      ...(typeof item === 'object' ? item : {}),
      index,
    }));
  }, [chartData]);

  const chartType = widget.chartType || 'line';

  if (chartData.length === 0 || numericKeys.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-slate-500">
        No numeric data available for charting. Please select fields with numeric values.
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    const tooltipStyle = {
      backgroundColor: tooltipBg,
      border: `1px solid ${tooltipBorder}`,
      borderRadius: '8px',
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey={xAxisKey}
              stroke={textColor}
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke={textColor} fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: isLight ? '#0f172a' : '#fff' }}
            />
            <Legend />
            {numericKeys.slice(0, 6).map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey={xAxisKey}
              stroke={textColor}
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke={textColor} fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: isLight ? '#0f172a' : '#fff' }}
            />
            <Legend />
            {numericKeys.slice(0, 6).map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey={xAxisKey}
              stroke={textColor}
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke={textColor} fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: isLight ? '#0f172a' : '#fff' }}
            />
            <Legend />
            {numericKeys.slice(0, 6).map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], r: 4 }}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <div className="h-full w-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

