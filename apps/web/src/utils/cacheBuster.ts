/**
 * Cache-bust estable para URLs de imágenes (Supabase Storage).
 * Usa v= con updated_at/created_at/id para permitir caché largo (ej. 1 año)
 * y refresco solo cuando el recurso cambia. NO usar Date.now() ni timestamps.
 * Normaliza la versión a caracteres seguros para query string (evita 400 en Supabase Storage).
 */
function toCacheSafeVersion(version: string | number | null | undefined): string {
  const v = (version ?? "").toString().trim();
  if (!v) return "";
  // ISO dates (ej. 2026-03-16T00:31:21.611458+00:00) pueden causar 400; usar solo caracteres seguros
  const safe = v.replace(/[:+]/g, "-").replace(/\s/g, "-");
  return safe || v;
}

export function withStableCacheBust(
  url?: string | null,
  version?: string | number | null
): string | undefined {
  if (!url) return undefined;
  const v = toCacheSafeVersion(version);
  if (!v) return url;

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(v)}`;
}
