import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from "../lib/supabase";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot, upsertMediaSlot, removeMediaSlot, MediaItem } from "../utils/mediaSlots";

const KEY = (uid?: string) => ["profile","media-slots", uid];

export function useUserMediaSlots() {
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
    staleTime: 0, // Siempre considerar los datos como obsoletos para forzar refetch cuando se invalida
    refetchOnWindowFocus: true, // Refrescar cuando vuelves a la ventana
  });

  const setMedia = useMutation({
    mutationFn: async (list: MediaItem[]) => {
      if (!user?.id) throw new Error("No user");
      
      const { error } = await supabase.rpc("merge_profiles_user", {
        p_user_id: user.id,
        p_patch: { media: list }
      });
      
      if (error) throw error;
    },
    onSuccess: async () => {
      // Invalidar queries de media y del perfil para forzar recarga
      await qc.invalidateQueries({ queryKey: KEY(user?.id) });
      await qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
      
      // Forzar refetch inmediato para que los cambios se reflejen de inmediato
      await qc.refetchQueries({ queryKey: KEY(user?.id) });
    },
  });

  const uploadToSlot = useMutation({
    mutationFn: async ({ file, slot, kind }: { file: File; slot: string; kind: "photo" | "video" }) => {
      if (!user?.id) throw new Error("No user");
      
      const ext = file.name.split('.').pop();
      const path = `user-media/${user.id}/${slot}.${ext}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: true });
      
      if (error) throw error;
      
      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from("media")
        .getPublicUrl(path);

      const item: MediaItem = {
        slot,
        kind,
        url: publicUrl.publicUrl,
        title: `${kind === 'photo' ? 'Foto' : 'Video'} ${slot.toUpperCase()}`
      };
      
      const next = upsertMediaSlot(mediaQuery.data || [], item);
      await setMedia.mutateAsync(next);
      
      return next;
    },
    onSuccess: async () => {
      // Invalidar queries de media y del perfil para forzar recarga
      await qc.invalidateQueries({ queryKey: KEY(user?.id) });
      await qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
      
      // Forzar refetch inmediato para que los cambios se reflejen de inmediato
      await qc.refetchQueries({ queryKey: KEY(user?.id) });
    },
  });

  const removeFromSlot = useMutation({
    mutationFn: async (slot: string) => {
      if (!user?.id) throw new Error("No user");
      
      const next = removeMediaSlot(mediaQuery.data || [], slot);
      await setMedia.mutateAsync(next);
      
      return next;
    },
    onSuccess: async () => {
      // Invalidar queries de media y del perfil para forzar recarga
      await qc.invalidateQueries({ queryKey: KEY(user?.id) });
      await qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
      
      // Forzar refetch inmediato para que los cambios se reflejen de inmediato
      await qc.refetchQueries({ queryKey: KEY(user?.id) });
    },
  });

  return {
    media: mediaQuery.data || [],
    isLoading: mediaQuery.isLoading,
    uploadToSlot,
    removeFromSlot,
    refetch: mediaQuery.refetch,
  };
}
