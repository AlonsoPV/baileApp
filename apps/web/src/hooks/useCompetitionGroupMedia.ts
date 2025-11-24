import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { MediaItem } from "../lib/storage";

const BUCKET = "media";

// Helper to upload competition group image/video
async function uploadCompetitionGroupFile(groupId: string, file: File): Promise<MediaItem> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const type: "image" | "video" = file.type.startsWith("image/") ? "image" : "video";
  const path = `competition-groups/${groupId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  console.log('[CompetitionGroupMedia] Uploading file:', { groupId, fileName: file.name, type, path });

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    console.error('[CompetitionGroupMedia] Upload error:', error);
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  console.log('[CompetitionGroupMedia] Upload successful:', data);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    id: path,
    url: urlData.publicUrl,
    type,
    created_at: new Date().toISOString(),
  };
}

async function removeCompetitionGroupFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error('[CompetitionGroupMedia] Remove error:', error);
    throw new Error(`Error al eliminar archivo: ${error.message}`);
  }
}

export function useUploadCompetitionGroupMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, file }: { groupId: string; file: File }) => {
      return await uploadCompetitionGroupFile(groupId, file);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competition-groups'] });
    },
  });
}

export function useRemoveCompetitionGroupMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (path: string) => {
      return await removeCompetitionGroupFile(path);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competition-groups'] });
    },
  });
}

