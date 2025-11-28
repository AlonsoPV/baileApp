import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useUnreadNotifications(userId?: string) {
  const [unread, setUnread] = useState(0);
  // Refs para trackear logs y evitar spam
  const hasLoggedPollingStart = React.useRef(false);
  const hasLoggedWarnings = React.useRef<Set<string>>(new Set());

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
      if (import.meta.env.MODE === 'development' && !hasLoggedPollingStart.current) {
        console.log('[useUnreadNotifications] Started polling fallback');
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
      // Limpiar canal anterior si existe
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          // Ignorar errores al limpiar
        }
        channel = null;
      }

      try {
        const channelName = `notifications-unread:${userId}`;
        channel = supabase
          .channel(channelName)
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
            if (!active) return;

            if (status === 'SUBSCRIBED') {
              // Suscripción exitosa - detener polling y resetear contador de reintentos
              stopPolling();
              retryCount = 0;
              hasLoggedWarnings.current.clear(); // Reset warnings al reconectar exitosamente
              // Log solo en desarrollo y solo la primera vez (reducir spam)
              if (import.meta.env.MODE === 'development' && !hasLoggedWarnings.current.has('SUBSCRIBED')) {
                console.log('[useUnreadNotifications] Realtime subscribed successfully');
                hasLoggedWarnings.current.add('SUBSCRIBED');
              }
            } else if (status === 'CHANNEL_ERROR') {
              // Error en el canal - usar polling como fallback
              // Solo loggear una vez por tipo de error (reducir spam)
              if (import.meta.env.MODE === 'development' && !hasLoggedWarnings.current.has('CHANNEL_ERROR')) {
                console.warn('[useUnreadNotifications] Realtime CHANNEL_ERROR - falling back to polling');
                hasLoggedWarnings.current.add('CHANNEL_ERROR');
              }
              startPolling();
              
              // Intentar reconectar después de un delay (con límite de reintentos)
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                retryTimeout = setTimeout(() => {
                  if (active) {
                    subscribeToRealtime();
                  }
                }, RETRY_DELAY * retryCount); // Backoff exponencial
              }
            } else if (status === 'TIMED_OUT') {
              // Timeout - usar polling como fallback
              // Solo loggear una vez por tipo de error (reducir spam)
              if (import.meta.env.MODE === 'development' && !hasLoggedWarnings.current.has('TIMED_OUT')) {
                console.warn('[useUnreadNotifications] Realtime TIMED_OUT - falling back to polling');
                hasLoggedWarnings.current.add('TIMED_OUT');
              }
              startPolling();
              
              // Intentar reconectar
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                retryTimeout = setTimeout(() => {
                  if (active) {
                    subscribeToRealtime();
                  }
                }, RETRY_DELAY * retryCount);
              }
            } else if (status === 'CLOSED') {
              // Canal cerrado - usar polling como fallback
              // Solo loggear una vez por tipo de error (reducir spam)
              if (import.meta.env.MODE === 'development' && !hasLoggedWarnings.current.has('CLOSED')) {
                console.log('[useUnreadNotifications] Realtime CLOSED - falling back to polling');
                hasLoggedWarnings.current.add('CLOSED');
              }
              startPolling();
            }
          });
      } catch (error) {
        // Si falla la suscripción, usar polling como fallback
        if (import.meta.env.MODE === 'development') {
          console.warn('[useUnreadNotifications] Failed to subscribe to Realtime - falling back to polling:', error);
        }
        startPolling();
      }
    };

    // Intentar suscribirse inicialmente
    subscribeToRealtime();

    return () => {
      active = false;
      
      // Limpiar timeouts
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      
      // Detener polling
      stopPolling();
      
      // Remover canal
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          // Ignorar errores al remover el canal
          if (import.meta.env.MODE === 'development') {
            console.warn('[useUnreadNotifications] Error removing channel:', error);
          }
        }
        channel = null;
      }
    };
  }, [userId]);

  return { unread, hasUnread: unread > 0, markAllAsRead };
}


