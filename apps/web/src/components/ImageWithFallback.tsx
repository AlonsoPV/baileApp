import React from "react";

// Placeholder SVG para no depender de /default-media.png (puede no existir). Evita imágenes rotas.
const PLACEHOLDER_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#2a2a2e"/><path d="M70 60h60v80l-25-30-15 20-20-25z" fill="#4b5563"/><circle cx="85" cy="72" r="10" fill="#4b5563"/></svg>'
  );
const FALLBACK = PLACEHOLDER_SVG;

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
  onError,
  ...rest
}: ImageWithFallbackProps) {
  const [err, setErr] = React.useState(false);
  const finalSrc = !src || err ? fallback : src;
  const resolvedLoading = priority ? "eager" : "lazy";
  // Para mejorar LCP: si es imagen prioritaria, pedirla con mayor prioridad de red.
  const resolvedFetchPriority = priority ? "high" : (rest as any).fetchPriority;
  const optimizedWebp = buildSupabaseOptimizedUrl(finalSrc, "webp", width);
  const optimizedAvif = buildSupabaseOptimizedUrl(finalSrc, "avif", width);

  // Si el estilo tiene width o height en porcentajes, no aplicar dimensiones fijas
  const styleWidth = typeof style?.width === 'string' && style.width.includes('%') ? undefined : (width ? `${width}px` : undefined);
  const styleHeight = typeof style?.height === 'string' && style.height.includes('%') ? undefined : (height ? `${height}px` : undefined);

  const handleError = React.useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setErr(true);
    onError?.(e);
  }, [onError]);

  return (
    <picture>
      {optimizedAvif && <source srcSet={optimizedAvif} type="image/avif" sizes={sizes} />}
      {optimizedWebp && <source srcSet={optimizedWebp} type="image/webp" sizes={sizes} />}
      <img
        src={finalSrc}
        onError={handleError}
        decoding="async"
        loading={resolvedLoading}
        // React renderiza esto como `fetchpriority` en el DOM.
        fetchPriority={resolvedFetchPriority}
        sizes={sizes}
        width={styleWidth ? width : undefined}
        height={styleHeight ? height : undefined}
        style={{ width: styleWidth, height: styleHeight, ...style }}
        {...rest}
      />
    </picture>
  );
}
