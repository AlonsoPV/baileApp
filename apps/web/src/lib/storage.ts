import { supabase } from "./supabase";
import { resizeImageIfNeeded } from "./imageResize";

export type MediaItem = {
  id: string;           // filename
  url: string;          // public URL
  type: "image" | "video";
  created_at?: string;
};

const BUCKET = "user-media";

export function publicUrl(path: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadUserFile(userId: string, file: File) {
  // Redimensionar imagen si es necesario (máximo 800px de ancho)
  const processedFile = await resizeImageIfNeeded(file, 800);
  
  const ext = processedFile.name.split(".").pop()?.toLowerCase() || "bin";
  const type: "image" | "video" =
    processedFile.type.startsWith("image/") ? "image" : "video";
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  console.log('[Storage] Uploading file:', { userId, fileName: processedFile.name, type, path, originalSize: file.size, processedSize: processedFile.size });

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, processedFile, {
    cacheControl: "3600",
    upsert: false,
    contentType: processedFile.type || undefined,
  });
  
  if (error) {
    console.error('[Storage] Upload error:', error);
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  console.log('[Storage] Upload successful:', data);

  return <MediaItem>{
    id: path,
    url: publicUrl(path),
    type,
    created_at: new Date().toISOString(),
  };
}

export async function removeUserFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
