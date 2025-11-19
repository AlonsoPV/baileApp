import React from "react";

const FALLBACK = "/default-media.png";

type ImageWithFallbackProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "loading"> & {
  fallback?: string;
  priority?: boolean; // si true, evita lazy-loading
  sizes?: string;
  width?: number;
  height?: number;
};

const SUPABASE_PUBLIC_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_PATH = "/storage/v1/render/image/public/";

function buildSupabaseOptimizedUrl(src: string | undefined, format: "webp" | "avif", width?: number) {
  if (!src) return null;
  try {
    const url = new URL(src, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (!url.pathname.includes(SUPABASE_PUBLIC_PATH)) return null;
    const [, publicKey] = url.pathname.split(SUPABASE_PUBLIC_PATH);
    if (!publicKey) return null;

    const renderUrl = `${url.origin}${SUPABASE_RENDER_PATH}${publicKey}`;
    const params = new URLSearchParams();
    params.set("format", format);
    params.set("quality", "80");
    if (width) params.set("width", String(width));
    return `${renderUrl}?${params.toString()}`;
  } catch {
    return null;
  }
}

export default function ImageWithFallback({
  src,
  fallback = FALLBACK,
  priority = false,
  sizes = "100vw",
  width,
  height,
  style,
  ...rest
}: ImageWithFallbackProps) {
  const [err, setErr] = React.useState(false);
  const finalSrc = !src || err ? fallback : src;
  const resolvedLoading = priority ? "eager" : "lazy";
  const optimizedWebp = buildSupabaseOptimizedUrl(finalSrc, "webp", width);
  const optimizedAvif = buildSupabaseOptimizedUrl(finalSrc, "avif", width);

  // Si el estilo tiene width o height en porcentajes, no aplicar dimensiones fijas
  const styleWidth = typeof style?.width === 'string' && style.width.includes('%') ? undefined : (width ? `${width}px` : undefined);
  const styleHeight = typeof style?.height === 'string' && style.height.includes('%') ? undefined : (height ? `${height}px` : undefined);

  return (
    <picture>
      {optimizedAvif && <source srcSet={optimizedAvif} type="image/avif" sizes={sizes} />}
      {optimizedWebp && <source srcSet={optimizedWebp} type="image/webp" sizes={sizes} />}
      <img
        src={finalSrc}
        onError={() => setErr(true)}
        decoding="async"
        loading={resolvedLoading}
        sizes={sizes}
        width={styleWidth ? width : undefined}
        height={styleHeight ? height : undefined}
        style={{ width: styleWidth, height: styleHeight, ...style }}
        {...rest}
      />
    </picture>
  );
}
