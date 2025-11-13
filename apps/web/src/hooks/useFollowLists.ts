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

  const load = async () => {
    if (!userId) return;

    // Usar consultas separadas para evitar problemas con sintaxis de foreign keys
    // Esto es más confiable y funciona siempre
    
    // 1. Obtener IDs de usuarios que sigue
    const { data: followingIds, error: followingIdsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    
    // 2. Obtener IDs de usuarios que lo siguen
    const { data: followerIds, error: followerIdsError } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);

    if (followingIdsError) {
      console.error('[useFollowLists] Error fetching following IDs:', followingIdsError);
    }
    if (followerIdsError) {
      console.error('[useFollowLists] Error fetching follower IDs:', followerIdsError);
    }

    // 3. Obtener perfiles de usuarios que sigue
    let followingData: FollowProfile[] = [];
    if (followingIds && followingIds.length > 0) {
      const userIds = followingIds.map((f: any) => f.following_id);
      const { data: followingProfiles, error: followingProfilesError } = await supabase
        .from('profiles_user')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      
      if (followingProfilesError) {
        console.error('[useFollowLists] Error fetching following profiles:', followingProfilesError);
      } else {
        followingData = (followingProfiles || [])
          .map((p: any) => ({
            id: p.user_id || p.id || '',
            display_name: p.display_name || null,
            slug: p.slug || null,
            avatar_url: p.avatar_url || null,
          }))
          .filter((p: FollowProfile) => p.id) as FollowProfile[];
      }
    }

    // 4. Obtener perfiles de usuarios que lo siguen
    let followersData: FollowProfile[] = [];
    if (followerIds && followerIds.length > 0) {
      const userIds = followerIds.map((f: any) => f.follower_id);
      const { data: followerProfiles, error: followerProfilesError } = await supabase
        .from('profiles_user')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      
      if (followerProfilesError) {
        console.error('[useFollowLists] Error fetching follower profiles:', followerProfilesError);
      } else {
        followersData = (followerProfiles || [])
          .map((p: any) => ({
            id: p.user_id || p.id || '',
            display_name: p.display_name || null,
            slug: p.slug || null,
            avatar_url: p.avatar_url || null,
          }))
          .filter((p: FollowProfile) => p.id) as FollowProfile[];
      }
    }

    console.log('[useFollowLists] Following data:', followingData);
    console.log('[useFollowLists] Followers data:', followersData);

    setFollowing(followingData);
    setFollowers(followersData);

  };

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      await load();
    };
    loadData();
    return () => {
      active = false;
    };
  }, [userId]);

  const refetch = async () => {
    if (!userId) return;
    await load();
  };

  return { following, followers, refetch };
}


