import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useFollowStatus(targetUserId?: string) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!targetUserId) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error('[useFollowStatus] select error', error);
        return;
      }

      setIsFollowing(!!data);
    };

    load();

    return () => {
      active = false;
    };
  }, [targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        setLoading(false);
        return { requiresAuth: true };
      }

      const res = await fetch('/api/follow-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });

      const payload = await res.json();
      if (!res.ok) {
        console.error('[useFollowStatus] toggle error', payload);
        return { error: payload?.error ?? 'toggle_failed' };
      }

      setIsFollowing(Boolean(payload.following));
      return { following: Boolean(payload.following) };
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  return { isFollowing, toggleFollow, loading };
}


