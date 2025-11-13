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

      // Intentar diferentes sintaxis de foreign keys según la estructura de la BD
      let followingRes: any;
      let followersRes: any;
      
      // Opción 1: Intentar con nombres explícitos de foreign keys
      followingRes = await supabase
        .from('follows')
        .select(`
          following_id,
          following:profiles_user!follows_following_id_fkey (
            user_id,
            display_name,
            slug,
            avatar_url
          )
        `)
        .eq('follower_id', userId);

      followersRes = await supabase
        .from('follows')
        .select(`
          follower_id,
          follower:profiles_user!follows_follower_id_fkey (
            user_id,
            display_name,
            slug,
            avatar_url
          )
        `)
        .eq('following_id', userId);

      // Si falla, intentar sin especificar el nombre de la foreign key
      if (followingRes.error || followersRes.error) {
        console.log('[useFollowLists] Intentando sintaxis alternativa...');
        
        // Opción 2: Usar sintaxis sin nombre explícito de foreign key
        followingRes = await supabase
          .from('follows')
          .select(`
            following_id,
            profiles_user!follows_following_id_fkey (
              user_id,
              display_name,
              avatar_url
            )
          `)
          .eq('follower_id', userId);

        followersRes = await supabase
          .from('follows')
          .select(`
            follower_id,
            profiles_user!follows_follower_id_fkey (
              user_id,
              display_name,
              avatar_url
            )
          `)
          .eq('following_id', userId);
      }

      // Si aún falla, hacer consultas separadas
      if (followingRes.error || followersRes.error) {
        console.log('[useFollowLists] Usando consultas separadas...');
        
        // Obtener IDs primero
        const { data: followingIds } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
        
        const { data: followerIds } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId);

        // Luego obtener los perfiles
        if (followingIds && followingIds.length > 0) {
          const userIds = followingIds.map((f: any) => f.following_id);
          const { data: followingProfiles } = await supabase
            .from('profiles_user')
            .select('user_id, display_name, avatar_url')
            .in('user_id', userIds);
          
          followingRes = { data: followingProfiles?.map((p: any) => ({ following: p })) || [], error: null };
        } else {
          followingRes = { data: [], error: null };
        }

        if (followerIds && followerIds.length > 0) {
          const userIds = followerIds.map((f: any) => f.follower_id);
          const { data: followerProfiles } = await supabase
            .from('profiles_user')
            .select('user_id, display_name, avatar_url')
            .in('user_id', userIds);
          
          followersRes = { data: followerProfiles?.map((p: any) => ({ follower: p })) || [], error: null };
        } else {
          followersRes = { data: [], error: null };
        }
      }

      if (followingRes.error) {
        console.error('[useFollowLists] following error', followingRes.error);
      }
      if (followersRes.error) {
        console.error('[useFollowLists] followers error', followersRes.error);
      }

      // Mapear los datos correctamente según la estructura de la respuesta
      let followingData: FollowProfile[] = [];
      let followersData: FollowProfile[] = [];

      if (followingRes.data) {
        followingData = followingRes.data
          .map((row: any) => {
            // Puede venir como row.following o directamente como row
            const profile = row.following || row;
            if (!profile) return null;
            return {
              id: profile.user_id || profile.id || '',
              display_name: profile.display_name || null,
              slug: profile.slug || null,
              avatar_url: profile.avatar_url || null,
            };
          })
          .filter(Boolean) as FollowProfile[];
      }

      if (followersRes.data) {
        followersData = followersRes.data
          .map((row: any) => {
            // Puede venir como row.follower o directamente como row
            const profile = row.follower || row;
            if (!profile) return null;
            return {
              id: profile.user_id || profile.id || '',
              display_name: profile.display_name || null,
              slug: profile.slug || null,
              avatar_url: profile.avatar_url || null,
            };
          })
          .filter(Boolean) as FollowProfile[];
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


