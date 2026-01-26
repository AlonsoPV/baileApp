import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to measure profile switch performance
 * Marks when profile UI is ready and measures total duration
 */
export function useProfileSwitchMetrics() {
  const location = useLocation();
  const hasMarkedReady = useRef(false);
  const routeRef = useRef<string | null>(null);

  useEffect(() => {
    // Only measure if we're on a profile route
    const isProfileRoute = location.pathname.startsWith('/profile/');
    if (!isProfileRoute) {
      hasMarkedReady.current = false;
      routeRef.current = null;
      return;
    }

    // Track route changes
    if (routeRef.current !== location.pathname) {
      hasMarkedReady.current = false;
      routeRef.current = location.pathname;
    }

    // Mark route change complete
    if (typeof performance !== 'undefined' && performance.mark) {
      if (!hasMarkedReady.current) {
        performance.mark('profile_switch_route_change_complete');
      }
    }
  }, [location.pathname]);

  /**
   * Helper to check if a performance mark exists
   */
  const markExists = (markName: string): boolean => {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return false;
    }
    const marks = performance.getEntriesByType('mark');
    return marks.some(mark => mark.name === markName);
  };

  /**
   * Call this when the profile component has finished rendering
   * and all critical data is loaded (no spinners, layout stable)
   */
  const markUIReady = (componentName: string) => {
    if (hasMarkedReady.current) return;
    hasMarkedReady.current = true;

    if (typeof performance === 'undefined' || !performance.mark) {
      return;
    }

    performance.mark('profile_switch_ui_ready');
    
    // Only measure if we have the initial click mark (user clicked avatar, not direct navigation)
    const hasClickMark = markExists('profile_switch_click');
    const hasNavigateMark = markExists('profile_switch_navigate_start');
    const hasRouteChangeMark = markExists('profile_switch_route_change_complete');

    if (!hasClickMark) {
      // User navigated directly or refreshed - skip measurement
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProfileSwitchMetrics] Skipping measurement - no click mark (direct navigation/refresh)');
      }
      return;
    }

    // Measure total duration from click to UI ready
    try {
      performance.measure('profile_switch_total', {
        start: 'profile_switch_click',
        end: 'profile_switch_ui_ready',
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ProfileSwitchMetrics] Error measuring total duration:', err);
      }
    }
    
    // Measure navigation duration (if marks exist)
    if (hasNavigateMark && hasRouteChangeMark) {
      try {
        performance.measure('profile_switch_navigation', {
          start: 'profile_switch_navigate_start',
          end: 'profile_switch_route_change_complete',
        });
      } catch (err) {
        // Navigation mark might not exist - ignore silently
      }
    }

    // Measure render duration (if route change mark exists)
    if (hasRouteChangeMark) {
      try {
        performance.measure('profile_switch_render', {
          start: 'profile_switch_route_change_complete',
          end: 'profile_switch_ui_ready',
        });
      } catch (err) {
        // Route change mark might not exist - ignore silently
      }
    }

    // Log metrics
    try {
      const totalMeasure = performance.getEntriesByName('profile_switch_total')[0] as PerformanceMeasure;
      const navMeasure = performance.getEntriesByName('profile_switch_navigation')[0] as PerformanceMeasure;
      const renderMeasure = performance.getEntriesByName('profile_switch_render')[0] as PerformanceMeasure;

      if (totalMeasure) {
        const metrics = {
          component: componentName,
          total: Math.round(totalMeasure.duration),
          navigation: navMeasure ? Math.round(navMeasure.duration) : null,
          render: renderMeasure ? Math.round(renderMeasure.duration) : null,
          route: location.pathname,
        };

        if (process.env.NODE_ENV === 'development') {
          console.log('[ProfileSwitchMetrics]', metrics);
        }

        // Send to analytics if available (non-blocking)
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'profile_switch_performance', {
            component: componentName,
            total_ms: metrics.total,
            navigation_ms: metrics.navigation,
            render_ms: metrics.render,
          });
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ProfileSwitchMetrics] Error logging metrics:', err);
      }
    }
  };

  return { markUIReady };
}
