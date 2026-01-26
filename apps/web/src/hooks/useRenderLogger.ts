import { useEffect, useRef } from 'react';

/**
 * Hook to log component renders for performance debugging
 * Only logs in development mode
 */
export function useRenderLogger(componentName: string, props?: Record<string, any>) {
  const renderCount = useRef(0);
  const prevProps = useRef(props);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    renderCount.current += 1;
    const count = renderCount.current;

    // Log first render
    if (count === 1) {
      console.log(`[RenderLogger] ${componentName} - First render`, props || {});
      return;
    }

    // Log subsequent renders with changed props
    if (props && prevProps.current) {
      const changedProps: Record<string, { from: any; to: any }> = {};
      Object.keys(props).forEach(key => {
        if (props[key] !== prevProps.current![key]) {
          changedProps[key] = {
            from: prevProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[RenderLogger] ${componentName} - Render #${count}`, {
          changedProps,
          timestamp: performance.now(),
        });
      }
    } else {
      console.log(`[RenderLogger] ${componentName} - Render #${count}`, {
        timestamp: performance.now(),
      });
    }

    prevProps.current = props;
  });

  return renderCount.current;
}
