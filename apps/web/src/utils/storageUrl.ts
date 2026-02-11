/**
 * Helpers para URLs de Supabase Storage: extracción de path y cache-busting.
 * Usado en UserProfileEditor y useUserMediaSlots para delete real y evitar caché vieja.
 */

const SUPABASE_OBJECT_PUBLIC = "/storage/v1/object/public/";

/**
 * Extrae el path de storage (bucket/path o solo path) desde una URL pública de Supabase.
 * Formato esperado: https://{host}/storage/v1/object/public/{bucket}/{path}
 * @returns path para usar en storage.from(bucket).remove([path]) o null si no es URL de storage
 */
export function extractStoragePathFromPublicUrl(
  publicUrl: string | undefined | null,
  bucket: string = "media"
): string | null {
  if (!publicUrl || typeof publicUrl !== "string") return null;
  const s = publicUrl.trim();
  if (!s.startsWith("http")) return null;
  try {
    const idx = s.indexOf(SUPABASE_OBJECT_PUBLIC);
    if (idx === -1) return null;
    const after = s.slice(idx + SUPABASE_OBJECT_PUBLIC.length);
    const parts = after.split("/");
    let path: string;
    if (parts[0] === bucket && parts.length > 1) {
      path = parts.slice(1).join("/");
    } else if (parts[0] && parts.length >= 1) {
      path = after;
    } else {
      return null;
    }
    return path.split("?")[0] || null;
  } catch {
    return null;
  }
}

/**
 * Añade cache-busting a una URL de imagen para evitar que el navegador/CDN muestre una versión vieja.
 * No modifica URLs que no parezcan de imagen o que ya tengan query.
 * @param url - URL pública de la imagen
 * @param version - valor para ?v= (ej. profile.updated_at o Date.now())
 */
export function getDisplayImageUrl(
  url: string | undefined | null,
  version?: string | number
): string {
  if (!url || typeof url !== "string") return "";
  const u = url.trim();
  if (!u) return "";
  if (version === undefined || version === null) return u;
  const separator = u.includes("?") ? "&" : "?";
  return `${u}${separator}v=${encodeURIComponent(String(version))}`;
}
