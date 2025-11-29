import { useEffect } from 'react';
import * as Updates from 'expo-updates';

/**
 * Hook para verificar y descargar actualizaciones OTA automáticamente
 * 
 * Funciona en segundo plano:
 * - Verifica actualizaciones al iniciar la app
 * - Descarga actualizaciones disponibles
 * - Recarga la app automáticamente cuando hay una actualización
 * 
 * Solo funciona en builds de producción (no en desarrollo)
 */
export function useOTAUpdates() {
  useEffect(() => {
    async function checkForUpdates() {
      try {
        // Solo verificar actualizaciones en builds de producción
        // @ts-ignore - __DEV__ es una variable global de React Native
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[OTA Updates] Modo desarrollo - OTA deshabilitado');
          return;
        }

        // Verificar si hay actualizaciones disponibles
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          console.log('[OTA Updates] Actualización disponible, descargando...');
          
          // Descargar la actualización
          const fetchResult = await Updates.fetchUpdateAsync();
          
          if (fetchResult.isNew) {
            console.log('[OTA Updates] Nueva actualización descargada, recargando app...');
            
            // Recargar la app con la nueva actualización
            // Esto reinicia la app automáticamente
            await Updates.reloadAsync();
          } else {
            console.log('[OTA Updates] No hay nueva actualización');
          }
        } else {
          console.log('[OTA Updates] No hay actualizaciones disponibles');
        }
      } catch (error) {
        // No mostrar errores al usuario, solo loguear
        // Las actualizaciones OTA son opcionales y no deben bloquear la app
        console.warn('[OTA Updates] Error al verificar actualizaciones:', error);
      }
    }

    // Verificar actualizaciones después de un pequeño delay
    // para no bloquear el inicio de la app
    const timeoutId = setTimeout(() => {
      checkForUpdates();
    }, 2000); // 2 segundos después del inicio

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
}

