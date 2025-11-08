import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface FollowProfile {
  id: string;
  display_name: string | null;
  slug: string | null;
  avatar_url: string | null;
  role: string | null;
}

export function useFollowLists(userId?: string) {
  const [following, setFollowing] = useState<FollowProfile[]>([]);
  const [followers, setFollowers] = useState<FollowProfile[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!userId) return;

      const [followingRes, followersRes] = await Promise.all([
        supabase
          .from('follows')
          .select('following:following_id ( id, display_name, slug, avatar_url, role )')
          .eq('follower_id', userId),
        supabase
          .from('follows')
          .select('follower:follower_id ( id, display_name, slug, avatar_url, role )')
          .eq('following_id', userId),
      ]);

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


