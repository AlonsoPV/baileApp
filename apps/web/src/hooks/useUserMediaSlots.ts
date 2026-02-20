import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from "../lib/supabase";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot, upsertMediaSlot, removeMediaSlot, MediaItem } from "../utils/mediaSlots";
import { extractStoragePathFromPublicUrl } from "../utils/storageUrl";

const KEY = (uid?: string) => ["profile","media-slots", uid];
const BUCKET = "media";

function logProfileImage(
  op: "UPLOAD" | "DELETE" | "REPLACE",
  phase: string,
  payload: Record<string, unknown>
) {
  if (import.meta.env.DEV && typeof console !== "undefined") {
    console.log(`[ProfileImage][${op}][${phase}]`, payload);
  }
}

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
      // UserProfileLive usa useUserMedia con key ["profile","media"]
      await qc.invalidateQueries({ queryKey: ["profile","media", user?.id] });
      // UserPublicScreen usa ['user-public-profile-fields', userId] para media
      await qc.invalidateQueries({ queryKey: ["user-public-profile-fields", user?.id] });
      // Forzar refetch inmediato para que los cambios se reflejen de inmediato
      await qc.refetchQueries({ queryKey: KEY(user?.id) });
    },
  });

  const uploadToSlot = useMutation({
    mutationFn: async ({ file, slot, kind }: { file: File; slot: string; kind: "photo" | "video" }) => {
      if (!user?.id) throw new Error("No user");

      const ext = file.name.split('.').pop();
      const path = `user-media/${user.id}/${slot}.${ext}`;
      const isReplace = !!getMediaBySlot(mediaQuery.data || [], slot);

      logProfileImage(isReplace ? "REPLACE" : "UPLOAD", "start", {
        userId: user.id,
        slot,
        kind,
        storagePath: path,
        fileSize: file.size,
        mimeType: file.type,
      });

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true });

      if (error) {
        logProfileImage(isReplace ? "REPLACE" : "UPLOAD", "storage-error", {
          userId: user.id,
          slot,
          code: (error as { code?: string })?.code,
          message: (error as { message?: string })?.message,
        });
        throw error;
      }

      logProfileImage(isReplace ? "REPLACE" : "UPLOAD", "storage-ok", {
        userId: user.id,
        slot,
        path,
      });

      const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const item: MediaItem = {
        slot,
        kind,
        url: publicUrl.publicUrl,
        title: `${kind === 'photo' ? 'Foto' : 'Video'} ${slot.toUpperCase()}`
      };

      const next = upsertMediaSlot(mediaQuery.data || [], item);
      await setMedia.mutateAsync(next);

      logProfileImage(isReplace ? "REPLACE" : "UPLOAD", "db-ok", {
        userId: user.id,
        slot,
        publicUrl: publicUrl.publicUrl?.slice(0, 80),
      });

      return next;
    },
    onSuccess: async () => {
      // Invalidar queries de media y del perfil para forzar recarga
      await qc.invalidateQueries({ queryKey: KEY(user?.id) });
      await qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
      await qc.invalidateQueries({ queryKey: ["profile","media", user?.id] });
      await qc.invalidateQueries({ queryKey: ["user-public-profile-fields", user?.id] });
      // Forzar refetch inmediato para que los cambios se reflejen de inmediato
      await qc.refetchQueries({ queryKey: KEY(user?.id) });
    },
  });

  const removeFromSlot = useMutation({
    mutationFn: async (slot: string) => {
      if (!user?.id) throw new Error("No user");

      const current = getMediaBySlot(mediaQuery.data || [], slot);
      const path = current?.url
        ? extractStoragePathFromPublicUrl(current.url, BUCKET)
        : null;

      logProfileImage("DELETE", "start", { userId: user.id, slot, hasUrl: !!current?.url, path });

      if (path) {
        try {
          const { error } = await supabase.storage.from(BUCKET).remove([path]);
          if (error) {
            logProfileImage("DELETE", "storage-error", {
              userId: user.id,
              slot,
              path,
              code: (error as { code?: string })?.code,
              message: (error as { message?: string })?.message,
            });
          } else {
            logProfileImage("DELETE", "storage-ok", { userId: user.id, slot, path });
          }
        } catch (e) {
          logProfileImage("DELETE", "storage-error", {
            userId: user.id,
            slot,
            path,
            message: e instanceof Error ? e.message : String(e),
          });
        }
      } else {
        logProfileImage("DELETE", "skip-storage", { userId: user.id, slot, reason: "no path from url" });
      }

      const next = removeMediaSlot(mediaQuery.data || [], slot);
      await setMedia.mutateAsync(next);

      logProfileImage("DELETE", "db-ok", { userId: user.id, slot });

      return next;
    },
    onSuccess: async () => {
      // Invalidar queries de media y del perfil para forzar recarga
      await qc.invalidateQueries({ queryKey: KEY(user?.id) });
      await qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
      await qc.invalidateQueries({ queryKey: ["profile","media", user?.id] });
      await qc.invalidateQueries({ queryKey: ["user-public-profile-fields", user?.id] });
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
