import { useState, useEffect, useCallback } from 'react';

const WELCOME_CURTAIN_KEY = '@baileapp:hasSeenWelcomeCurtain';
const APP_TERMINATED_KEY = '@baileapp:appTerminated';

/**
 * Hook para manejar la cortina de bienvenida en web
 * 
 * Comportamiento:
 * - Solo se muestra en cold start (primera vez que se abre la página)
 * - NO se muestra al cambiar rutas o recargar la página
 * - Persiste el estado usando localStorage
 */
export function useWelcomeCurtainWeb() {
  // Verificar de forma síncrona para que aparezca inmediatamente
  const checkWelcomeCurtainSync = () => {
    try {
      // Verificar si ya vieron la cortina
      const hasSeen = localStorage.getItem(WELCOME_CURTAIN_KEY) === 'true';
      // Solo mostrar si nunca han visto la cortina (primera vez)
      return !hasSeen;
    } catch (error) {
      console.error('[useWelcomeCurtainWeb] Error checking state:', error);
      return false; // En caso de error, no mostrar
    }
  };

  // Estado inicial síncrono para que aparezca inmediatamente
  const [shouldShow, setShouldShow] = useState(() => checkWelcomeCurtainSync());
  const [isReady, setIsReady] = useState(true); // Ya está listo desde el inicio

  // Verificar si debe mostrarse la cortina (solo en cold start, primera vez)
  useEffect(() => {
    // Verificación adicional asíncrona para limpiar flags
    try {
      // Verificar si la página fue cerrada (marcado cuando se detecta beforeunload)
      const wasTerminated = sessionStorage.getItem(APP_TERMINATED_KEY) === 'true';

      // Limpiar el flag de terminación después de verificar
      if (wasTerminated) {
        try {
          sessionStorage.removeItem(APP_TERMINATED_KEY);
        } catch {
          // Ignore deletion errors
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }, []);

  // Detectar cuando la página se va a cerrar (para marcar posible terminación)
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        // Marcar que la página se está cerrando
        sessionStorage.setItem(APP_TERMINATED_KEY, 'true');
      } catch (error) {
        console.error('[useWelcomeCurtainWeb] Error setting terminated flag:', error);
      }
    };

    // También detectar cuando la página pierde el foco (pestaña cerrada)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          // Marcar después de un delay para distinguir entre cambio de pestaña y cierre
          setTimeout(() => {
            try {
              sessionStorage.setItem(APP_TERMINATED_KEY, 'true');
            } catch {
              // Ignore errors
            }
          }, 1000);
        } catch (error) {
          // Ignore errors
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Marcar que ya vieron la cortina
  const markAsSeen = useCallback(() => {
    try {
      localStorage.setItem(WELCOME_CURTAIN_KEY, 'true');
      setShouldShow(false);
    } catch (error) {
      console.error('[useWelcomeCurtainWeb] Error marking as seen:', error);
      // Aún así ocultar la cortina en caso de error
      setShouldShow(false);
    }
  }, []);

  return {
    shouldShow,
    isReady,
    markAsSeen,
  };
}

