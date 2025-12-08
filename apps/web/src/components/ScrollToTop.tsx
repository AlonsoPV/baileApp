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
    // Hacer scroll al top cuando cambia la ruta
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth', // Scroll suave
    });
  }, [pathname]);

  return null;
}

