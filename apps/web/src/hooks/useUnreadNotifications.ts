import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useUnreadNotifications(userId?: string) {
  const [unread, setUnread] = useState(0);

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

    if (!userId) {
      setUnread(0);
      return undefined;
    }

    const load = async () => {
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
    };

    load();

    // Suscripción a Realtime con manejo de errores
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    try {
      channel = supabase
        .channel(`notifications-unread:${userId}`)
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
            // Si alguna pasa a is_read=true, decrémentalo en caliente o recalc
            const becameRead = (payload.new as any)?.is_read === true && (payload.old as any)?.is_read === false;
            if (becameRead) {
              setUnread((prev) => Math.max(prev - 1, 0));
            }
          }
        )
        .subscribe((status) => {
          // Manejar estados de la suscripción
          if (status === 'SUBSCRIBED') {
            // Suscripción exitosa
            if (import.meta.env.MODE === 'development') {
              console.log('[useUnreadNotifications] Realtime subscribed successfully');
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // Error en la conexión - no es crítico, la app funciona sin Realtime
            if (import.meta.env.MODE === 'development') {
              console.warn('[useUnreadNotifications] Realtime subscription issue (non-critical):', status);
            }
            // La app seguirá funcionando con polling manual si es necesario
          }
        });
    } catch (error) {
      // Si falla la suscripción, no es crítico - la app funciona sin Realtime
      if (import.meta.env.MODE === 'development') {
        console.warn('[useUnreadNotifications] Failed to subscribe to Realtime (non-critical):', error);
      }
    }

    return () => {
      active = false;
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          // Ignorar errores al remover el canal
          if (import.meta.env.MODE === 'development') {
            console.warn('[useUnreadNotifications] Error removing channel:', error);
          }
        }
      }
    };
  }, [userId]);

  return { unread, hasUnread: unread > 0, markAllAsRead };
}


