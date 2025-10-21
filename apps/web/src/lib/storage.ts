import { supabase } from "./supabase";

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
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const type: "image" | "video" =
    file.type.startsWith("image/") ? "image" : "video";
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  console.log('[Storage] Uploading file:', { userId, fileName: file.name, type, path });

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
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
