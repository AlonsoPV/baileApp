import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useUnreadNotifications(userId?: string) {
  const [unread, setUnread] = useState(0);
  // Refs para trackear logs y evitar spam
  const hasLoggedPollingStart = React.useRef(false);
  const hasLoggedWarnings = React.useRef<Set<string>>(new Set());
  const isInProduction = import.meta.env.MODE === 'production';
  // Permite desactivar Realtime (WebSocket) y usar solo polling vía env (ej. en app móvil)
  const disableRealtime =
    import.meta.env.VITE_DISABLE_REALTIME_NOTIFICATIONS === 'true' ||
    import.meta.env.VITE_DISABLE_REALTIME_NOTIFICATIONS === '1';

  // Exponer acción para marcar como leídas desde UI
  const markAllAsRead = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) {
      console.error('[useUnreadNotifications] markAllAsRead error', error);
      return;
    }
    // Recalcular después de marcar como leído
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setUnread(count ?? 0);
  };

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000; // 5 segundos
    const POLLING_INTERVAL = 30000; // 30 segundos como fallback

    if (!userId) {
      setUnread(0);
      return undefined;
    }

    const load = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false);

        if (!active) return;

        if (error) {
          console.error('[useUnreadNotifications] Count error', error);
          return;
        }

        setUnread(count ?? 0);
      } catch (error) {
        console.error('[useUnreadNotifications] Unexpected error loading count', error);
      }
    };

    // Cargar inicialmente
    load();

    // Función para establecer polling como fallback
    const startPolling = () => {
      if (pollingInterval) return; // Ya está activo
      pollingInterval = setInterval(() => {
        if (active) {
          load();
        }
      }, POLLING_INTERVAL);
      // Log solo la primera vez que se inicia polling (reducir spam)
      // Solo en desarrollo y solo una vez por sesión
      if (!isInProduction && !hasLoggedPollingStart.current) {
        console.log('[useUnreadNotifications] Started polling fallback (Realtime unavailable)');
        hasLoggedPollingStart.current = true;
      }
    };

    // Función para detener polling
    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    // Función para suscribirse a Realtime
    const subscribeToRealtime = () => {
      // Limpiar canal anterior si existe, pero dar tiempo para que se cierre correctamente
      if (channel) {
        try {
          // Esperar un momento antes de remover para evitar cerrar conexiones en proceso
          const oldChannel = channel;
          setTimeout(() => {
            try {
              supabase.removeChannel(oldChannel);
            } catch (e) {
              // Ignorar errores al limpiar (puede que ya fue removido)
            }
          }, 100);
        } catch (e) {
          // Ignorar errores al limpiar
        }
        channel = null;
      }

      // Cancelar cualquier retry pendiente antes de crear nueva conexión
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }

      // Verificar que el componente sigue activo antes de crear la conexión
      if (!active) {
        return;
      }

      try {
        const channelName = `notifications-unread:${userId}`;
        const newChannel = supabase
          .channel(channelName, {
            config: {
              // Configuración para mejorar la estabilidad de la conexión
              broadcast: { self: false },
              presence: { key: userId },
            },
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            () => {
              if (active) {
                setUnread((prev) => prev + 1);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (!active) return;
              const becameRead = (payload.new as any)?.is_read === true && (payload.old as any)?.is_read === false;
              if (becameRead) {
                setUnread((prev) => Math.max(prev - 1, 0));
              }
            }
          )
          .subscribe((status) => {
            // Verificar que el componente sigue activo antes de procesar el estado
            if (!active) {
              // Si el componente se desmontó, no procesar el estado
              return;
            }

            if (status === 'SUBSCRIBED') {
              // Suscripción exitosa - detener polling y resetear contador de reintentos
              stopPolling();
              retryCount = 0;
              hasLoggedWarnings.current.clear(); // Reset warnings al reconectar exitosamente
              // No loggear en producción para reducir ruido
            } else if (status === 'CHANNEL_ERROR') {
              // Error en el canal - usar polling como fallback
              // Solo loggear una vez por tipo de error y solo en desarrollo
              // Usar console.log en lugar de console.warn ya que el fallback funciona correctamente
              if (!isInProduction && !hasLoggedWarnings.current.has('CHANNEL_ERROR')) {
                console.log('[useUnreadNotifications] Realtime connection error - using polling fallback (this is expected behavior)');
                hasLoggedWarnings.current.add('CHANNEL_ERROR');
              }
              startPolling();
              
              // Limpiar canal en error para evitar conexiones huérfanas
              if (channel === newChannel) {
                channel = null;
              }
              
              // Intentar reconectar después de un delay (con límite de reintentos)
              if (retryCount < MAX_RETRIES && active) {
                retryCount++;
                retryTimeout = setTimeout(() => {
                  if (active) {
                    subscribeToRealtime();
                  }
                }, RETRY_DELAY * retryCount); // Backoff exponencial
              } else {
                // Después de MAX_RETRIES, dejar de intentar y usar solo polling
                if (!isInProduction && !hasLoggedWarnings.current.has('CHANNEL_ERROR_MAX_RETRIES')) {
                  console.log('[useUnreadNotifications] Max retries reached for Realtime - using polling only (this is expected behavior)');
                  hasLoggedWarnings.current.add('CHANNEL_ERROR_MAX_RETRIES');
                }
              }
            } else if (status === 'TIMED_OUT') {
              // Timeout - usar polling como fallback
              // Solo loggear una vez por tipo de error y solo en desarrollo
              // Usar console.log en lugar de console.warn ya que el fallback funciona correctamente
              if (!isInProduction && !hasLoggedWarnings.current.has('TIMED_OUT')) {
                console.log('[useUnreadNotifications] Realtime timeout - using polling fallback (this is expected behavior)');
                hasLoggedWarnings.current.add('TIMED_OUT');
              }
              startPolling();
              
              // Limpiar canal en timeout
              if (channel === newChannel) {
                channel = null;
              }
              
              // Intentar reconectar
              if (retryCount < MAX_RETRIES && active) {
                retryCount++;
                retryTimeout = setTimeout(() => {
                  if (active) {
                    subscribeToRealtime();
                  }
                }, RETRY_DELAY * retryCount);
              } else {
                // Después de MAX_RETRIES, dejar de intentar y usar solo polling
                if (!isInProduction && !hasLoggedWarnings.current.has('TIMED_OUT_MAX_RETRIES')) {
                  console.log('[useUnreadNotifications] Max retries reached for Realtime - using polling only (this is expected behavior)');
                  hasLoggedWarnings.current.add('TIMED_OUT_MAX_RETRIES');
                }
              }
            } else if (status === 'CLOSED') {
              // Canal cerrado - puede ser normal al desmontar o por error
              // Solo usar polling si el componente sigue activo (no es un cierre esperado)
              if (active) {
                // Solo loggear una vez por tipo de error y solo en desarrollo
                if (!isInProduction && !hasLoggedWarnings.current.has('CLOSED')) {
                  console.log('[useUnreadNotifications] Realtime connection closed - using polling fallback');
                  hasLoggedWarnings.current.add('CLOSED');
                }
                startPolling();
                
                // Limpiar referencia al canal cerrado
                if (channel === newChannel) {
                  channel = null;
                }
                
                // Intentar reconectar solo si el componente sigue activo
                if (retryCount < MAX_RETRIES) {
                  retryCount++;
                  retryTimeout = setTimeout(() => {
                    if (active) {
                      subscribeToRealtime();
                    }
                  }, RETRY_DELAY * retryCount);
                }
              }
            }
          });
        
        // Guardar referencia al canal solo después de crearlo
        channel = newChannel;
      } catch (error) {
        // Si falla la suscripción, usar polling como fallback
        // Solo loggear en desarrollo y solo una vez
        // Usar console.log en lugar de console.warn ya que el fallback funciona correctamente
        if (!isInProduction && !hasLoggedWarnings.current.has('SUBSCRIBE_ERROR')) {
          console.log('[useUnreadNotifications] Failed to subscribe to Realtime - using polling fallback (this is expected behavior)', error);
          hasLoggedWarnings.current.add('SUBSCRIBE_ERROR');
        }
        startPolling();
        
        // Intentar reconectar después de un delay
        if (retryCount < MAX_RETRIES && active) {
          retryCount++;
          retryTimeout = setTimeout(() => {
            if (active) {
              subscribeToRealtime();
            }
          }, RETRY_DELAY * retryCount);
        }
      }
    };

    // Intentar suscribirse inicialmente
    if (disableRealtime) {
      // No abrir WebSocket, usar solo polling
      startPolling();
    } else {
      subscribeToRealtime();
    }

    return () => {
      active = false;
      
      // Limpiar timeouts primero para evitar nuevos intentos de conexión
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      
      // Detener polling
      stopPolling();
      
      // Remover canal con un pequeño delay para dar tiempo a que se cierre correctamente
      if (channel) {
        const channelToRemove = channel;
        channel = null; // Limpiar referencia inmediatamente para evitar uso después de desmontar
        
        // Usar setTimeout para dar tiempo a que cualquier operación pendiente termine
        setTimeout(() => {
          try {
            supabase.removeChannel(channelToRemove);
          } catch (error) {
            // Ignorar errores al remover el canal (puede ser normal si ya fue removido o cerrado)
            // No loggear para reducir ruido
          }
        }, 50); // Pequeño delay para permitir que el WebSocket se cierre correctamente
      }
    };
  }, [userId, disableRealtime]);

  return { unread, hasUnread: unread > 0, markAllAsRead };
}


