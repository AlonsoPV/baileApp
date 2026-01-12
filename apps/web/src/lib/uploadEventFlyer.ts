import { supabase } from "./supabase";
import { resizeImageIfNeeded } from "./imageResize";

export type UploadEventFlyerInput = {
  file: File;
  parentId?: number | null;
  dateId?: number | null;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_BYTES = 6 * 1024 * 1024;

/**
 * Sube un flyer a Supabase Storage y devuelve la public URL.
 * No toca DB; eso se hace por separado (events_date.flyer_url).
 */
export async function uploadEventFlyer({ file, parentId, dateId }: UploadEventFlyerInput): Promise<string> {
  if (!file) throw new Error("Archivo inválido.");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("El archivo supera 6MB.");
  }

  // getUser() pega a la red; getSession() es local/cache
  const user = (await supabase.auth.getSession()).data.session?.user;
  if (!user) throw new Error("No hay sesión.");

  // 1080px width y compresión para subir rápido
  const processedFile = await resizeImageIfNeeded(file, 1080, 0.82);

  const ext = processedFile.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeParent = parentId ? String(parentId) : "no-parent";
  const safeDate = dateId ? String(dateId) : String(Date.now());
  const path = `media/event-flyers/${user.id}/${safeParent}/${safeDate}_flyer.${ext}`;

  const { data: up, error: upErr } = await supabase.storage
    .from("media")
    .upload(path, processedFile, { upsert: true, contentType: processedFile.type });

  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("media").getPublicUrl(up.path);
  if (!pub?.publicUrl) throw new Error("No se pudo obtener URL pública del flyer.");
  return pub.publicUrl;
}

