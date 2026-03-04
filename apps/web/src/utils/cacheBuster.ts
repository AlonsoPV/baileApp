/**
 * Cache-bust estable para URLs de imágenes (Supabase Storage).
 * Usa v= con updated_at/created_at/id para permitir caché largo (ej. 1 año)
 * y refresco solo cuando el recurso cambia. NO usar Date.now() ni timestamps.
 */
export function withStableCacheBust(
  url?: string | null,
  version?: string | number | null
): string | undefined {
  if (!url) return undefined;
  const v = (version ?? "").toString().trim();
  if (!v) return url;

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(v)}`;
}
