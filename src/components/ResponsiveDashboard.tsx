'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useDashboardStore } from '@/store/dashboardStore';
import WidgetCard from './widgets/WidgetCard';
import EmptyState from './EmptyState';
import AddWidgetCard from './widgets/AddWidgetCard';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function ResponsiveDashboard() {
  const { widgets, updateWidgetPosition } = useDashboardStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate proper positions for widgets
  const getWidgetLayout = useCallback((widget: typeof widgets[0], index: number): Layout => {
    const widgetWidth = widget.position.w || 4;
    const widgetHeight = widget.position.h || 3;
    
    // If position is valid (not Infinity), use it
    if (widget.position.y !== Infinity && widget.position.y < 1000) {
      return {
        i: widget.id,
        x: widget.position.x,
        y: widget.position.y,
        w: widgetWidth,
        h: widgetHeight,
        minW: 2,
        minH: 2,
      };
    }
    
    // Calculate position based on index - 3 widgets per row
    const cols = 12;
    const widgetsPerRow = Math.floor(cols / widgetWidth);
    const row = Math.floor(index / widgetsPerRow);
    const col = index % widgetsPerRow;
    
    return {
      i: widget.id,
      x: col * widgetWidth,
      y: row * widgetHeight,
      w: widgetWidth,
      h: widgetHeight,
      minW: 2,
      minH: 2,
    };
  }, []);

  // Generate layouts for different breakpoints
  const layouts = useMemo(() => {
    const lg: Layout[] = widgets.map((widget, index) => getWidgetLayout(widget, index));

    // For medium screens - 2 columns
    const md: Layout[] = widgets.map((widget, index) => ({
      i: widget.id,
      x: (index % 2) * 5,
      y: Math.floor(index / 2) * (widget.position.h || 3),
      w: 5,
      h: widget.position.h || 3,
      minW: 2,
      minH: 2,
    }));

    // For small screens - stack vertically
    const sm: Layout[] = widgets.map((widget, index) => ({
      i: widget.id,
      x: 0,
      y: index * (widget.position.h || 3),
      w: 6,
      h: widget.position.h || 3,
      minW: 2,
      minH: 2,
    }));

    const xs: Layout[] = widgets.map((widget, index) => ({
      i: widget.id,
      x: 0,
      y: index * (widget.position.h || 3),
      w: 4,
      h: widget.position.h || 3,
      minW: 2,
      minH: 2,
    }));

    return { lg, md, sm, xs };
  }, [widgets, getWidgetLayout]);

  // Handle layout changes
  const onLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      currentLayout.forEach((item) => {
        const widget = widgets.find((w) => w.id === item.i);
        if (widget) {
          const hasChanged =
            widget.position.x !== item.x ||
            widget.position.y !== item.y ||
            widget.position.w !== item.w ||
            widget.position.h !== item.h;

          if (hasChanged) {
            updateWidgetPosition(item.i, {
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
            });
          }
        }
      });
    },
    [widgets, updateWidgetPosition]
  );

  if (widgets.length === 0) {
    return <EmptyState />;
  }

  if (!mounted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((widget) => (
            <div key={widget.id} className="h-[300px]">
              <WidgetCard widget={widget} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={100}
        onLayoutChange={onLayoutChange}
        draggableHandle=".drag-handle"
        isResizable={true}
        isDraggable={true}
        compactType="vertical"
        preventCollision={false}
        margin={[12, 12]}
        useCSSTransforms={true}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="h-full">
            <WidgetCard widget={widget} />
          </div>
        ))}
      </ResponsiveGridLayout>
      
      {/* Add Widget Card - shown below the grid */}
      <div className="mt-4 max-w-xs">
        <AddWidgetCard />
      </div>
    </div>
  );
}
