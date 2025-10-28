import React from "react";
const FALLBACK = "/default-media.png";

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string;
  priority?: boolean; // si true, fuerza carga inmediata
};

export default function ImageWithFallback({ src, fallback = FALLBACK, priority = false, loading, ...rest }: ImageWithFallbackProps) {
  const [err, setErr] = React.useState(false);
  const finalSrc = !src || err ? fallback : src;
  const resolvedLoading = loading || (priority ? 'eager' : 'lazy');
  return (
    <img
      src={finalSrc}
      onError={() => setErr(true)}
      decoding="async"
      loading={resolvedLoading as any}
      {...rest}
    />
  );
}
