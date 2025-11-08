import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface FollowProfile {
  id: string;
  display_name: string | null;
  slug?: string | null;
  avatar_url: string | null;
  role?: string | null;
}

export function useFollowLists(userId?: string) {
  const [following, setFollowing] = useState<FollowProfile[]>([]);
  const [followers, setFollowers] = useState<FollowProfile[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!userId) return;

      // Primer intento: incluir slug
      let followingRes: any = await supabase
        .from('follows')
        .select('following:profiles_user!follows_following_id_fkey ( id:user_id, display_name, slug, avatar_url )')
        .eq('follower_id', userId);

      let followersRes: any = await supabase
        .from('follows')
        .select('follower:profiles_user!follows_follower_id_fkey ( id:user_id, display_name, slug, avatar_url )')
        .eq('following_id', userId);

      // Si el proyecto no tiene columna slug, reintenta sin slug para evitar 42703
      const needsFallback =
        !!followingRes.error && followingRes.error.code === '42703' ||
        !!followersRes.error && followersRes.error.code === '42703';

      if (needsFallback) {
        followingRes = await supabase
          .from('follows')
          .select('following:profiles_user!follows_following_id_fkey ( id:user_id, display_name, avatar_url )')
          .eq('follower_id', userId);

        followersRes = await supabase
          .from('follows')
          .select('follower:profiles_user!follows_follower_id_fkey ( id:user_id, display_name, avatar_url )')
          .eq('following_id', userId);
      }

      if (!active) return;

      if (followingRes.error) {
        console.error('[useFollowLists] following error', followingRes.error);
      }
      if (followersRes.error) {
        console.error('[useFollowLists] followers error', followersRes.error);
      }

      const followingData =
        followingRes.data?.map((row: any) => row.following).filter(Boolean) ?? [];
      const followersData =
        followersRes.data?.map((row: any) => row.follower).filter(Boolean) ?? [];

      setFollowing(followingData);
      setFollowers(followersData);
    };

    load();

    return () => {
      active = false;
    };
  }, [userId]);

  return { following, followers };
}


