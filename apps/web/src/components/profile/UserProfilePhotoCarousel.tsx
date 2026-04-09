import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ExploreResponsiveImage from "@/components/explore/ExploreResponsiveImage";
import {
  EXPLORE_SIZES_PROFILE_CAROUSEL_FULLSCREEN,
  EXPLORE_SIZES_PROFILE_CAROUSEL_MAIN,
  EXPLORE_SIZES_PROFILE_CAROUSEL_THUMB,
} from "@/utils/supabaseResponsiveImage";

export type UserProfilePhotoCarouselProps = {
  photos: string[];
  /** p. ej. profile.updated_at para ?v= en transforms */
  cacheVersion?: string | number | null;
};

/**
 * Carrusel de fotos de perfil (contain en vista principal, cover en miniaturas).
 */
export const UserProfilePhotoCarousel = React.memo(function UserProfilePhotoCarousel({
  photos,
  cacheVersion,
}: UserProfilePhotoCarouselProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goToPhoto = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleFullscreenClose = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const handleFullscreenOpen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  if (photos.length === 0) return null;

  const hasMultiplePhotos = photos.length > 1;
  const currentUrl = photos[currentIndex];

  return (
    <div
      id="user-profile-carousel"
      data-baile-id="user-profile-carousel"
      data-test-id="user-profile-carousel"
      className="carousel-container"
    >
      <div
        id="user-profile-carousel-main"
        data-baile-id="user-profile-carousel-main"
        data-test-id="user-profile-carousel-main"
        className="carousel-main"
      >
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={handleFullscreenOpen}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleFullscreenOpen();
              }
            }}
            style={{
              width: "100%",
              height: "100%",
              cursor: "pointer",
            }}
            aria-label={t("photo") + " " + (currentIndex + 1)}
          >
            <ExploreResponsiveImage
              rawUrl={currentUrl}
              cacheVersion={cacheVersion ?? null}
              preset="flyerContain"
              sizes={EXPLORE_SIZES_PROFILE_CAROUSEL_MAIN}
              alt=""
              priority
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center",
                display: "block",
              }}
            />
          </div>
        </motion.div>

        <div className="carousel-counter">
          {currentIndex + 1} / {photos.length}
        </div>

        {hasMultiplePhotos && (
          <>
            <button
              id="user-profile-carousel-prev"
              data-baile-id="user-profile-carousel-prev"
              data-test-id="user-profile-carousel-prev"
              type="button"
              onClick={prevPhoto}
              className="carousel-nav-btn carousel-nav-prev"
            >
              ‹
            </button>
            <button
              id="user-profile-carousel-next"
              data-baile-id="user-profile-carousel-next"
              data-test-id="user-profile-carousel-next"
              type="button"
              onClick={nextPhoto}
              className="carousel-nav-btn carousel-nav-next"
            >
              ›
            </button>
          </>
        )}
      </div>

      {hasMultiplePhotos && (
        <div
          id="user-profile-carousel-thumbnails"
          data-baile-id="user-profile-carousel-thumbnails"
          data-test-id="user-profile-carousel-thumbnails"
          className="carousel-thumbnails"
        >
          {photos.map((photo, index) => (
            <motion.button
              key={index}
              id={`user-profile-carousel-thumbnail-${index}`}
              data-baile-id={`user-profile-carousel-thumbnail-${index}`}
              data-test-id={`user-profile-carousel-thumbnail-${index}`}
              type="button"
              onClick={() => goToPhoto(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`carousel-thumbnail ${currentIndex === index ? "active" : ""}`}
            >
              <ExploreResponsiveImage
                rawUrl={photo}
                cacheVersion={cacheVersion ?? null}
                preset="listThumb"
                sizes={EXPLORE_SIZES_PROFILE_CAROUSEL_THUMB}
                alt={`${t("photo_thumbnail")} ${index + 1}`}
                priority={index < 4}
              />
            </motion.button>
          ))}
        </div>
      )}

      {isFullscreen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.95)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={handleFullscreenClose}
          role="presentation"
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: "12px",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <ExploreResponsiveImage
              rawUrl={currentUrl}
              cacheVersion={cacheVersion ?? null}
              preset="flyerContain"
              sizes={EXPLORE_SIZES_PROFILE_CAROUSEL_FULLSCREEN}
              alt={`${t("photo")} ${currentIndex + 1} - ${t("close_fullscreen")}`}
              priority
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />

            <button
              type="button"
              onClick={handleFullscreenClose}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "rgba(0, 0, 0, 0.7)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
              aria-label={t("close_fullscreen")}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

UserProfilePhotoCarousel.displayName = "UserProfilePhotoCarousel";
