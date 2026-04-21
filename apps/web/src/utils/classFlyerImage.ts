import { getMediaBySlot, normalizeMediaArray } from "./mediaSlots";

/**
 * Imagen tipo flyer/portada en un ítem del cronograma (clase).
 * Alineado con ClassPublicScreen / tarjetas de clases (cover_url, flyer_url, media).
 */
export function pickClassItemFlyerUrl(classItem: unknown): string | undefined {
  if (!classItem || typeof classItem !== "object") return undefined;
  const c = classItem as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const direct = str(c.flyer_url) || str(c.cover_url) || str(c.portada_url) || str(c.imagen);
  if (direct) return direct;
  const classMedia = normalizeMediaArray((c as { media?: unknown }).media);
  return (
    getMediaBySlot(classMedia, "flyer")?.url ||
    getMediaBySlot(classMedia, "cover")?.url ||
    getMediaBySlot(classMedia, "p1")?.url ||
    classMedia.find((m) => m.kind === "photo" && m.url)?.url ||
    undefined
  );
}

/** Elige el ítem del cronograma por índice o el primero. */
export function selectCronogramaClassItem(
  profile: Record<string, unknown>,
  classIndex?: number,
): unknown {
  const cronograma = (profile?.cronograma || profile?.horarios || []) as unknown[];
  if (!Array.isArray(cronograma) || cronograma.length === 0) return undefined;
  if (
    classIndex != null &&
    Number.isFinite(classIndex) &&
    classIndex >= 0 &&
    classIndex < cronograma.length
  ) {
    return cronograma[classIndex];
  }
  return cronograma[0];
}
