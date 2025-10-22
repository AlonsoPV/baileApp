import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";
import { uploadUserFile, removeUserFile, MediaItem } from "../lib/storage";

const KEY = (uid?: string) => ["profile","media", uid];

export function useUserMedia() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const mediaQuery = useQuery({
    queryKey: KEY(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<MediaItem[]> => {
      const { data, error } = await supabase
        .from("profiles_user")
        .select("media")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.media as MediaItem[]) || [];
    },
  });

  async function setMedia(list: MediaItem[]) {
    try {
      console.log('[useUserMedia] Updating media array:', list.length, 'items');
      const { error } = await supabase.rpc("merge_profiles_user", {
        p_user_id: user!.id, 
        p_patch: { media: list }
      });
      if (error) {
        console.error('[useUserMedia] RPC error:', error);
        throw error;
      }
      console.log('[useUserMedia] Media updated successfully');
    } catch (e: any) {
      console.error('[useUserMedia] Caught error saving media:', e);
      throw e;
    }
  }

  const addMedia = useMutation({
    mutationFn: async (file: File) => {
      console.log('[useUserMedia] Adding media file:', file.name);
      const item = await uploadUserFile(user!.id, file);
      console.log('[useUserMedia] File uploaded to storage:', item.id);
      
      const next = [item, ...(mediaQuery.data || [])];
      await setMedia(next);
      console.log('[useUserMedia] Media list updated in DB');
      
      return next;
    },
    onSuccess: async () => {
      console.log('[useUserMedia] Invalidating queries after media addition');
      await qc.invalidateQueries({ queryKey: KEY(user?.id) });
      await qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
    },
  });

  const removeMediaMut = useMutation({
    mutationFn: async (id: string) => {
      console.log('[useUserMedia] Removing media:', id);
      try {
        // Primero eliminar de storage
        await removeUserFile(id);
        console.log('[useUserMedia] File removed from storage');
        
        // Luego actualizar la lista en DB
        const next = (mediaQuery.data || []).filter(m => m.id !== id);
        await setMedia(next);
        console.log('[useUserMedia] Media list updated in DB');
        
        return next;
      } catch (error) {
        console.error('[useUserMedia] Error removing media:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      console.log('[useUserMedia] Invalidating queries after media removal');
      await qc.invalidateQueries({ queryKey: KEY(user?.id) });
      await qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
    },
  });

  return {
    media: mediaQuery.data || [],
    isLoading: mediaQuery.isLoading,
    addMedia,
    removeMedia: removeMediaMut,
    refetchMedia: mediaQuery.refetch,
  };
}
