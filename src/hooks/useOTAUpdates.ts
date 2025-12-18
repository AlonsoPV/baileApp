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
 * 
 * @param options - Opciones de configuración
 * @param options.enableDiagnostics - Si es true, registra información detallada para diagnóstico (default: false)
 * @param options.checkDelay - Delay en ms antes de verificar actualizaciones (default: 2000)
 */
export function useOTAUpdates(options?: {
  enableDiagnostics?: boolean;
  checkDelay?: number;
}) {
  const { enableDiagnostics = false, checkDelay = 2000 } = options || {};

  useEffect(() => {
    async function checkForUpdates() {
      try {
        // Log de diagnóstico
        if (enableDiagnostics) {
          console.log('[OTA Updates] Iniciando verificación de actualizaciones...');
          console.log('[OTA Updates] Updates.isEnabled:', Updates.isEnabled);
          console.log('[OTA Updates] Updates.updateId:', Updates.updateId);
          console.log('[OTA Updates] Updates.createdAt:', Updates.createdAt);
          console.log('[OTA Updates] Updates.runtimeVersion:', Updates.runtimeVersion);
        }

        // Solo verificar actualizaciones en builds de producción
        // @ts-ignore - __DEV__ es una variable global de React Native
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[OTA Updates] Modo desarrollo - OTA deshabilitado');
          return;
        }

        // Verificar si Expo Updates está disponible y habilitado
        if (!Updates.isEnabled) {
          const reason = enableDiagnostics 
            ? 'Expo Updates está deshabilitado en la configuración (app.config.ts: updates.enabled = false)'
            : 'Expo Updates no está habilitado';
          console.log(`[OTA Updates] ${reason}`);
          
          if (enableDiagnostics) {
            console.log('[OTA Updates] Diagnóstico: Verifica app.config.ts y Expo.plist');
          }
          return;
        }

        // Verificar si hay actualizaciones disponibles
        if (enableDiagnostics) {
          console.log('[OTA Updates] Verificando actualizaciones disponibles...');
        }
        
        const update = await Updates.checkForUpdateAsync();
        
        if (enableDiagnostics) {
          console.log('[OTA Updates] Resultado de checkForUpdateAsync:', {
            isAvailable: update.isAvailable,
            manifest: update.manifest ? 'presente' : 'ausente',
          });
        }
        
        if (update.isAvailable) {
          console.log('[OTA Updates] Actualización disponible, descargando...');
          
          if (enableDiagnostics) {
            console.log('[OTA Updates] Información de la actualización:', {
              manifest: update.manifest,
            });
          }
          
          // Descargar la actualización
          const fetchResult = await Updates.fetchUpdateAsync();
          
          if (enableDiagnostics) {
            console.log('[OTA Updates] Resultado de fetchUpdateAsync:', {
              isNew: fetchResult.isNew,
              manifest: fetchResult.manifest ? 'presente' : 'ausente',
            });
          }
          
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
        
        if (enableDiagnostics && error instanceof Error) {
          console.error('[OTA Updates] Detalles del error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
          
          // Verificar si es un error relacionado con el sistema iOS
          if (error.message.includes('MobileSoftwareUpdate') || 
              error.message.includes('error 78') ||
              error.message.includes('Update finish took too long')) {
            console.warn('[OTA Updates] ⚠️ Error relacionado con MobileSoftwareUpdate del sistema iOS');
            console.warn('[OTA Updates] Consulta DIAGNOSTICO_ERROR_OTA_IOS.md para más información');
          }
        }
      }
    }

    // Verificar actualizaciones después de un pequeño delay
    // para no bloquear el inicio de la app
    const timeoutId = setTimeout(() => {
      checkForUpdates();
    }, checkDelay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enableDiagnostics, checkDelay]);
}

