import React from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import AppRouter from './AppRouter';
import { isNativeApp } from './utils/isNativeApp';
import { notifyReadyShell } from './utils/performanceLogger';

const loadHotjar = () => import('./lib/hotjar');

/**
 * Componente que hace scroll automático al top cuando cambia la ruta
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    // Fix media rendering + scroll reset
    // En AppShell el scroll vive en `.app-shell-content` (no en window).
    try {
      const el = document.querySelector('.app-shell-content') as HTMLElement | null;
      if (el) {
        el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } else {
        window.scrollTo(0, 0);
      }
    } catch {}
  }, [pathname]);

  return null;
}

/**
 * Componente para tracking de Hotjar - Carga de forma asíncrona y no bloqueante
 */
function HotjarTracker() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    // Inicializar Hotjar solo una vez, después del mount (no bloquea render inicial)
    const timer = setTimeout(() => {
      void loadHotjar().then(({ initHotjar }) => {
        initHotjar();
      });
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    // Trackear cambio de página (después de que Hotjar esté listo)
    if (pathname) {
      // Pequeño delay para asegurar que Hotjar está inicializado
      const timer = setTimeout(() => {
        void loadHotjar().then(({ trackPageView }) => {
          trackPageView(pathname);
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return null;
}

function NativeShellReadyReporter() {
  const location = useLocation();
  const sentRef = React.useRef(false);

  React.useEffect(() => {
    if (sentRef.current || !isNativeApp(location.search)) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (sentRef.current) return;
        sentRef.current = true;

        const hostWindow = window as any;
        const perfState = (hostWindow.__baileappPerf = hostWindow.__baileappPerf ?? {});
        perfState.firstRender = Date.now();

        if (typeof perfState.jsStart === 'number' && typeof console?.log === 'function') {
          console.log(`[perf] JS start → READY_SHELL: ${perfState.firstRender - perfState.jsStart}ms`);
        }

        notifyReadyShell();
      });
    });
  }, [location.search]);

  return null;
}

export default function App() {
  return (
    <LazyMotion features={domAnimation}>
      <NativeShellReadyReporter />
      <ScrollToTop />
      <HotjarTracker />
      <AppRouter />
    </LazyMotion>
  );
}
