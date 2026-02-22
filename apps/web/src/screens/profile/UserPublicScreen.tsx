import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTags } from "../../hooks/useTags";
import ImageWithFallback from "../../components/ImageWithFallback";
import { toDirectPublicStorageUrl } from "../../utils/imageOptimization";
import { PHOTO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import EventCard from "../../components/explore/cards/EventCard";
import { supabase } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import { UserProfileHero } from "../../components/profile/UserProfileHero";
import { useFollowStatus } from "../../hooks/useFollowStatus";
import { useFollowerCounts } from "../../hooks/useFollowerCounts";
import { useFollowLists } from "../../hooks/useFollowLists";
import HorizontalSlider from "../../components/explore/HorizontalSlider";
import { useTranslation } from "react-i18next";
import { VideoPlayerWithPiP } from "../../components/video/VideoPlayerWithPiP";
import { isEventUpcomingOrToday, getEventPrimaryDate } from "../../utils/eventDateExpiration";
import { Modal } from "../../components/ui/Modal";

/** Normaliza media: si viene como string JSON desde la API, lo parsea a array. */
function normalizeMediaArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const STYLES = `
  .profile-container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }
  @media (max-width: 768px) {
    .page-shell { padding-top: 0; }
  }
  .profile-banner {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }
  .banner-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 3rem;
    align-items: center;
  }
  .question-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: center;
  }
  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }
  .events-section {
    width: 100%;
  }
  .events-section > div:first-child {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .profile-banner h2,
  .profile-banner h3,
  .profile-container h2,
  .profile-container h3 {
    color: #fff;
    text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
  }
  .section-title {
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .carousel-container {
    position: relative;
    max-width: 1000px;
    margin: 0 auto;
  }
  .carousel-main {
    position: relative;
    height: 350px;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.2);
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .carousel-main img {
    object-fit: contain !important;
    object-position: center !important;
  }
  .carousel-thumbnails {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .carousel-thumbnail {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
    background: transparent;
    padding: 0;
    transition: all 0.2s;
  }
  .carousel-thumbnail.active {
    border: 3px solid #E53935;
  }
  .carousel-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.25rem;
    transition: all 0.2s;
  }
  .carousel-nav-btn:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translateY(-50%) scale(1.1);
  }
  .carousel-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .carousel-nav-prev {
    left: 1rem;
  }
  .carousel-nav-next {
    right: 1rem;
  }
  .carousel-counter {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  .glass-card-container {
    opacity: 1;
    margin-bottom: 2rem;
    padding: 2rem;
    text-align: center;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px;
    backdrop-filter: blur(10px);
    transform: none;
  }
  
  .community-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,.25) transparent;
    mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
  }
  .community-scroll::-webkit-scrollbar { height: 8px; }
  .community-scroll::-webkit-scrollbar-track { background: transparent; }
  .community-scroll::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,.22);
    border-radius: 999px;
  }
  .community-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,.35);
  }

  /* Community section - redesigned */
  .community-card-container {
    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%);
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.15);
    box-shadow: rgba(0,0,0,0.3) 0 8px 32px;
    backdrop-filter: blur(10px);
    padding: 1rem 1rem 1.25rem;
  }
  .community-header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .community-header-title { font-size: 1.25rem; font-weight: 700; color: white; margin: 0; }
  .community-header-subtitle { font-size: 0.8125rem; color: rgba(255,255,255,0.65); margin: 0.25rem 0 0 0; }
  .community-counter {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .community-counter-chip {
    height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 600;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.95);
    display: inline-flex;
    align-items: center;
  }
  .community-segmented-tabs {
    display: flex;
    background: rgba(0,0,0,0.25);
    border-radius: 12px;
    padding: 4px;
    gap: 4px;
    margin-bottom: 1rem;
  }
  .community-segmented-tab {
    flex: 1;
    min-height: 44px;
    padding: 0 1rem;
    border-radius: 10px;
    font-size: 0.9375rem;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .community-segmented-tab:focus-visible { outline: 2px solid rgba(255,157,28,0.6); outline-offset: 2px; }
  .community-segmented-tab:hover { color: white; }
  .community-segmented-tab.active {
    color: white;
    background: linear-gradient(135deg, rgba(255,157,28,0.35) 0%, rgba(255,99,56,0.2) 100%);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.1);
  }
  .community-avatar-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  .community-avatar-item {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid rgba(255,255,255,0.2);
    box-shadow: 0 0 12px rgba(0,0,0,0.3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.1);
  }
  .community-avatar-item img { width: 100%; height: 100%; object-fit: cover; }
  .community-avatar-item.overflow {
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
  }
  .community-user-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 52px;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    cursor: pointer;
    transition: background 0.15s;
  }
  .community-user-row:last-child { border-bottom: none; }
  .community-user-row:hover { background: rgba(255,255,255,0.04); }
  .community-user-row .avatar-wrap {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }
  .community-user-row .avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .community-user-row .user-info { flex: 1; min-width: 0; }
  .community-user-row .display-name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .community-relation-badges { display: flex; gap: 0.375rem; flex-shrink: 0; }
  .relation-badge {
    height: 26px;
    padding: 0 8px;
    border-radius: 6px;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .relation-badge.te-sigue {
    background: rgba(6,182,212,0.2);
    border: 1px solid rgba(6,182,212,0.5);
    color: #22d3ee;
  }
  .relation-badge.sigues {
    background: rgba(168,85,247,0.2);
    border: 1px solid rgba(168,85,247,0.5);
    color: #c084fc;
  }
  .community-ver-todos {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }
  .community-ver-todos-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: rgba(255,157,28,0.95);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 8px;
  }
  .community-ver-todos-btn:hover { color: #FF9F1C; background: rgba(255,157,28,0.1); }
  .community-empty {
    text-align: center;
    padding: 2rem 1rem;
    color: rgba(255,255,255,0.6);
    font-size: 0.9375rem;
  }
  .community-empty p { margin: 0 0 1rem; }

  /* Media info cards - Dato curioso / Qué me gusta bailar */
  .media-info-cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .media-info-card {
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    min-height: 180px;
    background: rgba(255,255,255,0.04);
  }
  .media-info-card-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
  }
  .media-info-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 40%, transparent 100%);
  }
  .media-info-card-content {
    position: relative;
    z-index: 1;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 100%;
  }
  .media-info-card-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: white;
    margin: 0 0 0.25rem;
    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
  }
  .media-info-card-text {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.9);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }
  .media-info-card-more {
    margin-top: 0.25rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: rgba(255,157,28,0.95);
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
  }
  .media-info-card-more:hover { text-decoration: underline; color: #FF9F1C; }
  @media (max-width: 768px) {
    .media-info-cards-grid { grid-template-columns: 1fr; gap: 12px; }
  }
  @media (max-width: 1024px) {
    .events-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
      gap: 1.25rem !important;
    }
  }
  @media (max-width: 768px) {
    .profile-container {
      max-width: 100% !important;
      padding: 0rem !important;
    }
    .profile-banner {
      border-radius: 0 !important;
      padding: 1.5rem 1rem !important;
      margin: 0 !important;
    }
    .banner-grid {
      grid-template-columns: 1fr !important;
      gap: 1.5rem !important;
      justify-items: center !important;
      text-align: center !important;
    }
    .banner-grid h1 {
      font-size: 2.6rem !important;
      line-height: 1.2 !important;
    }
    .banner-avatar {
      width: 200px !important;
      height: 200px !important;
    }
    .banner-avatar-fallback {
      font-size: 4.25rem !important;
    }
    .question-section {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
    .question-section h3 {
      font-size: 1.1rem !important;
      margin-bottom: 0.75rem !important;
    }
    .events-grid {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
    .events-section > div:first-child {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.75rem !important;
    }
    .events-section > div:first-child > div:last-child {
      align-self: flex-start !important;
    }
    .carousel-container {
      max-width: 100% !important;
      padding: 0 1rem !important;
    }
    .carousel-main {
      height: 350px !important;
    }
    .carousel-main img {
      object-fit: contain !important;
      object-position: center !important;
    }
    .carousel-thumbnails {
      gap: 0.25rem !important;
      margin-top: 0.75rem !important;
    }
    .carousel-thumbnail {
      width: 50px !important;
      height: 50px !important;
    }
    .carousel-nav-btn {
      width: 40px !important;
      height: 40px !important;
      font-size: 1rem !important;
    }
    .carousel-nav-prev {
      left: 0.5rem !important;
    }
    .carousel-nav-next {
      right: 0.5rem !important;
    }
    .carousel-counter {
      top: 0.5rem !important;
      right: 0.5rem !important;
      padding: 0.25rem 0.75rem !important;
      font-size: 0.75rem !important;
    }
    .section-title {
      font-size: 1.25rem !important;
      margin-bottom: 1rem !important;
    }
    .section-content {
      padding: 1rem !important;
    }
    .bio-section {
      padding: 1rem !important;
      margin-bottom: 1.5rem !important;
    }
    .events-section {
      padding: 1rem !important;
      margin-bottom: 1.5rem !important;
    }
    .gallery-section {
      padding: 1rem !important;
      margin-bottom: 1.5rem !important;
    }
    .glass-card-container {
      padding: 1rem !important;
      margin-bottom: 1rem !important;
      border-radius: 16px !important;
    }
    .question-section video {
      min-height: 350px !important;
      object-fit: contain !important;
    }
    .question-section > div:last-child {
      min-height: 350px !important;
    }
  }
  
  @media (max-width: 480px) {
    .banner-grid h1 {
      font-size: 2.1rem !important;
    }
    .banner-avatar {
      width: 170px !important;
      height: 170px !important;
    }
    .banner-avatar-fallback {
      font-size: 4rem !important;
    }
    .carousel-main {
      height: 350px !important;
    }
    .carousel-main img {
      object-fit: contain !important;
      object-position: center !important;
    }
    .question-section video {
      min-height: 350px !important;
      object-fit: contain !important;
    }
    .question-section > div:last-child {
      min-height: 350px !important;
    }
    .carousel-thumbnail {
      width: 45px !important;
      height: 45px !important;
    }
    .carousel-nav-btn {
      width: 36px !important;
      height: 36px !important;
      font-size: 0.9rem !important;
    }
    .section-title {
      font-size: 1.1rem !important;
    }
    .glass-card-container {
      padding: 0.75rem !important;
      border-radius: 12px !important;
    }
    .events-grid {
      gap: 0.75rem !important;
    }
    .events-section > div:first-child {
      margin-bottom: 1rem !important;
    }
  }

  /* Ajustes finos solo para pantallas muy pequeñas (móviles ≤ 430px) */
  @media (max-width: 430px) {
    .profile-container {
      padding: 0 1rem !important;
    }
    .profile-banner {
      max-width: 100% !important;
    }
    .banner-grid h1 {
      font-size: 1.9rem !important;
      line-height: 1.2 !important;
    }
    .banner-avatar {
      width: 150px !important;
      height: 150px !important;
    }
    .section-title {
      font-size: 1rem !important;
      margin-bottom: 0.75rem !important;
    }
    .question-section {
      gap: 0.75rem !important;
    }
    .glass-card-container {
      padding: 0.75rem 0.9rem !important;
      margin-bottom: 0.85rem !important;
      border-radius: 12px !important;
    }
    .events-section {
      padding: 0.85rem !important;
    }
    .events-section .section-title {
      font-size: 1rem !important;
    }
    .events-grid {
      gap: 0.7rem !important;
    }
    .events-section > div:first-child {
      margin-bottom: 0.9rem !important;
    }
    /* Botones dentro de Eventos de Interés más compactos y sin pegarse a los bordes */
    .events-section button {
      padding: 0.6rem 1.1rem !important;
      border-radius: 10px !important;
      font-size: 0.85rem !important;
    }
  }
`;

const CarouselComponent = React.memo<{ photos: string[] }>(({ photos }) => {
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

  const handleFullscreenOpen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const handleFullscreenClose = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  if (photos.length === 0) return null;

  const hasMultiplePhotos = photos.length > 1;

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
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        >
          <ImageWithFallback
            src={photos[currentIndex]}
            alt={`${t('photo')} ${currentIndex + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              cursor: 'pointer'
            }}
            onClick={handleFullscreenOpen}
          />
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
              onClick={prevPhoto}
              className="carousel-nav-btn carousel-nav-prev"
              disabled={!hasMultiplePhotos}
            >
              ‹
            </button>
            <button
              id="user-profile-carousel-next"
              data-baile-id="user-profile-carousel-next"
              data-test-id="user-profile-carousel-next"
              onClick={nextPhoto}
              className="carousel-nav-btn carousel-nav-next"
              disabled={!hasMultiplePhotos}
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
              onClick={() => goToPhoto(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`carousel-thumbnail ${currentIndex === index ? 'active' : ''}`}
            >
              <ImageWithFallback
                src={photo}
                alt={`${t('photo_thumbnail')} ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </motion.button>
          ))}
        </div>
      )}

      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={handleFullscreenClose}
        >
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <ImageWithFallback
              src={photos[currentIndex]}
              alt={`${t('photo')} ${currentIndex + 1} - ${t('close_fullscreen')}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />

            <button
              onClick={handleFullscreenClose}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

CarouselComponent.displayName = 'CarouselComponent';

export const UserProfileLive: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: allTags } = useTags();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-public', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_user_public')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setLoadingTimedOut(false);
      const timeoutId = setTimeout(() => {
        setLoadingTimedOut(true);
      }, 15000);
      return () => clearTimeout(timeoutId);
    }
    setLoadingTimedOut(false);
  }, [isLoading, userId]);

  const { data: rsvpEvents } = useQuery({
    queryKey: ['user-rsvps', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_rsvp')
        .select(`*, events_date!inner(*, events_parent!inner(*, profiles_organizer(*)))`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Filter RSVP events to upcoming only (>= today). Exclude past events.
  const availableRsvpEvents = React.useMemo(() => {
    const filtered = (rsvpEvents || []).filter((r: any) =>
      isEventUpcomingOrToday(r.events_date)
    );
    return filtered.sort((a: any, b: any) => {
      const fa = getEventPrimaryDate(a.events_date) || '';
      const fb = getEventPrimaryDate(b.events_date) || '';
      return fa.localeCompare(fb);
    });
  }, [rsvpEvents]);

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const resolveSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
      }
    };

    resolveSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const safeMedia = React.useMemo(() => {
    const viewMedia = (profile as any)?.media;
    const arr = normalizeMediaArray(viewMedia);

    // Debug: verificar datos del perfil (vista pública)
    if (process.env.NODE_ENV === 'development' && profile) {
      console.log('[UserPublicScreen] Profile data (from view):', {
        hasMedia: !!(profile as any).media,
        mediaLength: arr.length,
        mediaType: Array.isArray(viewMedia) ? 'array' : typeof viewMedia,
        hasRespuestas: !!(profile as any).respuestas,
      });
    }

    return arr;
  }, [profile]);

  const profileUserId = profile?.user_id || profile?.id;

  // Cargar media y respuestas desde la tabla base para asegurar que el perfil público tenga
  // la misma galería y secciones de preguntas que el perfil privado.
  const { data: profileFromTable } = useQuery({
    queryKey: ['user-public-profile-fields', profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_user')
        .select('media,respuestas')
        .eq('user_id', profileUserId)
        .maybeSingle();
      if (error) {
        console.error('[UserPublicScreen] Error fetching profile fields from profiles_user:', error);
        throw error;
      }
      return data || {};
    },
  });

  const mediaFromTable = React.useMemo(() => {
    const raw = (profileFromTable as any)?.media;
    return normalizeMediaArray(raw);
  }, [profileFromTable]);

  const respuestasFromTable = React.useMemo(() => {
    return (profileFromTable as any)?.respuestas || null;
  }, [profileFromTable]);

  const effectiveMedia = React.useMemo(() => {
    if (Array.isArray(mediaFromTable) && mediaFromTable.length > 0) {
      return mediaFromTable;
    }
    return safeMedia;
  }, [mediaFromTable, safeMedia]);

  const effectiveRespuestas = React.useMemo(() => {
    const fromView = (profile as any)?.respuestas;
    if (fromView && typeof fromView === 'object') {
      return fromView;
    }
    return respuestasFromTable;
  }, [profile, respuestasFromTable]);

  const toSupabasePublicUrl = React.useCallback((maybePath?: string): string | undefined => {
    if (!maybePath) return undefined;
    const v = String(maybePath).trim();
    if (/^https?:\/\//i.test(v) || v.startsWith('data:') || v.startsWith('/')) return v;
    const slash = v.indexOf('/');
    if (slash > 0) {
      const bucket = v.slice(0, slash);
      const path = v.slice(slash + 1);
      try {
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      } catch {
        return v;
      }
    }
    return v;
  }, []);

  const avatarUrl = React.useMemo(() => {
    const toUrl = (u: string | undefined) => (u ? (toDirectPublicStorageUrl(u) ?? u) : undefined);
    const fromProfile = profile?.avatar_url ? toSupabasePublicUrl(profile.avatar_url) : undefined;
    const p1 = getMediaBySlot(effectiveMedia as any, 'p1');
    const fromP1 = p1?.url ? p1.url : undefined;
    const avatar = getMediaBySlot(effectiveMedia as any, 'avatar');
    const fromAvatarSlot = avatar?.url ? avatar.url : undefined;
    const raw = toUrl(fromProfile || fromP1 || fromAvatarSlot) ?? fromProfile ?? fromP1 ?? fromAvatarSlot;
    if (!raw || typeof raw !== 'string' || !raw.trim() || raw.includes('undefined') || raw === '/default-media.png') return undefined;
    return raw;
  }, [effectiveMedia, profile?.avatar_url, toSupabasePublicUrl]);

  const [avatarError, setAvatarError] = React.useState(false);
  React.useEffect(() => { setAvatarError(false); }, [avatarUrl]);

  const carouselPhotos = React.useMemo(() => {
    if (!effectiveMedia || !Array.isArray(effectiveMedia) || effectiveMedia.length === 0) {
      return [];
    }
    return PHOTO_SLOTS
      .map(slot => getMediaBySlot(effectiveMedia as any, slot))
      .filter(item => item && item.kind === 'photo' && item.url && typeof item.url === 'string' && item.url.trim() !== '' && !item.url.includes('undefined') && item.url !== '/default-media.png')
      .map(item => toDirectPublicStorageUrl(item!.url) || item!.url);
  }, [effectiveMedia]);

  const { counts, setCounts, refetch: refetchCounts } = useFollowerCounts(profileUserId);
  const { isFollowing, toggleFollow, loading: followLoading } = useFollowStatus(profileUserId);
  const isOwnProfile = session?.user?.id && profileUserId === session.user.id;
  const showFollowButton = !!session && !isOwnProfile && !!profileUserId;
  const { following, followers, refetch: refetchLists } = useFollowLists(profileUserId);
  const [networkTab, setNetworkTab] = useState<"following" | "followers">("followers");
  const networkList = networkTab === "following" ? following : followers;
  const networkIsEmpty = networkList.length === 0;
  const [showAllNetworkModal, setShowAllNetworkModal] = useState(false);
  const [verMasModal, setVerMasModal] = useState<{ title: string; text: string } | null>(null);

  const goToProfile = useCallback((id?: string) => {
    if (id) navigate(`/u/${id}`);
  }, [navigate]);

  if (isLoading && !loadingTimedOut) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{ padding: 24, textAlign: 'center', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
            <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 16px' }}>
              <p style={{ marginBottom: '8px' }}>{t('loading_profile')}</p>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                {t('refresh_page_for_faster_load')}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading && loadingTimedOut) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{ padding: 24, textAlign: 'center', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 360 }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⚠️</div>
            <p style={{ marginBottom: 8 }}>{t('could_not_load_profile')}</p>
            <p style={{ marginBottom: 16, opacity: 0.75, fontSize: '0.9rem' }}>
              {t('check_connection')}
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{ padding: 24, textAlign: 'center', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>❌</div>
            <p>{t('profile_not_found')}</p>
          </div>
        </div>
      </>
    );
  }

  const handleShareProfile = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      const title = profile?.display_name || t('profile');
      const text = t('check_teacher_profile', { name: profile?.display_name || t('user') });
      const navAny = (navigator as any);
      
      if (navAny && typeof navAny.share === 'function') {
        try {
          await navAny.share({ title, text, url });
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') return;
          throw shareError;
        }
      } else {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = url;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      alert(t('could_not_copy_link'));
    }
  };

  const handleToggleFollow = async () => {
    const result = await toggleFollow();
    if (result?.requiresAuth) {
      navigate('/auth/login');
      return;
    }

    if (typeof result?.following === 'boolean') {
      setCounts((prev) => ({
        following: prev.following,
        followers: Math.max(
          0,
          prev.followers + (result.following ? 1 : -1)
        ),
      }));
      
      setTimeout(() => {
        refetchCounts();
        refetchLists();
      }, 500);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="page-shell" style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: colors.darkBase,
        color: colors.light,
        paddingTop: '0',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ margin: '0.5rem auto 0 auto', maxWidth: 900 }}>
          <UserProfileHero
            user={profile}
            avatarUrl={avatarUrl}
            allTags={allTags}
            ritmosSlugs={normalizeRitmosToSlugs(profile, allTags)}
            isOwnProfile={isOwnProfile}
            showFollowButton={showFollowButton}
            followState={{
              followers: counts.followers ?? 0,
              following: counts.following ?? 0,
              isFollowing,
              loading: followLoading,
            }}
            onFollowToggle={handleToggleFollow}
            onShare={handleShareProfile}
            copied={copied}
            onBack={() => navigate('/explore')}
            showBackButton
            avatarError={avatarError}
            onAvatarError={() => setAvatarError(true)}
          />
        </div>

        <div
          id="user-profile-main-content"
          data-baile-id="user-profile-main-content"
          data-test-id="user-profile-main-content"
          className="profile-container"
          style={{
            padding: '2rem',
            margin: '0 auto'
          }}
        >

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="community-card-container"
            style={{ marginTop: '1.25rem' }}
          >
            <div className="community-header">
              <div>
                <h3 className="community-header-title">Comunidad</h3>
                <p className="community-header-subtitle">Seguidores y seguidos</p>
              </div>
              <div className="community-counter">
                <span className="community-counter-chip">Seguidores {(counts.followers ?? 0).toLocaleString('es-MX')}</span>
                <span className="community-counter-chip">Siguiendo {(counts.following ?? 0).toLocaleString('es-MX')}</span>
              </div>
            </div>

            <div className="community-segmented-tabs">
              <button
                type="button"
                className={`community-segmented-tab ${networkTab === 'followers' ? 'active' : ''}`}
                onClick={() => setNetworkTab('followers')}
              >
                {t('followers')} ({(counts.followers ?? 0).toLocaleString('es-MX')})
              </button>
              <button
                type="button"
                className={`community-segmented-tab ${networkTab === 'following' ? 'active' : ''}`}
                onClick={() => setNetworkTab('following')}
              >
                {t('following')} ({(counts.following ?? 0).toLocaleString('es-MX')})
              </button>
            </div>

            {networkIsEmpty ? (
              <div className="community-empty">
                <p>{networkTab === 'following'
                  ? t('no_following_yet', { name: profile?.display_name || t('this_user') })
                  : t('no_followers_yet', { name: profile?.display_name || t('this_user') })}</p>
                <button
                  type="button"
                  onClick={handleShareProfile}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    background: 'rgba(255,157,28,0.2)',
                    border: '1px solid rgba(255,157,28,0.4)',
                    color: '#FF9F1C',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  {t('share_profile')}
                </button>
              </div>
            ) : (
              <>
                <div className="community-avatar-row">
                  {(networkList.slice(0, 7) as Array<{ id: string; display_name: string | null; avatar_url: string | null }>).map((person, idx) => {
                    const isOverflow = idx === 6 && networkList.length > 7;
                    return (
                      <button
                        key={person.id}
                        type="button"
                        className={`community-avatar-item ${isOverflow ? 'overflow' : ''}`}
                        onClick={() => isOverflow ? setShowAllNetworkModal(true) : goToProfile(person.id)}
                        title={person.display_name || undefined}
                      >
                        {isOverflow ? `+${networkList.length - 7}` : (
                          <ImageWithFallback
                            src={toDirectPublicStorageUrl(person.avatar_url) || person.avatar_url || ''}
                            alt={person.display_name || t('profile')}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {networkList.slice(0, 6).map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      className="community-user-row"
                      onClick={() => goToProfile(person.id)}
                    >
                      <div className="avatar-wrap">
                        <ImageWithFallback
                          src={toDirectPublicStorageUrl(person.avatar_url) || person.avatar_url || ''}
                          alt={person.display_name || t('profile')}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div className="user-info">
                        <div className="display-name">{person.display_name || t('dancer')}</div>
                      </div>
                      <div className="community-relation-badges">
                        {networkTab === 'followers' && (
                          <span className="relation-badge te-sigue">{t('follows_you')}</span>
                        )}
                        {networkTab === 'following' && (
                          <span className="relation-badge sigues">{t('you_follow')}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="community-ver-todos">
                  <button
                    type="button"
                    className="community-ver-todos-btn"
                    onClick={() => setShowAllNetworkModal(true)}
                  >
                    Ver todos los {networkTab === 'followers' ? t('followers').toLowerCase() : t('following').toLowerCase()}
                    <span aria-hidden>→</span>
                  </button>
                </div>
              </>
            )}
          </motion.section>

          <Modal
            open={showAllNetworkModal}
            onClose={() => setShowAllNetworkModal(false)}
            title={networkTab === 'followers' ? t('followers') : t('following')}
          >
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {networkList.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="community-user-row"
                  onClick={() => { goToProfile(person.id); setShowAllNetworkModal(false); }}
                  style={{ width: '100%' }}
                >
                  <div className="avatar-wrap">
                    <ImageWithFallback
                      src={toDirectPublicStorageUrl(person.avatar_url) || person.avatar_url || ''}
                      alt={person.display_name || t('profile')}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="user-info">
                    <div className="display-name">{person.display_name || t('dancer')}</div>
                  </div>
                  <div className="community-relation-badges">
                    {networkTab === 'followers' && (
                      <span className="relation-badge te-sigue">{t('follows_you')}</span>
                    )}
                    {networkTab === 'following' && (
                      <span className="relation-badge sigues">{t('you_follow')}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Modal>

          {(() => {
            const fotoP2 = getMediaBySlot(effectiveMedia as any, 'p2');
            const fotoP3 = getMediaBySlot(effectiveMedia as any, 'p3');
            const datoCurioso = (effectiveRespuestas as any)?.dato_curioso;
            const gustaBailar = (effectiveRespuestas as any)?.gusta_bailar;
            const datoCuriosoTrimmed = typeof datoCurioso === 'string' ? datoCurioso.trim() : '';
            const gustaBailarTrimmed = typeof gustaBailar === 'string' ? gustaBailar.trim() : '';
            const hasP2 = (fotoP2?.url) || (datoCuriosoTrimmed && datoCuriosoTrimmed.length > 0);
            const hasP3 = (fotoP3?.url) || (gustaBailarTrimmed && gustaBailarTrimmed.length > 0);
            if (!hasP2 && !hasP3) return null;

            const truncateForPreview = (text: string, maxLen: number = 140) => {
              if (!text || text.length <= maxLen) return { text, needsMore: false };
              return { text: text.slice(0, maxLen).trim() + '…', needsMore: true };
            };
            const dc = truncateForPreview(datoCuriosoTrimmed || t('no_curious_fact'));
            const gb = truncateForPreview(gustaBailarTrimmed || t('no_dance_style'));

            return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="section-content glass-card-container"
            style={{ marginTop: '1.25rem' }}
          >
            <div className="media-info-cards-grid">
              {hasP2 && (
                <div className="media-info-card">
                  <div
                    className="media-info-card-bg"
                    style={{ backgroundImage: fotoP2?.url ? `url(${toDirectPublicStorageUrl(fotoP2.url) || fotoP2.url})` : undefined }}
                  />
                  <div className="media-info-card-overlay" />
                  <div className="media-info-card-content">
                    <h3 className="media-info-card-title">{t('curious_fact_title')}</h3>
                    <p className="media-info-card-text">{dc.text}</p>
                    {dc.needsMore && (
                      <button
                        type="button"
                        className="media-info-card-more"
                        onClick={() => setVerMasModal({ title: t('curious_fact_title'), text: datoCuriosoTrimmed || t('no_curious_fact') })}
                      >
                        {t('see_more')}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {hasP3 && (
                <div className="media-info-card">
                  <div
                    className="media-info-card-bg"
                    style={{ backgroundImage: fotoP3?.url ? `url(${toDirectPublicStorageUrl(fotoP3.url) || fotoP3.url})` : undefined }}
                  />
                  <div className="media-info-card-overlay" />
                  <div className="media-info-card-content">
                    <h3 className="media-info-card-title">{t('what_you_like_to_dance_title')}</h3>
                    <p className="media-info-card-text">{gb.text}</p>
                    {gb.needsMore && (
                      <button
                        type="button"
                        className="media-info-card-more"
                        onClick={() => setVerMasModal({ title: t('what_you_like_to_dance_title'), text: gustaBailarTrimmed || t('no_dance_style') })}
                      >
                        {t('see_more')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
            );
          })()}

          <Modal
            open={!!verMasModal}
            onClose={() => setVerMasModal(null)}
            title={verMasModal?.title}
          >
            {verMasModal && (
              <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(255,255,255,0.95)' }}>
                {verMasModal.text}
              </p>
            )}
          </Modal>

          <motion.section
            id="user-profile-interested-events"
            data-baile-id="user-profile-interested-events"
            data-test-id="user-profile-interested-events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="events-section glass-card-container"
          >
            <div className="events-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <h3 className="section-title" style={{ margin: 0 }}>
                {t('interested_events_title')}
              </h3>
              {availableRsvpEvents.length > 0 && (
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.light,
                  whiteSpace: 'nowrap'
                }}>
                  {availableRsvpEvents.length === 1 
                    ? t('event_count', { count: availableRsvpEvents.length })
                    : t('event_count_plural', { count: availableRsvpEvents.length })}
                </div>
              )}
            </div>

            {availableRsvpEvents.length > 0 ? (
              <HorizontalSlider
                items={availableRsvpEvents.map((rsvp: any) => rsvp.events_date).filter(Boolean)}
                renderItem={(evento: any, index: number) => (
                  <motion.div
                    key={evento.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <EventCard item={evento} />
                  </motion.div>
                )}
                gap={20}
                autoColumns="minmax(320px, 400px)"
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  border: '2px dashed rgba(255, 255, 255, 0.2)'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: colors.light
                }}>
                  {t('no_interested_events_yet')}
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  opacity: 0.7,
                  marginBottom: '1.5rem',
                  color: colors.light
                }}>
                  {t('explore_events_prompt')}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/explore')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🔍 {t('explore_events')}
                </motion.button>
              </motion.div>
            )}
          </motion.section>

          {(() => {
            if (!effectiveMedia || !Array.isArray(effectiveMedia) || effectiveMedia.length === 0) {
              return null;
            }
            
            const videoV1 = getMediaBySlot(effectiveMedia as any, 'v1');
            
            // Debug: verificar qué datos tenemos
            if (process.env.NODE_ENV === 'development') {
              console.log('[UserPublicScreen] Video - videoV1:', videoV1, 'effectiveMedia length:', effectiveMedia.length);
            }
            
            if (!videoV1 || !videoV1.url || typeof videoV1.url !== 'string' || videoV1.url.trim() === '') {
              return null;
            }
            
            return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="section-content glass-card-container"
          >
            <div className="question-section">
              <div>
                <h3 className="section-title">🎥 {t('main_video')}</h3>
                {/* <div style={{
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '1.05rem',
                  lineHeight: '1.7',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: '400'
                }}>
                  Aquí puedes ver el video principal público de este perfil.
                </div> */}
              </div>

              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '480px',
                  margin: '0 auto',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2))',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                  padding: '3px'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: '3px',
                    borderRadius: '13px',
                    background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(255, 209, 102, 0.1))',
                    pointerEvents: 'none',
                    zIndex: 1
                  }} />
                  
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: '13px',
                    overflow: 'hidden',
                    background: '#000',
                    zIndex: 2
                  }}>
                    <VideoPlayerWithPiP
                    src={toDirectPublicStorageUrl(videoV1.url) || videoV1.url}
                    controls
                    preload="metadata"
                    controlsList="nodownload noplaybackrate"
                    aspectRatio="4 / 5"
                    style={{
                      display: 'block',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      minHeight: '350px'
                    }}
                    aria-label={t('main_video')}
                  />
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: '5px',
                    left: '5px',
                    width: '40px',
                    height: '40px',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 3
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    width: '40px',
                    height: '40px',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 3
                  }} />
                </div>
              </div>
            </div>
          </motion.section>
            );
          })()}

          {carouselPhotos && Array.isArray(carouselPhotos) && carouselPhotos.length > 0 && (
            <motion.section
              id="user-profile-photo-gallery"
              data-baile-id="user-profile-photo-gallery"
              data-test-id="user-profile-photo-gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="gallery-section glass-card-container"
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <h3 className="section-title">
                  📷 {t('photo_gallery')}
                </h3>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                </div>
              </div>

              <CarouselComponent photos={carouselPhotos} />
            </motion.section>
          )}
        </div>
      </div>
    </>
  );
};
