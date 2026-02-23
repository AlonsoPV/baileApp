import React from 'react';
import { useLocation } from 'react-router-dom';
import AppRouter from './AppRouter';
import { initHotjar, trackPageView } from './lib/hotjar';

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
      initHotjar();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    // Trackear cambio de página (después de que Hotjar esté listo)
    if (pathname) {
      // Pequeño delay para asegurar que Hotjar está inicializado
      const timer = setTimeout(() => {
        trackPageView(pathname);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <HotjarTracker />
      <AppRouter />
    </>
  );
}
