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
    const { error } = await supabase
      .from("profiles_user")
      .update({ media: list })
      .eq("user_id", user!.id);
    if (error) throw error;
  }

  const addMedia = useMutation({
    mutationFn: async (file: File) => {
      const item = await uploadUserFile(user!.id, file);
      const next = [item, ...(mediaQuery.data || [])];
      await setMedia(next);
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(user?.id) });
      qc.invalidateQueries({ queryKey: ["profile","me", user?.id] }); // refresca el perfil también
    },
  });

  const removeMediaMut = useMutation({
    mutationFn: async (id: string) => {
      await removeUserFile(id);
      const next = (mediaQuery.data || []).filter(m => m.id !== id);
      await setMedia(next);
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(user?.id) });
      qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
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
