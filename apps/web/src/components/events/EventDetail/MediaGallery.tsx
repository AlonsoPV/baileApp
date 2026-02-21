import React from "react";
import ImageWithFallback from "../../ImageWithFallback";
import { VideoPlayerWithPiP } from "../../video/VideoPlayerWithPiP";

export interface MediaItem {
  slot: string;
  kind: "photo" | "video";
  url: string;
  thumb?: string;
  title?: string;
}

export interface MediaGalleryProps {
  photos: string[];
  videos: string[];
  toDirectUrl?: (url: string) => string;
}

export function MediaGallery({
  photos,
  videos,
  toDirectUrl = (u) => u,
}: MediaGalleryProps) {
  const items = [
    ...photos.map((url) => ({ type: "photo" as const, url })),
    ...videos.map((url) => ({ type: "video" as const, url })),
  ];

  if (items.length === 0) return null;

  return (
    <section className="eds-gallery" aria-label="Galería">
      <div className="eds-gallery__grid">
        {items.map((item, i) =>
          item.type === "photo" ? (
            <div key={i} className="eds-gallery__item">
              <ImageWithFallback
                src={toDirectUrl(item.url) || item.url}
                alt={`Foto ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            <div key={i} className="eds-gallery__item">
              <VideoPlayerWithPiP
                src={item.url}
                controls
                preload="metadata"
                aspectRatio="1/1"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                aria-label={`Video ${i + 1}`}
              />
            </div>
          )
        )}
      </div>
    </section>
  );
}
