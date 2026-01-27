import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';
import { useDefaultProfile } from './useDefaultProfile';
import { supabase } from '@/lib/supabase';

/**
 * Hook to prefetch profile data for faster navigation
 * Call prefetchDefaultProfile() when user hovers avatar or opens menu
 */
export function useProfilePrefetch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { defaultProfile, getProfileOptions } = useDefaultProfile();
  const uid = user?.id;

  const prefetchDefaultProfile = async () => {
    if (!uid) return;

    const options = getProfileOptions();
    const targetOption = options.find(opt => opt.id === defaultProfile);
    
    if (!targetOption?.hasProfile) {
      // If default profile doesn't exist, prefetch the first available
      const availableOption = options.find(opt => opt.hasProfile);
      if (!availableOption) return;
      await prefetchProfileData(availableOption.id);
    } else {
      await prefetchProfileData(defaultProfile);
    }
  };

  const prefetchProfileData = async (profileType: 'user' | 'organizer' | 'academy' | 'teacher' | 'brand') => {
    if (!uid) return;

    try {
      switch (profileType) {
        case 'user':
          // Prefetch user profile (already likely cached, but ensure it's fresh)
          await queryClient.prefetchQuery({
            queryKey: ['profile', 'me', uid],
            queryFn: async () => {
              const { data, error } = await supabase
                .from('profiles_user')
                .select('user_id, display_name, bio, avatar_url, rol_baile, ritmos_seleccionados, ritmos, zonas, respuestas, redes_sociales, updated_at, created_at')
                .eq('user_id', uid)
                .maybeSingle();
              if (error) throw error;
              return data;
            },
            staleTime: 1000 * 30, // 30 seconds
          });
          break;

        case 'organizer':
          // Prefetch organizer profile
          await queryClient.prefetchQuery({
            queryKey: ['organizer', 'me', uid],
            queryFn: async () => {
              const { data, error } = await supabase
                .from('profiles_organizer')
                .select('*')
                .eq('user_id', uid)
                .maybeSingle();
              if (error && error.code !== 'PGRST116') throw error;
              return data || null;
            },
            staleTime: 0,
          });
          break;

        case 'academy':
          // Prefetch academy profile
          // We currently have two "mine" keys in the repo. Prefetch both to avoid double fetches.
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: ['academy', 'my', uid],
              queryFn: async () => {
                const { data, error } = await supabase
                  .from('profiles_academy')
                  .select('*')
                  .eq('user_id', uid)
                  .maybeSingle();
                if (error && error.code !== 'PGRST116') throw error;
                return data || null;
              },
              staleTime: 0,
            }),
            queryClient.prefetchQuery({
              queryKey: ['academy', 'mine', uid],
              queryFn: async () => {
                const { data, error } = await supabase
                  .from('profiles_academy')
                  .select('*')
                  .eq('user_id', uid)
                  .maybeSingle();
                if (error && error.code !== 'PGRST116') throw error;
                return data || null;
              },
              staleTime: 0,
            }),
          ]);
          break;

        case 'teacher':
          // Prefetch teacher profile
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: ['teacher', 'mine', uid],
              queryFn: async () => {
                const { data, error } = await supabase
                  .from('profiles_teacher')
                  .select('*')
                  .eq('user_id', uid)
                  .maybeSingle();
                if (error && error.code !== 'PGRST116') throw error;
                return data || null;
              },
              staleTime: 0,
            }),
            queryClient.prefetchQuery({
              queryKey: ['teacher', 'me', uid],
              queryFn: async () => {
                const { data, error } = await supabase
                  .from('profiles_teacher')
                  .select('*')
                  .eq('user_id', uid)
                  .maybeSingle();
                if (error && error.code !== 'PGRST116') throw error;
                return data || null;
              },
              staleTime: 0,
            }),
          ]);
          break;

        case 'brand':
          // TODO: Implement when brand profile is ready
          break;
      }
    } catch (error) {
      // Silently fail prefetch - it's just an optimization
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useProfilePrefetch] Prefetch failed:', error);
      }
    }
  };

  return {
    prefetchDefaultProfile,
    prefetchProfileData,
  };
}
