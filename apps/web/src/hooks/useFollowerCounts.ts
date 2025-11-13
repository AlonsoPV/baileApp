import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface FollowCounts {
  followers: number;
  following: number;
}

export function useFollowerCounts(userId?: string) {
  const [counts, setCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    if (!userId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles_user')
      .select('followers_count, following_count')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[useFollowerCounts] error', error);
      setLoading(false);
      return;
    }

    if (data) {
      setCounts({
        followers: data.followers_count ?? 0,
        following: data.following_count ?? 0,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles_user')
        .select('followers_count, following_count')
        .eq('user_id', userId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error('[useFollowerCounts] error', error);
        setLoading(false);
        return;
      }

      if (data) {
        setCounts({
          followers: data.followers_count ?? 0,
          following: data.following_count ?? 0,
        });
      }
      setLoading(false);
    };

    load();

    return () => {
      active = false;
    };
  }, [userId]);

  return { counts, setCounts, refetch, loading };
}


