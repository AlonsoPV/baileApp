import React from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string;
};

const FALLBACK = "https://placehold.co/600x400/1F2937/FFFFFF?text=Imagen";

export default function ImageWithFallback({ 
  src, 
  fallback = FALLBACK, 
  alt = "",
  ...rest 
}: Props) {
  const [err, setErr] = React.useState(false);
  const finalSrc = !src || err ? fallback : src;
  
  return (
    <img
      src={finalSrc}
      alt={alt}
      onError={() => setErr(true)}
      loading="lazy"
      {...rest}
    />
  );
}

