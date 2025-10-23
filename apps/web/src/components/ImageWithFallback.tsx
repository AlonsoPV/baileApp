import React from "react";
const FALLBACK = "/default-media.png";

export default function ImageWithFallback(
  { src, fallback = FALLBACK, ...rest }:
  React.ImgHTMLAttributes<HTMLImageElement> & { fallback?: string }
) {
  const [err, setErr] = React.useState(false);
  const finalSrc = !src || err ? fallback : src;
  return <img src={finalSrc} onError={() => setErr(true)} {...rest} />;
}
