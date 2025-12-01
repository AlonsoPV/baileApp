import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { MediaItem } from "../lib/storage";
import { resizeImageIfNeeded } from "../lib/imageResize";

const BUCKET = "media";

// Helper to upload competition group image/video
async function uploadCompetitionGroupFile(groupId: string, file: File): Promise<MediaItem> {
  // Redimensionar imagen si es necesario (máximo 800px de ancho)
  const processedFile = await resizeImageIfNeeded(file, 800);
  
  const ext = processedFile.name.split(".").pop()?.toLowerCase() || "bin";
  const type: "image" | "video" = processedFile.type.startsWith("image/") ? "image" : "video";
  const path = `competition-groups/${groupId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  console.log('[CompetitionGroupMedia] Uploading file:', { groupId, fileName: processedFile.name, type, path, originalSize: file.size, processedSize: processedFile.size });

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, processedFile, {
    cacheControl: "3600",
    upsert: false,
    contentType: processedFile.type || undefined,
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

