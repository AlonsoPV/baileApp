import React from "react";
import {
  buildExploreResponsiveSources,
  type ExploreImagePreset,
} from "@/utils/supabaseResponsiveImage";

export type ExploreResponsiveImageProps = {
  rawUrl: string | undefined | null;
  cacheVersion?: string | number | null;
  preset: ExploreImagePreset;
  alt: string;
  priority?: boolean;
  /** Sustituye sizes del preset (p. ej. card con layout especial) */
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
};

/**
 * Imagen Explore: WebP srcset + fallback img vía Supabase render, o URL pública si transforms off.
 */
export default function ExploreResponsiveImage({
  rawUrl,
  cacheVersion,
  preset,
  alt,
  priority = false,
  sizes: sizesOverride,
  className,
  style,
  onLoad,
  onError,
}: ExploreResponsiveImageProps) {
  const sources = React.useMemo(
    () => buildExploreResponsiveSources(rawUrl, cacheVersion ?? null, preset),
    [rawUrl, cacheVersion, preset]
  );

  if (!sources) return null;

  const sizes = sizesOverride ?? sources.sizes;

  return (
    <picture className={className} style={style}>
      {sources.webpSrcSet ? (
        <source type="image/webp" srcSet={sources.webpSrcSet} sizes={sizes} />
      ) : null}
      <img
        src={sources.src}
        alt={alt}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        style={style}
        onLoad={onLoad}
        onError={onError}
      />
    </picture>
  );
}
