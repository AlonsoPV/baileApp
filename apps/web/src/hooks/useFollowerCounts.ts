import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface FollowCounts {
  followers: number;
  following: number;
}

export function useFollowerCounts(userId?: string) {
  const [counts, setCounts] = useState<FollowCounts>({ followers: 0, following: 0 });

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from('profiles_user')
        .select('followers_count, following_count')
        .eq('user_id', userId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error('[useFollowerCounts] error', error);
        return;
      }

      if (data) {
        setCounts({
          followers: data.followers_count ?? 0,
          following: data.following_count ?? 0,
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [userId]);

  return { counts, setCounts };
}


