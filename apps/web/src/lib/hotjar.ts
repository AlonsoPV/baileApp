/**
 * Hotjar integration - Optimized for performance
 * 
 * Loads Hotjar asynchronously without blocking initial render.
 * Only loads in production and after critical content is ready.
 */

const HOTJAR_ID = import.meta.env.VITE_HOTJAR_ID || '';
const HOTJAR_SNIPPET_VERSION = 6;

let hotjarInitialized = false;
let loadAttempted = false;

/**
 * Check if Hotjar should be loaded (production only, ID present)
 */
function shouldLoadHotjar(): boolean {
  if (!HOTJAR_ID) {
    if (import.meta.env.DEV) {
      console.log('[Hotjar] Skipping - No HOTJAR_ID configured');
    }
    return false;
  }

  if (import.meta.env.DEV) {
    // En desarrollo, solo cargar si explícitamente se pide con ?hotjar=1
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('hotjar') === '1';
  }

  return true;
}

/**
 * Load Hotjar script asynchronously
 */
function loadHotjarScript(): void {
  if (typeof window === 'undefined' || hotjarInitialized) return;

  // Mark as attempted to prevent multiple loads
  loadAttempted = true;

  try {
    // Create and inject Hotjar script
    (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
      h.hj =
        h.hj ||
        function() {
          (h.hj.q = h.hj.q || []).push(arguments);
        };
      h._hjSettings = { hjid: Number(HOTJAR_ID), hjsv: HOTJAR_SNIPPET_VERSION };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script');
      r.async = true;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

    hotjarInitialized = true;
    if (import.meta.env.DEV) {
      console.log('[Hotjar] Script loaded successfully');
    }
  } catch (error) {
    console.warn('[Hotjar] Failed to load script:', error);
  }
}

/**
 * Initialize Hotjar with performance optimizations
 * 
 * - Loads after critical content (requestIdleCallback or setTimeout fallback)
 * - Only in production by default
 * - Non-blocking, async loading
 */
export function initHotjar(): void {
  if (!shouldLoadHotjar() || loadAttempted) return;

  // Use requestIdleCallback if available (waits for browser idle time)
  // Fallback to setTimeout with delay if not available
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        // Additional delay to ensure critical content is rendered
        setTimeout(loadHotjarScript, 100);
      },
      { timeout: 2000 } // Max wait 2s if never idle
    );
  } else {
    // Fallback: load after initial render (500ms delay)
    setTimeout(loadHotjarScript, 500);
  }
}

/**
 * Track page view in Hotjar
 * Call this when route changes
 */
export function trackPageView(path: string): void {
  if (typeof window === 'undefined' || !hotjarInitialized || !window.hj) return;

  try {
    window.hj('stateChange', path);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Hotjar] Failed to track page view:', error);
    }
  }
}

/**
 * Track event in Hotjar
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined' || !hotjarInitialized || !window.hj) return;

  try {
    // Hotjar doesn't have a direct event tracking API like GA
    // But we can track via stateChange with custom paths
    if (eventName) {
      window.hj('stateChange', `/event/${eventName}`, properties || {});
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Hotjar] Failed to track event:', error);
    }
  }
}

/**
 * Identify user in Hotjar (for session tracking)
 */
export function identifyUser(userId: string, attributes?: Record<string, any>): void {
  if (typeof window === 'undefined' || !hotjarInitialized || !window.hj) return;

  try {
    window.hj('identify', userId, attributes || {});
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Hotjar] Failed to identify user:', error);
    }
  }
}

// Extend Window interface for Hotjar
declare global {
  interface Window {
    hj?: (...args: any[]) => void;
    _hjSettings?: { hjid: number; hjsv: number };
  }
}
