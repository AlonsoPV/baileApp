import React from "react";
import ExploreResponsiveImage from "@/components/explore/ExploreResponsiveImage";
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
  /** updated_at / created_at para ?v= en transforms */
  photoCacheKey?: string | number | null;
}

export function MediaGallery({
  photos,
  videos,
  photoCacheKey,
}: MediaGalleryProps) {
  const items = [
    ...photos.map((url) => ({ type: "photo" as const, url })),
    ...videos.map((url) => ({ type: "video" as const, url })),
  ];

  if (items.length === 0) return null;

  let photoIndex = 0;

  return (
    <section className="eds-gallery" aria-label="Galería">
      <div className="eds-gallery__grid">
        {items.map((item, i) => {
          if (item.type === "photo") {
            const pi = photoIndex;
            photoIndex += 1;
            return (
              <div key={i} className="eds-gallery__item">
                <ExploreResponsiveImage
                  rawUrl={item.url}
                  cacheVersion={photoCacheKey ?? null}
                  preset="carteleraGrid"
                  alt={`Foto ${pi + 1}`}
                  priority={pi === 0}
                />
              </div>
            );
          }
          return (
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
          );
        })}
      </div>
    </section>
  );
}
