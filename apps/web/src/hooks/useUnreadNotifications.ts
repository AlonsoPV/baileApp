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

    const channel = supabase
      .channel(`notifications-unread:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => setUnread((prev) => prev + 1)
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
          // Si alguna pasa a is_read=true, decrémentalo en caliente o recalc
          const becameRead = (payload.new as any)?.is_read === true && (payload.old as any)?.is_read === false;
          if (becameRead) {
            setUnread((prev) => Math.max(prev - 1, 0));
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { unread, hasUnread: unread > 0, markAllAsRead };
}


