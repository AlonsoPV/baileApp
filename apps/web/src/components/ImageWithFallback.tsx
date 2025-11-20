import React from "react";

const FALLBACK = "/default-media.png";

type ImageWithFallbackProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "loading" | "fetchPriority"> & {
  fallback?: string;
  priority?: boolean; // si true, evita lazy-loading y agrega fetchpriority="high"
  sizes?: string;
  width?: number;
  height?: number;
  quality?: number; // Calidad de compresión (60-100, default: 80)
  responsive?: boolean; // Si true, genera srcset con múltiples tamaños
};

const SUPABASE_PUBLIC_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_PATH = "/storage/v1/render/image/public/";

function buildSupabaseOptimizedUrl(src: string | undefined, format: "webp" | "avif", width?: number, quality?: number) {
  if (!src) return null;
  try {
    const url = new URL(src, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (!url.pathname.includes(SUPABASE_PUBLIC_PATH)) return null;
    const [, publicKey] = url.pathname.split(SUPABASE_PUBLIC_PATH);
    if (!publicKey) return null;

    const renderUrl = `${url.origin}${SUPABASE_RENDER_PATH}${publicKey}`;
    const params = new URLSearchParams();
    params.set("format", format);
    params.set("quality", String(quality || 80));
    if (width) params.set("width", String(width));
    return `${renderUrl}?${params.toString()}`;
  } catch {
    return null;
  }
}

// Generar srcset responsive con múltiples tamaños
function buildResponsiveSrcSet(src: string | undefined, format: "webp" | "avif", widths: number[], quality?: number): string | null {
  if (!src) return null;
  const sources = widths
    .map(width => {
      const optimizedUrl = buildSupabaseOptimizedUrl(src, format, width, quality);
      return optimizedUrl ? `${optimizedUrl} ${width}w` : null;
    })
    .filter(Boolean) as string[];
  return sources.length > 0 ? sources.join(', ') : null;
}

export default function ImageWithFallback({
  src,
  fallback = FALLBACK,
  priority = false,
  sizes = "100vw",
  width,
  height,
  style,
  quality,
  responsive = false,
  ...rest
}: ImageWithFallbackProps) {
  const [err, setErr] = React.useState(false);
  const finalSrc = !src || err ? fallback : src;
  const resolvedLoading = priority ? "eager" : "lazy";
  
  // Calidad adaptativa según contexto
  const finalQuality = quality || (width && width < 300 ? 70 : width && width > 800 ? 85 : 80);
  
  // Generar srcset responsive si está habilitado y tenemos width
  const responsiveWidths = responsive && width ? [
    Math.round(width * 0.5),   // 0.5x para pantallas pequeñas
    Math.round(width * 0.75),  // 0.75x para tablets
    width,                      // 1x tamaño original
    Math.round(width * 1.5),   // 1.5x para pantallas retina
    Math.round(width * 2)      // 2x para pantallas 4K
  ] : [];
  
  const optimizedWebp = responsive && responsiveWidths.length > 0
    ? buildResponsiveSrcSet(finalSrc, "webp", responsiveWidths, finalQuality)
    : buildSupabaseOptimizedUrl(finalSrc, "webp", width, finalQuality);
  const optimizedAvif = responsive && responsiveWidths.length > 0
    ? buildResponsiveSrcSet(finalSrc, "avif", responsiveWidths, finalQuality)
    : buildSupabaseOptimizedUrl(finalSrc, "avif", width, finalQuality);

  // Si el estilo tiene width o height en porcentajes, no aplicar dimensiones fijas
  const styleWidth = typeof style?.width === 'string' && style.width.includes('%') ? undefined : (width ? `${width}px` : undefined);
  const styleHeight = typeof style?.height === 'string' && style.height.includes('%') ? undefined : (height ? `${height}px` : undefined);

  return (
    <picture>
      {optimizedAvif && (
        <source 
          srcSet={optimizedAvif} 
          type="image/avif" 
          sizes={responsive && responsiveWidths.length > 0 ? sizes : undefined}
        />
      )}
      {optimizedWebp && (
        <source 
          srcSet={optimizedWebp} 
          type="image/webp" 
          sizes={responsive && responsiveWidths.length > 0 ? sizes : undefined}
        />
      )}
      <img
        src={finalSrc}
        onError={() => setErr(true)}
        decoding="async"
        loading={resolvedLoading}
        fetchPriority={priority ? "high" : "auto"}
        sizes={responsive && responsiveWidths.length > 0 ? sizes : undefined}
        width={styleWidth ? width : undefined}
        height={styleHeight ? height : undefined}
        style={{ width: styleWidth, height: styleHeight, ...style }}
        {...rest}
      />
    </picture>
  );
}
