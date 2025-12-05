'use client';

import { useMemo, useCallback } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { useDashboardStore } from '@/store/dashboardStore';
import WidgetCard from './widgets/WidgetCard';
import EmptyState from './EmptyState';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export default function Dashboard() {
  const { widgets, updateWidgetPosition } = useDashboardStore();

  // Generate layout from widgets
  const layout: Layout[] = useMemo(() => {
    return widgets.map((widget) => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: 2,
      minH: 2,
      maxW: 12,
    }));
  }, [widgets]);

  // Handle layout changes
  const onLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      newLayout.forEach((item) => {
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

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={100}
        width={typeof window !== 'undefined' ? window.innerWidth - 48 : 1200}
        onLayoutChange={onLayoutChange}
        draggableHandle=".drag-handle"
        isResizable={true}
        isDraggable={true}
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
      >
        {widgets.map((widget) => (
          <div key={widget.id}>
            <WidgetCard widget={widget} />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}

