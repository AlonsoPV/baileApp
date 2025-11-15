import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface FollowProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function useFollowLists(userId?: string) {
  const [following, setFollowing] = useState<FollowProfile[]>([]);
  const [followers, setFollowers] = useState<FollowProfile[]>([]);

  const fetchLists = async () => {
    if (!userId) return;

    const [{ data: followingData, error: followingError }, { data: followersData, error: followersError }] = await Promise.all([
      supabase.rpc('get_following_profiles', { p_user_id: userId }),
      supabase.rpc('get_follower_profiles', { p_user_id: userId })
    ]);

    if (followingError) {
      console.error('[useFollowLists] Error fetching following profiles via RPC:', followingError);
    }
    if (followersError) {
      console.error('[useFollowLists] Error fetching follower profiles via RPC:', followersError);
    }

    setFollowing(
      (followingData || []).map((profile: any) => ({
        id: profile.user_id,
        display_name: profile.display_name ?? null,
        avatar_url: profile.avatar_url ?? null,
      }))
    );

    setFollowers(
      (followersData || []).map((profile: any) => ({
        id: profile.user_id,
        display_name: profile.display_name ?? null,
        avatar_url: profile.avatar_url ?? null,
      }))
    );
  };

  useEffect(() => {
    fetchLists();
  }, [userId]);

  const refetch = async () => {
    await fetchLists();
  };

  return { following, followers, refetch };
}


