/**
 * URLs responsive (srcset) para imágenes en Storage público vía Supabase Image Transformations.
 * Si VITE_SUPABASE_IMAGE_TRANSFORMS !== "true", se degrada a URL pública con cache-bust (sin srcset).
 */

import { withStableCacheBust } from "./cacheBuster";
import { ensureAbsoluteImageUrl, toDirectPublicStorageUrl } from "./imageOptimization";

const SUPABASE_PUBLIC_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_PATH = "/storage/v1/render/image/public/";

const DEFAULT_QUALITY = 78;

/** Anchos lógicos thumbnail / medium / large para cards Explore */
export const EXPLORE_CARD_WIDTHS = [200, 400, 800] as const;

/** Miniaturas de filas tipo listado (~60px CSS × DPR) */
export const EXPLORE_LIST_THUMB_WIDTHS = [80, 120, 200] as const;

/** Alineado a HorizontalSlider: grid-auto-columns min(86vw,360px) / min(320px,24vw) */
export const EXPLORE_SIZES_CAROUSEL_CARD = "(max-width: 768px) 86vw, min(320px, 24vw)";

/** Grid cartelera: 2 cols &lt;900px, 3 cols desktop */
export const EXPLORE_SIZES_CARTELERA_GRID = "(max-width: 899px) 50vw, 33vw";

/** Hero detalle evento (pantalla pública): .eds-hero max ~520px centrado */
export const EXPLORE_SIZES_EVENT_HERO = "(max-width: 600px) 100vw, 520px";

/** Avatar circular UserProfileHero (200 / 160 / 140 CSS px) */
export const EXPLORE_SIZES_PROFILE_AVATAR_HERO =
  "(max-width: 480px) 140px, (max-width: 768px) 160px, 200px";

/** Carrusel fotos perfil: .carousel-main ~1000px × 350px */
export const EXPLORE_SIZES_PROFILE_CAROUSEL_MAIN =
  "(max-width: 1000px) 100vw, 1000px";

/** Miniaturas carrusel perfil (.carousel-thumbnail 60×60) */
export const EXPLORE_SIZES_PROFILE_CAROUSEL_THUMB = "60px";

/** Fullscreen carrusel perfil */
export const EXPLORE_SIZES_PROFILE_CAROUSEL_FULLSCREEN = "min(90vw, 1200px)";

/** Thumbs favoritos perfil (grid 56×56) */
export const EXPLORE_SIZES_PROFILE_FAVORITE_THUMB = "56px";

/** Thumb EventListRow / filas similares */
export const EXPLORE_SIZES_LIST_THUMB = "60px";

export function areSupabaseImageTransformsEnabled(): boolean {
  return import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORMS === "true";
}

function extractPublicKey(absoluteUrlNoQuery: string): string | null {
  try {
    const u = new URL(absoluteUrlNoQuery);
    if (!u.pathname.includes(SUPABASE_PUBLIC_PATH)) return null;
    const key = u.pathname.split(SUPABASE_PUBLIC_PATH)[1];
    return key ?? null;
  } catch {
    return null;
  }
}

function buildRenderUrl(
  origin: string,
  publicKey: string,
  opts: { width: number; quality: number; format?: "webp"; resize?: "cover" | "contain" }
): string {
  const params = new URLSearchParams();
  params.set("width", String(opts.width));
  params.set("quality", String(opts.quality));
  params.set("resize", opts.resize ?? "cover");
  if (opts.format) params.set("format", opts.format);
  return `${origin}${SUPABASE_RENDER_PATH}${publicKey}?${params.toString()}`;
}

export type ExploreImagePreset = "carouselCard" | "carteleraGrid" | "listThumb" | "flyerContain";

function presetResize(preset: ExploreImagePreset): "cover" | "contain" {
  return preset === "flyerContain" ? "contain" : "cover";
}

function presetWidths(preset: ExploreImagePreset): readonly number[] {
  if (preset === "listThumb") return EXPLORE_LIST_THUMB_WIDTHS;
  return EXPLORE_CARD_WIDTHS;
}

function presetSizes(preset: ExploreImagePreset): string {
  if (preset === "listThumb") return EXPLORE_SIZES_LIST_THUMB;
  if (preset === "carteleraGrid") return EXPLORE_SIZES_CARTELERA_GRID;
  if (preset === "flyerContain") return EXPLORE_SIZES_CAROUSEL_CARD;
  return EXPLORE_SIZES_CAROUSEL_CARD;
}

export type ExploreResponsiveSources = {
  /** img.src: formato original @ ~medium width (fallback si no hay WebP) */
  src: string;
  /** type=image/webp en <source> */
  webpSrcSet: string | undefined;
  sizes: string;
  /** URL base pública cacheada (misma clave que srcset) para comprobar placeholder */
  publicUrlForKey: string | undefined;
};

/**
 * @param rawUrl URL o path tal como viene del API (puede ser relativa)
 * @param cacheVersion updated_at / id para ?v=
 */
export function buildExploreResponsiveSources(
  rawUrl: string | null | undefined,
  cacheVersion: string | number | null | undefined,
  preset: ExploreImagePreset,
  options?: { quality?: number }
): ExploreResponsiveSources | null {
  if (rawUrl == null || String(rawUrl).trim() === "") return null;

  const absolute =
    toDirectPublicStorageUrl(ensureAbsoluteImageUrl(String(rawUrl).trim()) ?? String(rawUrl).trim()) ??
    ensureAbsoluteImageUrl(String(rawUrl).trim());
  if (!absolute) return null;

  const clean = absolute.split("?")[0];
  const quality = options?.quality ?? DEFAULT_QUALITY;
  const sizes = presetSizes(preset);
  const widths = presetWidths(preset);
  const mediumW = preset === "listThumb" ? 120 : 400;

  const bustedPublic = withStableCacheBust(clean, cacheVersion ?? null) ?? clean;

  if (!areSupabaseImageTransformsEnabled()) {
    return {
      src: bustedPublic,
      webpSrcSet: undefined,
      sizes,
      publicUrlForKey: bustedPublic,
    };
  }

  let origin: string;
  try {
    origin = new URL(clean).origin;
  } catch {
    return {
      src: bustedPublic,
      webpSrcSet: undefined,
      sizes,
      publicUrlForKey: bustedPublic,
    };
  }

  const publicKey = extractPublicKey(clean);
  if (!publicKey) {
    return {
      src: bustedPublic,
      webpSrcSet: undefined,
      sizes,
      publicUrlForKey: bustedPublic,
    };
  }

  const resize = presetResize(preset);
  const webpParts = widths.map(
    (w) =>
      `${withStableCacheBust(buildRenderUrl(origin, publicKey, { width: w, quality, format: "webp", resize }), cacheVersion ?? null)} ${w}w`
  );
  const webpSrcSet = webpParts.join(", ");

  const srcMedium = buildRenderUrl(origin, publicKey, {
    width: mediumW,
    quality,
    resize,
  });
  const src = withStableCacheBust(srcMedium, cacheVersion ?? null) ?? srcMedium;

  return {
    src,
    webpSrcSet,
    sizes,
    publicUrlForKey: bustedPublic,
  };
}
