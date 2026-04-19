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
  rootMargin?: string;
};

/**
 * Imagen Explore: WebP srcset + fallback img vía Supabase render, o URL pública si transforms off.
 */
const BASE_MEDIA_STYLE: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  background: "linear-gradient(145deg, rgba(40, 44, 62, 0.72) 0%, rgba(25, 28, 40, 0.9) 100%)",
};

const ExploreResponsiveImage = React.memo(function ExploreResponsiveImage({
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
  rootMargin = "300px",
}: ExploreResponsiveImageProps) {
  const sources = React.useMemo(
    () => buildExploreResponsiveSources(rawUrl, cacheVersion ?? null, preset),
    [rawUrl, cacheVersion, preset]
  );
  const hostRef = React.useRef<HTMLElement | null>(null);
  const [shouldLoad, setShouldLoad] = React.useState(priority);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    setShouldLoad(priority);
    setIsLoaded(false);
  }, [priority, rawUrl, cacheVersion, preset]);

  React.useEffect(() => {
    if (priority || shouldLoad || !hostRef.current || typeof IntersectionObserver === "undefined") return;
    const node = hostRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [priority, shouldLoad, rootMargin]);

  if (!sources) return null;

  const sizes = sizesOverride ?? sources.sizes;
  const mergedStyle = { ...BASE_MEDIA_STYLE, ...style };

  return (
    <picture
      ref={hostRef as React.RefObject<HTMLPictureElement>}
      className={className}
      style={mergedStyle}
    >
      {shouldLoad && sources.webpSrcSet ? (
        <source type="image/webp" srcSet={sources.webpSrcSet} sizes={sizes} />
      ) : null}
      {shouldLoad ? (
        <img
          src={sources.src}
          alt={alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          style={{
            ...style,
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 180ms ease",
          }}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={onError}
        />
      ) : null}
    </picture>
  );
});

export default ExploreResponsiveImage;
