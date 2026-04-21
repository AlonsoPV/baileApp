/**
 * Resolución centralizada de imagen para la smart page (/open/...).
 * Prioriza siempre la imagen real del recurso; logo de la app solo como último fallback.
 */

import { getMediaBySlot, normalizeMediaArray } from "./mediaSlots";
import { toDirectPublicStorageUrl } from "./imageOptimization";
import { SEO_LOGO_URL } from "../lib/seoConfig";
import { pickClassItemFlyerUrl, selectCronogramaClassItem } from "./classFlyerImage";

const IMAGE_URL_FIELDS = ["url", "src", "image_url", "flyer_url", "cover_url", "avatar_url", "path"];

function isNonEmptyImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (!s) return false;
  if (s === "undefined" || s.includes("undefined")) return false;
  return s.startsWith("http") || s.startsWith("/") || s.startsWith("data:");
}

/**
 * Extrae la primera URL de imagen válida desde distintos formatos:
 * - string
 * - string[]
 * - objeto con url/src/image_url/flyer_url/cover_url/avatar_url
 * - array de objetos con esos campos
 */
export function extractFirstValidImageUrl(input: unknown): string | null {
  if (input == null) return null;

  if (typeof input === "string") {
    return isNonEmptyImageUrl(input) ? input.trim() : null;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === "string") {
        if (isNonEmptyImageUrl(item)) return item.trim();
        continue;
      }
      if (item && typeof item === "object") {
        for (const key of IMAGE_URL_FIELDS) {
          const v = (item as Record<string, unknown>)[key];
          if (isNonEmptyImageUrl(v)) return (v as string).trim();
        }
      }
    }
    return null;
  }

  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    for (const key of IMAGE_URL_FIELDS) {
      const v = obj[key];
      if (isNonEmptyImageUrl(v)) return (v as string).trim();
    }
  }

  return null;
}

function resolveUrl(raw: string | null): string | null {
  if (!raw) return null;
  const direct = toDirectPublicStorageUrl(raw) ?? raw;
  return direct && isNonEmptyImageUrl(direct) ? direct : null;
}

/** Data URI SVG placeholders por tipo (fallback contextual) */
function getFallbackEntityDataUrl(entityType: string): string {
  const label =
    entityType === "evento"
      ? "Evento"
      : entityType === "clase"
        ? "Clase"
        : "Perfil";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect fill="#1a1a24" width="400" height="250"/><text x="200" y="125" fill="rgba(255,255,255,0.4)" font-family="system-ui,sans-serif" font-size="24" font-weight="600" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export type OpenEntityImageSourceType =
  | "flyer_url"
  | "media"
  | "cover"
  | "avatar"
  | "fallback_entity"
  | "fallback_app";

export interface ResolveOpenEntityImageResult {
  imageUrl: string;
  imageSourceType: OpenEntityImageSourceType;
}

/** Evento: date + parent (events_date + events_parent) */
export function resolveOpenEntityImageEvento(data: {
  date: Record<string, unknown>;
  parent?: Record<string, unknown> | null;
}): ResolveOpenEntityImageResult {
  const { date, parent } = data;

  const flyerRaw = date?.flyer_url;
  if (isNonEmptyImageUrl(flyerRaw)) {
    const url = resolveUrl(flyerRaw as string);
    if (url) return { imageUrl: url, imageSourceType: "flyer_url" };
  }

  const parentFlyerRaw = parent?.flyer_url ?? parent?.portada_url;
  if (isNonEmptyImageUrl(parentFlyerRaw)) {
    const url = resolveUrl(parentFlyerRaw as string);
    if (url) return { imageUrl: url, imageSourceType: "flyer_url" };
  }

  const dateMedia = normalizeMediaArray(date?.media);
  const dateFirst =
    getMediaBySlot(dateMedia, "flyer")?.url ||
    getMediaBySlot(dateMedia, "cover")?.url ||
    getMediaBySlot(dateMedia, "p1")?.url;
  if (dateFirst) {
    const url = resolveUrl(dateFirst);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }

  const parentMedia = normalizeMediaArray(parent?.media);
  const parentFirst =
    getMediaBySlot(parentMedia, "flyer")?.url ||
    getMediaBySlot(parentMedia, "cover")?.url ||
    getMediaBySlot(parentMedia, "p1")?.url;
  if (parentFirst) {
    const url = resolveUrl(parentFirst);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }

  const avatarRaw =
    (date as any)?.avatar_url ??
    (parent as any)?.avatar_url ??
    (date as any)?.portada_url ??
    (parent as any)?.portada_url;
  if (isNonEmptyImageUrl(avatarRaw)) {
    const url = resolveUrl(avatarRaw);
    if (url) return { imageUrl: url, imageSourceType: "avatar" };
  }

  const firstAny =
    extractFirstValidImageUrl(date?.media) ||
    extractFirstValidImageUrl(parent?.media) ||
    extractFirstValidImageUrl(date) ||
    extractFirstValidImageUrl(parent);
  if (firstAny) {
    const url = resolveUrl(firstAny);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }

  return {
    imageUrl: getFallbackEntityDataUrl("evento"),
    imageSourceType: "fallback_entity",
  };
}

/** Clase: flyer/cover del ítem del cronograma primero; luego medios del perfil. */
export function resolveOpenEntityImageClase(data: {
  profile: Record<string, unknown>;
  sourceType: "teacher" | "academy";
  /** Índice en cronograma/horarios (query ?i=); si no hay, se usa la primera clase. */
  classIndex?: number;
}): ResolveOpenEntityImageResult {
  const { profile, classIndex } = data;
  const classItem = selectCronogramaClassItem(profile, classIndex);
  const fromClassItem = pickClassItemFlyerUrl(classItem);
  if (fromClassItem) {
    const url = resolveUrl(fromClassItem);
    if (url) return { imageUrl: url, imageSourceType: "flyer_url" };
  }

  const mediaList = profile?.media;
  const mediaArr = Array.isArray(mediaList) ? mediaList : [];
  const normalized = normalizeMediaArray(mediaArr);

  const cover = getMediaBySlot(normalized, "cover")?.url;
  if (cover) {
    const url = resolveUrl(cover);
    if (url) return { imageUrl: url, imageSourceType: "cover" };
  }

  const p1 = getMediaBySlot(normalized, "p1")?.url;
  if (p1) {
    const url = resolveUrl(p1);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }

  const avatarRaw =
    (profile as any)?.avatar_url ?? (profile as any)?.banner_url ?? (profile as any)?.logo_url ?? (profile as any)?.portada_url;
  if (isNonEmptyImageUrl(avatarRaw)) {
    const url = resolveUrl(avatarRaw);
    if (url) return { imageUrl: url, imageSourceType: "avatar" };
  }

  const firstAny = extractFirstValidImageUrl(mediaArr);
  if (firstAny) {
    const url = resolveUrl(firstAny);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }

  return {
    imageUrl: getFallbackEntityDataUrl("clase"),
    imageSourceType: "fallback_entity",
  };
}

/** Perfil: academia, maestro, organizer, user, marca */
export function resolveOpenEntityImageProfile(data: {
  profile: Record<string, unknown>;
}): ResolveOpenEntityImageResult {
  const profile = data.profile;
  const mediaList = profile?.media;
  const mediaArr = Array.isArray(mediaList) ? mediaList : [];
  const normalized = normalizeMediaArray(mediaArr);

  const cover = getMediaBySlot(normalized, "cover")?.url;
  if (cover) {
    const url = resolveUrl(cover);
    if (url) return { imageUrl: url, imageSourceType: "cover" };
  }

  const avatarSlot = getMediaBySlot(normalized, "avatar")?.url;
  if (avatarSlot) {
    const url = resolveUrl(avatarSlot);
    if (url) return { imageUrl: url, imageSourceType: "avatar" };
  }

  const firstFromMedia = extractFirstValidImageUrl(mediaArr) || extractFirstValidImageUrl(profile);
  if (firstFromMedia) {
    const url = resolveUrl(firstFromMedia);
    if (url) return { imageUrl: url, imageSourceType: "media" };
  }

  const avatarRaw =
    (profile as any)?.avatar_url ??
    (profile as any)?.logo_url ??
    (profile as any)?.banner_url ??
    (profile as any)?.portada_url;
  if (isNonEmptyImageUrl(avatarRaw)) {
    const url = resolveUrl(avatarRaw);
    if (url) return { imageUrl: url, imageSourceType: "avatar" };
  }

  return {
    imageUrl: getFallbackEntityDataUrl("perfil"),
    imageSourceType: "fallback_entity",
  };
}

/**
 * Devuelve la URL final para og:image / twitter:image.
 * Si la imagen es fallback contextual (data URI), usa el logo de la app para redes (muchas no aceptan data URI).
 */
export function getOpenEntityImageForMeta(
  result: ResolveOpenEntityImageResult
): string {
  if (result.imageSourceType === "fallback_entity" && result.imageUrl.startsWith("data:")) {
    return SEO_LOGO_URL;
  }
  return result.imageUrl;
}
