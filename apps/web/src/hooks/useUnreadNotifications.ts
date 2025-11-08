import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useUnreadNotifications(userId?: string) {
  const [unread, setUnread] = useState(0);

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
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { unread, hasUnread: unread > 0 };
}


