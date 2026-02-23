import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que hace scroll automático al top cuando cambia la ruta
 * 
 * Uso: Agregar dentro de BrowserRouter pero fuera de Routes
 * 
 * ```tsx
 * <BrowserRouter>
 *   <ScrollToTop />
 *   <Routes>...</Routes>
 * </BrowserRouter>
 * ```
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
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

