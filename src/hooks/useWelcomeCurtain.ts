import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const WELCOME_CURTAIN_FILE = 'hasSeenWelcomeCurtain.json';
const APP_TERMINATED_FILE = 'appTerminated.json';

function getFileUri(filename: string): string {
  return `${FileSystem.documentDirectory ?? ''}${filename}`;
}

/**
 * Hook para manejar la cortina de bienvenida
 * 
 * Comportamiento:
 * - Solo se muestra en cold start (app abierta después de estar cerrada)
 * - NO se muestra al cambiar rutas, volver del background, o hot reload
 * - Persiste el estado usando AsyncStorage
 */
export function useWelcomeCurtain() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Verificar si debe mostrarse la cortina (solo en cold start, primera vez)
  useEffect(() => {
    let mounted = true;

    const checkWelcomeCurtain = async () => {
      try {
        // Verificar si ya vieron la cortina
        const seenUri = getFileUri(WELCOME_CURTAIN_FILE);
        const seenInfo = await FileSystem.getInfoAsync(seenUri);
        const hasSeen = seenInfo.exists;

        // Verificar si la app fue terminada (marcado cuando fue a background)
        const terminatedUri = getFileUri(APP_TERMINATED_FILE);
        const terminatedInfo = await FileSystem.getInfoAsync(terminatedUri);
        const wasTerminated = terminatedInfo.exists;

        if (mounted) {
          // Solo mostrar si nunca han visto la cortina (primera vez)
          // El flag de "terminated" ayuda a distinguir entre cold start y background rápido
          // pero en la primera vez absoluta, mostrar siempre
          const shouldShowCurtain = !hasSeen;
          
          setShouldShow(shouldShowCurtain);
          setIsReady(true);

          // Limpiar el flag de terminación después de verificar
          if (wasTerminated) {
            try {
              await FileSystem.deleteAsync(terminatedUri, { idempotent: true });
            } catch {
              // Ignore deletion errors
            }
          }
        }
      } catch (error) {
        console.error('[useWelcomeCurtain] Error checking state:', error);
        if (mounted) {
          setIsReady(true);
          setShouldShow(false); // En caso de error, no mostrar
        }
      }
    };

    // Pequeño delay para asegurar que AppState está listo
    const timer = setTimeout(() => {
      checkWelcomeCurtain();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Detectar cuando la app va a background (para marcar posible terminación)
  useEffect(() => {
    let backgroundTimer: NodeJS.Timeout | null = null;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        // Cuando la app va a background, esperamos un poco antes de marcar
        // Esto ayuda a distinguir entre "background rápido" y "app cerrada"
        backgroundTimer = setTimeout(async () => {
          try {
            const terminatedUri = getFileUri(APP_TERMINATED_FILE);
            await FileSystem.writeAsStringAsync(
              terminatedUri,
              JSON.stringify({ terminated: true, timestamp: Date.now() }),
              {
                encoding: FileSystem.EncodingType.UTF8,
              }
            );
          } catch (error) {
            console.error('[useWelcomeCurtain] Error setting terminated flag:', error);
          }
        }, 1000); // Esperar 1 segundo antes de marcar como "posiblemente terminada"
      } else if (nextAppState === 'active') {
        // Si la app vuelve a activa rápidamente, cancelar el timer
        // Esto significa que probablemente no fue cerrada
        if (backgroundTimer) {
          clearTimeout(backgroundTimer);
          backgroundTimer = null;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (backgroundTimer) {
        clearTimeout(backgroundTimer);
      }
      subscription.remove();
    };
  }, []);

  // Marcar que ya vieron la cortina
  const markAsSeen = useCallback(async () => {
    try {
      const seenUri = getFileUri(WELCOME_CURTAIN_FILE);
      await FileSystem.writeAsStringAsync(seenUri, JSON.stringify({ seen: true }), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      setShouldShow(false);
    } catch (error) {
      console.error('[useWelcomeCurtain] Error marking as seen:', error);
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

