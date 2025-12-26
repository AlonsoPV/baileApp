import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useEventParentsByOrganizer, useEventDatesByOrganizer } from "../../hooks/useEventParentsByOrganizer";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
import { useTags } from "../../hooks/useTags";
import { fmtDate } from "../../utils/format";
import RitmosChips from "../../components/RitmosChips";
import ImageWithFallback from "../../components/ImageWithFallback";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { calculateNextDateWithTime } from "../../utils/calculateRecurringDates";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";
import AddToCalendarWithStats from "../../components/AddToCalendarWithStats";
import RequireLogin from "@/components/auth/RequireLogin";
import { BioSection } from "../../components/profile/BioSection";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import BankAccountDisplay from "../../components/profile/BankAccountDisplay";
import { VideoPlayerWithPiP } from "../../components/video/VideoPlayerWithPiP";

// CSS constante a nivel de módulo para evitar reinserción en cada render
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
  
  * {
    font-family: ${typography.fontFamily.primary};
  }
  
  .org-container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }
  
  .org-banner {
    width: 100%;
    max-width: 900px;
    margin: auto !important;
    position: relative;
    overflow: hidden;
  }
  
  .org-banner-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 3rem;
    align-items: center;
  }
  
  .glass-card {
    background: ${colors.glass.light};
    backdrop-filter: blur(20px);
    border: 1px solid ${colors.glass.medium};
    box-shadow: ${colors.shadows.glass};
  }
  
  .gradient-text {
    background: ${colors.gradients.primary};
    -webkit-background-clip: text;
    background-clip: text;
  }
  
  .floating-animation {
    animation: float 6s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .shimmer-effect {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  .glass-card-container {
    opacity: 1;
    margin: 0 auto 2rem auto;
    margin-top: 0;
    padding: 2rem;
    text-align: center;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px;
    backdrop-filter: blur(10px);
    transform: none;
  }
  .org-banner h1,
  .org-banner h2,
  .org-banner h3,
  .org-container h2,
  .org-container h3 {
    color: #fff;
    text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
    font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .section-title {
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  
  .org-social-events-section {
    margin-bottom: 2rem;
  }
  
  .org-social-events-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .org-social-events-header-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  
  .org-social-events-header-text {
    flex: 1;
    min-width: 0;
  }
  
  .org-social-events-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .org-social-card {
    padding: clamp(1.5rem, 2.5vw, 2.5rem);
    border-radius: clamp(16px, 2.5vw, 28px);
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: rgba(30, 30, 30, 0.6);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .org-social-card-row {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    position: relative;
    z-index: 2;
    padding-top: 0.5rem;
  }
  
  .org-social-card-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    flex-shrink: 0;
  }
  
  .org-social-card-content {
    flex: 1;
    min-width: 0;
  }
  
  .org-social-card-title {
    font-size: clamp(1.5rem, 2vw, 2rem);
    font-weight: 800;
    margin: 0 0 0.75rem 0;
    background: linear-gradient(135deg, #1E88E5, #FF3D57);
    -webkit-background-clip: text;
    background-clip: text;
    color: #FFFFFF;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  
  .org-social-card-description {
    font-size: 1rem;
    opacity: 0.9;
    margin: 0;
    font-weight: 400;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .org-social-card-button {
    flex-shrink: 0;
  }
  
  .org-social-card-button button {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #1E88E5, #00BCD4);
    color: #FFFFFF;
    border: none;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(30, 136, 229, 0.4);
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  
  .video-gallery-main {
    position: relative;
    aspect-ratio: 16/9;
    border-radius: 20px;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.15);
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1));
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .video-gallery-main:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 50px rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.25);
  }
  .video-gallery-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    cursor: pointer;
  }
  .video-gallery-counter {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.7));
    backdrop-filter: blur(10px);
    color: white;
    padding: 0.6rem 1.2rem;
    border-radius: 24px;
    font-size: 0.875rem;
    font-weight: 700;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  .video-gallery-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
    backdrop-filter: blur(10px);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 50%;
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.5rem;
    font-weight: 700;
    transition: all 0.2s ease;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    z-index: 10;
  }
  .video-gallery-nav-btn:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15));
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }
  .video-gallery-nav-btn:active {
    transform: translateY(-50%) scale(0.95);
  }
  .video-gallery-nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .video-gallery-nav-btn--prev {
    left: 1.25rem;
  }
  .video-gallery-nav-btn--next {
    right: 1.25rem;
  }
  .video-gallery-thumbnails {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.75rem;
    margin-top: 1.5rem;
    max-width: 100%;
  }
  .video-gallery-thumb {
    position: relative;
    aspect-ratio: 16/9;
    border-radius: 12px;
    overflow: hidden;
    border: 3px solid transparent;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  .video-gallery-thumb:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }
  .video-gallery-thumb.active {
    border-color: #E53935;
    box-shadow: 0 0 0 2px rgba(229, 57, 53, 0.3), 0 8px 24px rgba(229, 57, 53, 0.4);
  }
  .video-gallery-thumb video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    .org-container {
      max-width: 100% !important;
      padding: 1rem !important;
    }
    .org-banner {
      border-radius: 0 !important;
      padding: 2rem 1rem !important;
      margin: 0 auto !important;
    }
    .org-banner-grid {
      grid-template-columns: 1fr !important;
      gap: 2rem !important;
      justify-items: center !important;
      text-align: center !important;
    }
    .org-banner-avatar {
      width: 220px !important;
      height: 220px !important;
    }
    .org-banner-avatar-fallback {
      font-size: 5rem !important;
    }
    .org-banner h1 {
      font-size: 3rem !important;
      line-height: 1.2 !important;
    }
    .org-banner .org-chips {
      justify-content: center !important;
      margin-bottom: 1rem !important;
    }
    .glass-card {
      margin-bottom: 1.5rem !important;
      padding: 1.5rem !important;
    }
    .glass-card h3 {
      font-size: 1.5rem !important;
    }
    .glass-card p {
      font-size: 1rem !important;
    }
    .carousel-main {
      aspect-ratio: 16/9 !important;
      max-width: 100% !important;
    }
    .carousel-thumbnails {
      gap: 0.5rem !important;
      margin-top: 1rem !important;
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
    .carousel-counter {
      font-size: 0.8rem !important;
      padding: 0.25rem 0.75rem !important;
    }
    .dfs-wrap {
      width: 100% !important;
      max-width: 100% !important;
    }
    .dfs-controls {
      width: 100% !important;
      max-width: 100% !important;
    }
    .glass-card-container {
      padding: 1rem !important;
      margin-bottom: 1rem !important;
      border-radius: 16px !important;
    }
    
    .org-social-events-section {
      margin-bottom: 1.5rem !important;
    }
    
    .org-social-events-header {
      flex-direction: column !important;
      align-items: center !important;
      text-align: center !important;
      gap: 1rem !important;
      margin-bottom: 1.25rem !important;
    }
    
    .org-social-events-header-icon {
      width: 56px !important;
      height: 56px !important;
      font-size: 1.4rem !important;
    }
    
    .org-social-events-header-text {
      width: 100% !important;
    }
    
    .org-social-events-header-text h3 {
      font-size: 1.4rem !important;
      margin-bottom: 0.5rem !important;
    }
    
    .org-social-events-header-text p {
      font-size: 0.9rem !important;
    }
    
    .org-social-events-list {
      gap: 1.25rem !important;
    }
    
    .org-social-card {
      padding: 1.25rem !important;
      border-radius: 18px !important;
      gap: 1.25rem !important;
    }
    
    .org-social-card-row {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 1rem !important;
      padding-top: 0.75rem !important;
    }
    
    .org-social-card-icon {
      width: 60px !important;
      height: 60px !important;
      font-size: 2.1rem !important;
      align-self: center !important;
    }
    
    .org-social-card-content {
      text-align: center !important;
    }
    
    .org-social-card-title {
      font-size: 1.4rem !important;
      margin-bottom: 0.75rem !important;
      text-align: center !important;
    }
    
    .org-social-card-description {
      font-size: 0.95rem !important;
      text-align: center !important;
      margin-bottom: 1rem !important;
    }
    
    .org-social-card-button {
      width: 100% !important;
    }
    
    .org-social-card-button button {
      width: 100% !important;
      justify-content: center !important;
      padding: 0.7rem 1.25rem !important;
      font-size: 0.85rem !important;
    }
    
    .video-gallery-main {
      border-radius: 16px;
    }
    .video-gallery-counter {
      top: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }
    .video-gallery-nav-btn {
      width: 44px;
      height: 44px;
      font-size: 1.25rem;
    }
    .video-gallery-nav-btn--prev {
      left: 1rem;
    }
    .video-gallery-nav-btn--next {
      right: 1rem;
    }
    .video-gallery-thumbnails {
      grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
      gap: 0.6rem;
      margin-top: 1.25rem;
    }
    
    .competition-groups-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
      gap: 1.25rem !important;
    }
  }
  
  @media (max-width: 480px) {
    .org-banner {
      padding: 1.5rem 1rem !important;
    }
    .org-banner-avatar {
      width: 180px !important;
      height: 180px !important;
    }
    .org-banner-avatar-fallback {
      font-size: 4.2rem !important;
    }
    .org-banner h1 {
      font-size: 2.6rem !important;
    }
    .glass-card {
      padding: 1rem !important;
      margin-bottom: 1rem !important;
    }
    .glass-card h3 {
      font-size: 1.25rem !important;
    }
    .carousel-thumbnail {
      width: 40px !important;
      height: 40px !important;
    }
    .carousel-nav-btn {
      width: 36px !important;
      height: 36px !important;
    }
    .glass-card-container {
      padding: 0.75rem !important;
      border-radius: 12px !important;
    }
    
    .org-social-events-section {
      margin-bottom: 1rem !important;
    }
    
    .org-social-events-header {
      gap: 0.75rem !important;
      margin-bottom: 1rem !important;
    }
    
    .org-social-events-header-icon {
      width: 52px !important;
      height: 52px !important;
      font-size: 1.3rem !important;
    }
    
    .org-social-events-header-text h3 {
      font-size: 1.25rem !important;
    }
    
    .org-social-events-header-text p {
      font-size: 0.85rem !important;
    }
    
    .org-social-events-list {
      gap: 1rem !important;
    }
    
    .org-social-card {
      padding: 1rem !important;
      border-radius: 16px !important;
      gap: 1rem !important;
    }
    
    .org-social-card-row {
      gap: 0.85rem !important;
      padding-top: 0.5rem !important;
    }
    
    .org-social-card-icon {
      width: 52px !important;
      height: 52px !important;
      font-size: 1.9rem !important;
    }
    
    .org-social-card-title {
      font-size: 1.3rem !important;
      margin-bottom: 0.6rem !important;
    }
    
    .org-social-card-description {
      font-size: 0.9rem !important;
      margin-bottom: 0.75rem !important;
    }
    
    .org-social-card-button button {
      padding: 0.65rem 1.1rem !important;
      font-size: 0.8rem !important;
    }
    
    .video-gallery-main {
      border-radius: 12px;
    }
    .video-gallery-counter {
      top: 0.75rem;
      right: 0.75rem;
      padding: 0.4rem 0.8rem;
      font-size: 0.75rem;
    }
    .video-gallery-nav-btn {
      width: 40px;
      height: 40px;
      font-size: 1.1rem;
    }
    .video-gallery-nav-btn--prev {
      left: 0.75rem;
    }
    .video-gallery-nav-btn--next {
      right: 0.75rem;
    }
    .video-gallery-thumbnails {
      grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .competition-groups-grid {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
  }
  
  @media (max-width: 430px) {
    .org-container {
      padding: 0.75rem 0.75rem 1.5rem !important;
    }
    .glass-card-container {
      padding: 0.85rem !important;
      border-radius: 14px !important;
      margin-bottom: 1.25rem !important;
    }
    .org-banner h1 {
      font-size: 2.1rem !important;
    }
    .glass-card {
      padding: 1rem !important;
      border-radius: 16px !important;
    }
    .glass-card h3.section-title {
      font-size: 1.25rem !important;
    }
    .org-social-events-header {
      margin-bottom: 1rem !important;
    }
    .org-social-events-header-icon {
      width: 52px !important;
      height: 52px !important;
    }
    .competition-groups-grid {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
  }
`;

// Componente FAQ Accordion Moderno
const FAQAccordion: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{
        borderRadius: borderRadius.xl,
        border: `1px solid ${colors.glass.medium}`,
        overflow: 'hidden',
        transition: transitions.normal
      }}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: spacing[5],
          background: 'transparent',
          border: 'none',
          color: colors.gray[50],
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          textAlign: 'left',
          transition: transitions.normal
        }}
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.primary[500]
          }}
        >
          ▼
        </motion.span>
      </motion.button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: `0 ${spacing[5]} ${spacing[5]} ${spacing[5]}`,
          borderTop: `1px solid ${colors.glass.medium}`,
          background: colors.glass.light
        }}>
          <p style={{
            lineHeight: typography.lineHeight.relaxed,
            opacity: 0.9,
            fontSize: typography.fontSize.base,
            margin: 0,
            color: colors.gray[100],
            fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          }}>
            {answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente Carousel para videos - memoizado y con callbacks
const VideoCarouselComponent = React.memo<{ videos: string[] }>(({ videos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextVideo = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  }, [videos.length]);

  const prevVideo = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  }, [videos.length]);

  const goToVideo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (videos.length === 0) return null;

  const hasMultipleVideos = videos.length > 1;

  return (
    <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="video-gallery-main">
        <VideoPlayerWithPiP
          src={videos[currentIndex]}
          className="video-gallery-video"
          controls
          preload="metadata"
          controlsList="nodownload noplaybackrate"
          aspectRatio="16 / 9"
          aria-label={`Video ${currentIndex + 1} de ${videos.length}`}
        />

        <div className="video-gallery-counter">
          {currentIndex + 1} / {videos.length}
        </div>

        {hasMultipleVideos && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevVideo(); }}
              className="video-gallery-nav-btn video-gallery-nav-btn--prev"
              aria-label="Video anterior"
              disabled={!hasMultipleVideos}
            >
              ‹
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextVideo(); }}
              className="video-gallery-nav-btn video-gallery-nav-btn--next"
              aria-label="Video siguiente"
              disabled={!hasMultipleVideos}
            >
              ›
            </button>
          </>
        )}
      </div>

      {hasMultipleVideos && (
        <div className="video-gallery-thumbnails">
          {videos.map((video, index) => (
            <button
              key={index}
              onClick={() => goToVideo(index)}
              className={`video-gallery-thumb ${index === currentIndex ? 'active' : ''}`}
              aria-label={`Ver video ${index + 1}`}
            >
              <video src={video} muted />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

VideoCarouselComponent.displayName = 'VideoCarouselComponent';

// Componente de Carrusel Moderno - memoizado y con callbacks
const CarouselComponent = React.memo<{ photos: string[] }>(({ photos }) => {
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

  if (photos.length === 0) return null;

  const hasMultiplePhotos = photos.length > 1;

  return (
    <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{
        position: 'relative',
        height: '350px',
        borderRadius: borderRadius['2xl'],
        overflow: 'hidden',
        border: `2px solid ${colors.glass.medium}`,
        background: colors.dark[400],
        boxShadow: colors.shadows.glass
      }}>
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
            alt={`Foto ${currentIndex + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setIsFullscreen(true)}
          />
        </motion.div>

        <div style={{
          position: 'absolute',
          top: spacing[4],
          right: spacing[4],
          background: colors.glass.darker,
          color: colors.gray[50],
          padding: `${spacing[2]} ${spacing[4]}`,
          borderRadius: borderRadius.full,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          backdropFilter: 'blur(10px)'
        }}>
          {currentIndex + 1} / {photos.length}
        </div>

        {hasMultiplePhotos && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevPhoto}
              disabled={!hasMultiplePhotos}
              style={{
                position: 'absolute',
                left: spacing[4],
                top: '50%',
                transform: 'translateY(-50%)',
                background: colors.glass.darker,
                color: colors.light,
                border: 'none',
                borderRadius: borderRadius.full,
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: hasMultiplePhotos ? 'pointer' : 'not-allowed',
                fontSize: typography.fontSize.xl,
                transition: transitions.normal,
                backdropFilter: 'blur(10px)',
                opacity: hasMultiplePhotos ? 1 : 0.5
              }}
            >
              ‹
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextPhoto}
              disabled={!hasMultiplePhotos}
              style={{
                position: 'absolute',
                right: spacing[4],
                top: '50%',
                transform: 'translateY(-50%)',
                background: colors.glass.darker,
                color: colors.light,
                border: 'none',
                borderRadius: borderRadius.full,
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: hasMultiplePhotos ? 'pointer' : 'not-allowed',
                fontSize: typography.fontSize.xl,
                transition: transitions.normal,
                backdropFilter: 'blur(10px)',
                opacity: hasMultiplePhotos ? 1 : 0.5
              }}
            >
              ›
            </motion.button>
          </>
        )}
      </div>

      {hasMultiplePhotos && (
        <div style={{
          display: 'flex',
          gap: spacing[2],
          marginTop: spacing[4],
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {photos.map((photo, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goToPhoto(index)}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: borderRadius.lg,
                overflow: 'hidden',
                border: currentIndex === index
                  ? `3px solid ${colors.primary[500]}`
                  : `2px solid ${colors.glass.medium}`,
                cursor: 'pointer',
                background: 'transparent',
                padding: 0,
                transition: transitions.normal
              }}
            >
              <ImageWithFallback
                src={photo}
                alt={`Miniatura ${index + 1}`}
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
            background: colors.glass.darker,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing[8]
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: borderRadius['2xl'],
            overflow: 'hidden'
          }}>
            <ImageWithFallback
              src={photos[currentIndex]}
              alt={`Foto ${currentIndex + 1} - Pantalla completa`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFullscreen(false)}
              style={{
                position: 'absolute',
                top: spacing[4],
                right: spacing[4],
                background: colors.glass.darker,
                color: colors.light,
                border: 'none',
                borderRadius: borderRadius.full,
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                backdropFilter: 'blur(10px)'
              }}
            >
              ×
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
});

CarouselComponent.displayName = 'CarouselComponent';

export function OrganizerProfileLive() {
  const navigate = useNavigate();
  const { data: org, isLoading, error, isError } = useMyOrganizer();
  const { data: parents } = useEventParentsByOrganizer((org as any)?.id);
  const { data: eventDates } = useEventDatesByOrganizer((org as any)?.id);
  const { media } = useOrganizerMedia();
  const { data: allTags } = useTags();
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (!isLoading && !org && !isError) {
      console.log('[OrganizerProfileLive] No hay perfil y no hay error, redirigiendo a /edit');
      navigate('/profile/organizer/edit', { replace: true });
    }
  }, [isLoading, org, isError, navigate]);

  // Memoizar datos derivados
  const safeMedia = useMemo(() => media || [], [media]);
  
  const carouselPhotos = useMemo(() => {
    return PHOTO_SLOTS
      .map(slot => getMediaBySlot(safeMedia as any, slot)?.url)
      .filter(Boolean) as string[];
  }, [safeMedia]);

  const videos = useMemo(() => {
    return VIDEO_SLOTS
      .map(slot => getMediaBySlot(safeMedia as any, slot)?.url)
      .filter(Boolean) as string[];
  }, [safeMedia]);

  // Agregar agregación de ubicaciones desde los sociales (events_parent)
  const aggregatedLocations = useMemo(() => {
    try {
      const items = (parents || []).flatMap((p: any) => Array.isArray(p?.ubicaciones) ? p.ubicaciones : []);
      const key = (u: any) => `${(u?.nombre || '').trim()}|${(u?.direccion || '').trim()}`;
      const map = new Map<string, any>();
      items.forEach((u: any) => map.set(key(u), u));
      return Array.from(map.values());
    } catch {
      return [];
    }
  }, [parents]);

  // Preparar items de "Fechas" (maneja también eventos recurrentes semanales)
  const inviteItems = useMemo(() => {
    const items: any[] = [];

    const getTodayCDMX = () => {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(new Date());
    };

    const getNowCDMX = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const y = Number(parts.find(p => p.type === 'year')?.value || '0');
      const m = Number(parts.find(p => p.type === 'month')?.value || '1');
      const d = Number(parts.find(p => p.type === 'day')?.value || '1');
      const h = Number(parts.find(p => p.type === 'hour')?.value || '0');
      const min = Number(parts.find(p => p.type === 'minute')?.value || '0');
      return new Date(Date.UTC(y, m - 1, d, h, min, 0));
    };

    const todayCDMX = getTodayCDMX();
    const nowCDMX = getNowCDMX();

    const parseLocalYmd = (value: string) => {
      const plain = String(value).split('T')[0];
      const [y, m, d] = plain.split('-').map((n) => parseInt(n, 10));
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
        const fallback = new Date(value);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
      }
      return new Date(y, m - 1, d);
    };

    // Expandir eventos recurrentes en múltiples ocurrencias (similar a ExploreHome y OrganizerPublicScreen)
    const expandedDates: any[] = [];
    (eventDates as any[] || []).forEach((d: any) => {
      if (d.dia_semana !== null && d.dia_semana !== undefined && typeof d.dia_semana === 'number') {
        try {
          const horaInicioStr = d.hora_inicio || '20:00';

          for (let i = 0; i < 4; i++) {
            const primeraFecha = calculateNextDateWithTime(d.dia_semana, horaInicioStr);
            const fechaOcurrencia = new Date(primeraFecha);
            fechaOcurrencia.setDate(primeraFecha.getDate() + (i * 7));

            const year = fechaOcurrencia.getFullYear();
            const month = String(fechaOcurrencia.getMonth() + 1).padStart(2, '0');
            const day = String(fechaOcurrencia.getDate()).padStart(2, '0');
            const fechaStr = `${year}-${month}-${day}`;

            expandedDates.push({
              ...d,
              fecha: fechaStr,
              _recurrence_index: i,
              _original_id: d.id,
              id: `${d.id}_${i}`,
            });
          }
        } catch (e) {
          console.error('[OrganizerProfileLive] Error calculando ocurrencias para evento recurrente:', e);
          expandedDates.push(d);
        }
      } else {
        expandedDates.push(d);
      }
    });

    const futureDates = expandedDates.filter((d: any) => {
      try {
        // Si es recurrente expandido, ya sabemos que la fecha es futura
        if (d._recurrence_index !== undefined && d.dia_semana !== null && d.dia_semana !== undefined && typeof d.dia_semana === 'number') {
          return true;
        }

        const fechaStr = String(d.fecha).split('T')[0];
        const dateObj = parseLocalYmd(d.fecha);
        if (!dateObj) return false;

        if (fechaStr === todayCDMX) {
          const horaStr = d.hora_inicio as string | null | undefined;
          if (!horaStr) return true;

          const [yy, mm, dd] = fechaStr.split('-').map((p: string) => parseInt(p, 10));
          if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return true;

          const [hhRaw, minRaw] = String(horaStr).split(':');
          const hh = parseInt(hhRaw ?? '0', 10);
          const min = parseInt(minRaw ?? '0', 10);

          const eventDateTime = new Date(Date.UTC(yy, mm - 1, dd, hh, min, 0));
          return eventDateTime.getTime() >= nowCDMX.getTime();
        }

        dateObj.setHours(0, 0, 0, 0);
        const todayObj = parseLocalYmd(todayCDMX);
        if (!todayObj) return false;
        todayObj.setHours(0, 0, 0, 0);
        return dateObj >= todayObj;
      } catch {
        return false;
      }
    });

    // Ordenar por fecha
    futureDates.sort((a: any, b: any) => {
      const fechaA = parseLocalYmd(a.fecha);
      const fechaB = parseLocalYmd(b.fecha);
      if (!fechaA || !fechaB) return 0;
      return fechaA.getTime() - fechaB.getTime();
    });

    futureDates.forEach((date) => {
      const fechaNombre = (date as any).nombre || `Fecha ${fmtDate(date.fecha)}`;

      const horaFormateada = date.hora_inicio && date.hora_fin
        ? `${date.hora_inicio} - ${date.hora_fin}`
        : date.hora_inicio || '';

      items.push({
        id: date._original_id || date.id,
        nombre: fechaNombre,
        date: fmtDate(date.fecha),
        time: horaFormateada,
        place: date.lugar || date.ciudad || '',
        href: `/social/fecha/${date._original_id || date.id}`,
        cover: Array.isArray(date.media) && date.media.length > 0
          ? (date.media[0] as any)?.url || date.media[0]
          : undefined,
        flyer: (date as any).flyer_url
          || (Array.isArray(date.media) && date.media.length > 0
            ? (date.media[0] as any)?.url || date.media[0]
            : undefined),
        price: (() => {
          const costos = (date as any)?.costos;
          if (Array.isArray(costos) && costos.length) {
            const nums = costos.map((c: any) => (typeof c?.precio === 'number' ? c.precio : null)).filter((n: any) => n !== null);
            if (nums.length) {
              const min = Math.min(...(nums as number[]));
              return min >= 0 ? `$${min.toLocaleString()}` : undefined;
            }
          }
          return undefined;
        })(),
        fecha: date.fecha,
        hora_inicio: date.hora_inicio,
        hora_fin: date.hora_fin,
        lugar: date.lugar || date.ciudad || date.direccion,
        biografia: (date as any).biografia,
        dia_semana: (date as any).dia_semana !== null && (date as any).dia_semana !== undefined ? (date as any).dia_semana : null
      });
    });

    return items;
  }, [eventDates]);

  const DateFlyerSlider: React.FC<{ items: any[]; onOpen: (href: string) => void }> = ({ items, onOpen }) => {
    const [idx, setIdx] = React.useState(0);
    if (!items?.length) return null;
    const ev = items[idx % items.length];
    
    const calendarStart = (() => {
      try {
        if (!ev.fecha) return new Date();
        const fechaStr = ev.fecha.includes('T') ? ev.fecha.split('T')[0] : ev.fecha;
        const hora = (ev.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
        const fechaCompleta = `${fechaStr}T${hora}:00`;
        const parsed = new Date(fechaCompleta);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      } catch (err) {
        console.error('[DateFlyerSlider] Error parsing start date:', err);
        return new Date();
      }
    })();

    const calendarEnd = (() => {
      try {
        if (!ev.fecha) {
          const defaultEnd = new Date(calendarStart);
          defaultEnd.setHours(defaultEnd.getHours() + 2);
          return defaultEnd;
        }
        const fechaStr = ev.fecha.includes('T') ? ev.fecha.split('T')[0] : ev.fecha;
        const hora = (ev.hora_fin || ev.hora_inicio || '23:59').split(':').slice(0, 2).join(':');
        const fechaCompleta = `${fechaStr}T${hora}:00`;
        const parsed = new Date(fechaCompleta);
        if (isNaN(parsed.getTime())) {
          const defaultEnd = new Date(calendarStart);
          defaultEnd.setHours(defaultEnd.getHours() + 2);
          return defaultEnd;
        }
        return parsed;
      } catch (err) {
        console.error('[DateFlyerSlider] Error parsing end date:', err);
        const defaultEnd = new Date(calendarStart);
        defaultEnd.setHours(defaultEnd.getHours() + 2);
        return defaultEnd;
      }
    })();

    return (
      <div style={{ display: 'grid', placeItems: 'center', gap: spacing[3] }}>
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="glass-card"
          onClick={() => onOpen(ev.href)}
          style={{ position: 'relative', borderRadius: borderRadius.xl, cursor: 'pointer', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
        >
          <div style={{ width: 350, maxWidth: '80vw' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: 'rgba(0,0,0,0.3)' }}>
              {ev.flyer && (
                <img src={ev.flyer} alt={ev.nombre} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
              )}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing[4], background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.0) 100%)', color: '#fff' }}>
                <div style={{ 
                  fontSize: typography.fontSize.lg, 
                  fontWeight: 700, 
                  marginBottom: spacing[2], 
                  textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6), -1px -1px 0 rgba(0,0,0,0.8), 1px -1px 0 rgba(0,0,0,0.8), -1px 1px 0 rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.8)',
                  color: '#FFFFFF',
                  letterSpacing: '0.02em'
                }}>{ev.nombre}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], fontSize: typography.fontSize.sm, marginBottom: spacing[2] }}>
                  {ev.date && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999, fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>📅 {ev.date}</span>}
                  {ev.time && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999, fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>🕒 {ev.time}</span>}
                  {ev.place && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background:'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999, fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>📍 {ev.place}</span>}
                  {ev.price && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background:'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999, fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>💰 {ev.price}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: spacing[2], position: 'relative', zIndex: 5, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                  <RequireLogin>
                    <AddToCalendarWithStats
                      eventId={ev.id}
                      title={ev.nombre}
                      description={ev.biografia}
                      location={ev.lugar}
                      start={calendarStart}
                      end={calendarEnd}
                      showAsIcon={true}
                    />
                  </RequireLogin>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        {items.length > 1 && (
          <div style={{ width: 350, maxWidth: '80vw', display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" onClick={() => setIdx((p) => (p - 1 + items.length) % items.length)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>‹ Anterior</button>
            <button type="button" onClick={() => setIdx((p) => (p + 1) % items.length)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Siguiente ›</button>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{
          padding: spacing[12],
          textAlign: 'center',
          color: colors.gray[50],
          background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
          <p style={{ fontSize: typography.fontSize.lg }}>Cargando organizador...</p>
        </div>
      </>
    );
  }

  if (isError && error) {
    const errorMessage = (error as any)?.message || 'Error desconocido al cargar el perfil';
    const errorCode = (error as any)?.code;
    
    return (
      <>
        <style>{STYLES}</style>
        <div style={{
          padding: spacing[12],
          textAlign: 'center',
          color: colors.gray[50],
          background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>
            <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⚠️</div>
            <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>
              Error al cargar perfil
            </h2>
            <p style={{ opacity: 0.7, fontSize: typography.fontSize.lg, marginBottom: spacing[6] }}>
              {errorMessage}
              {errorCode && ` (Código: ${errorCode})`}
            </p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              style={{
                padding: `${spacing[3]} ${spacing[6]}`,
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                color: colors.gray[50],
                cursor: 'pointer',
                fontSize: typography.fontSize.base,
                fontWeight: 600,
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!org) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{
          padding: spacing[12],
          textAlign: 'center',
          color: colors.gray[50],
          background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
          <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>
            Estamos cargando tu perfil...
          </h2>
          <p style={{ opacity: 0.7, fontSize: typography.fontSize.lg, marginBottom: spacing[2] }}>
            Redirigiendo a edición para crear tu perfil
          </p>
          <p style={{ opacity: 0.6, fontSize: typography.fontSize.sm }}>
            Si tarda mucho, intenta refrescar la página para una carga más rápida.
          </p>
        </div>
      </>
    );
  }

  // Resolver avatar URL con null checks
  const avatarUrl = (() => {
    const cover = getMediaBySlot(safeMedia as any, 'cover');
    const p1 = getMediaBySlot(safeMedia as any, 'p1');
    return cover?.url || p1?.url || undefined;
  })();

  return (
    <>
      <style>{STYLES}</style>

      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        color: colors.gray[50],
        width: '100%',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '100px',
          height: '100px',
          background: colors.gradients.primary,
          borderRadius: '50%',
          opacity: 0.1,
          animation: 'float 8s ease-in-out infinite',
          zIndex: 0
        }} />

        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '60px',
          height: '60px',
          background: colors.gradients.secondary,
          borderRadius: '50%',
          opacity: 0.15,
          animation: 'float 6s ease-in-out infinite reverse',
          zIndex: 0
        }} />

        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: '80px',
          height: '80px',
          background: colors.gradients.deep,
          borderRadius: '50%',
          opacity: 0.1,
          animation: 'float 7s ease-in-out infinite',
          zIndex: 0
        }} />

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="organizer"
            liveHref="/profile/organizer"
            editHref="/profile/organizer/edit"
          />
        </div>

        <motion.div
          id="organizer-banner"
          data-test-id="organizer-banner"
          className="org-banner glass-card-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: 'relative',
            overflow: 'visible',
            margin: `0 auto`,
            marginTop: 0,
            maxWidth: '900px',
            width: '100%',
            zIndex: 1
          }}
        >
          {/* Botón Volver a inicio */}
          <motion.button
            onClick={() => navigate('/explore')}
            whileHover={{ scale: 1.1, x: -3 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Volver a inicio"
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(255,209,102,0.15))',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240,147,251,0.3), rgba(255,209,102,0.25))';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(240,147,251,0.4), 0 0 0 1px rgba(255,255,255,0.15) inset';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(255,209,102,0.15))';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset';
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#f093fb' }}
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <div className="org-banner-grid">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div
                id="organizer-avatar"
                data-test-id="organizer-avatar"
                className="org-banner-avatar"
                style={{
                  width: '250px',
                  height: '250px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `4px solid ${colors.glass.strong}`,
                  boxShadow: `${colors.shadows.glow}, 0 20px 40px rgba(0, 0, 0, 0.3)`,
                  background: colors.gradients.primary,
                  position: 'relative'
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Logo del organizador"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="org-banner-avatar-fallback" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '6rem',
                    fontWeight: typography.fontWeight.black,
                    color: colors.light
                  }}>
                    {(org as any)?.nombre_publico?.[0]?.toUpperCase() || '🎤'}
                  </div>
                )}

                <div className="shimmer-effect" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '50%'
                }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                {(org as any)?.estado_aprobacion === 'aprobado' && (
                  <div className="badge" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '.45rem',
                    padding: '.35rem .6rem',
                    borderRadius: '999px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #106c37, #0b5)',
                    border: '1px solid #13a65a',
                    boxShadow: '0 8px 18px rgba(0,0,0,.35)',
                    fontSize: '.82rem',
                    color: '#fff'
                  }}>
                    <div className="dot" style={{
                      width: '16px',
                      height: '16px',
                      display: 'grid',
                      placeItems: 'center',
                      background: '#16c784',
                      borderRadius: '50%',
                      color: '#062d1f',
                      fontSize: '.75rem',
                      fontWeight: 900
                    }}>✓</div>
                    <span>Verificado</span>
                  </div>
                )}
                <button
                  aria-label="Compartir perfil"
                  title="Compartir"
                  onClick={() => {
                    try {
                      const publicUrl = (org as any)?.id ? `${window.location.origin}/organizer/${(org as any).id}` : '';
                      const title = (org as any)?.nombre_publico || 'Organizador';
                      const text = `Mira el perfil de ${title}`;
                      const navAny = (navigator as any);
                      if (navAny && typeof navAny.share === 'function') {
                        navAny.share({ title, text, url: publicUrl }).catch(() => {});
                      } else {
                        navigator.clipboard?.writeText(publicUrl).then(() => { 
                          setCopied(true); 
                          setTimeout(() => setCopied(false), 1500); 
                        }).catch(() => {});
                      }
                    } catch {}
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#fff',
                    borderRadius: 999,
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}
                >
                  📤 Compartir
                </button>
                {copied && (
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      padding: '4px 8px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.25)',
                      fontSize: 12,
                      fontWeight: 700,
                      zIndex: 10
                    }}
                  >
                    Copiado
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[6],
                justifyContent: 'center'
              }}
            >
              <h1
                id="organizer-name"
                data-test-id="organizer-name"
                className="gradient-text"
                style={{
                  fontSize: typography.fontSize['5xl'],
                  fontWeight: typography.fontWeight.black,
                  margin: 0,
                  lineHeight: typography.lineHeight.tight,
                  textShadow: `0 4px 20px ${colors.primary[500]}40`
                }}
              >
                {(org as any)?.nombre_publico}
              </h1>

              <div
                id="organizer-chips"
                data-test-id="organizer-chips"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: spacing[2],
                  marginBottom: spacing[2]
                }}
              >
                {(() => {
                  const slugs = normalizeRitmosToSlugs(org, allTags);
                  return slugs.length > 0 ? (
                    <RitmosChips selected={slugs} onChange={() => {}} readOnly size="compact" />
                  ) : null;
                })()}
                <ZonaGroupedChips
                  selectedIds={(org as any)?.zonas || []}
                  allTags={allTags}
                  mode="display"
                  size="compact"
                />
              </div>

            </motion.div>
          </div>
        </motion.div>

        <div className="org-container" style={{
          padding: spacing[8],
          position: 'relative',
          zIndex: 1,
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <BioSection 
              bio={(org as any)?.bio}
              redes={(org as any)?.redes_sociales || (org as any)?.respuestas?.redes}
            />
          </motion.div>

          {aggregatedLocations.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: colors.gradients.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize['2xl'],
                  boxShadow: colors.shadows.glow
                }}>
                  📍
                </div>
                <div>
                  <h3 className="section-title">Ubicaciones</h3>
                  <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0, color: colors.light }}>
                    Lugares donde realizamos nuestros sociales
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gap: spacing[3] }}>
                {aggregatedLocations.map((u: any, idx: number) => (
                  <div key={idx} style={{
                    display: 'grid',
                    gap: 8,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ fontWeight: 700 }}>{u?.nombre || 'Ubicación'}</div>
                    <div style={{ opacity: 0.9 }}>{u?.direccion}</div>
                    {u?.referencias && <div style={{ opacity: 0.75, fontSize: 13 }}>Ref: {u.referencias}</div>}
                    {!!(u?.zonaIds?.length) && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(u.zonaIds as number[]).map((zid) => {
                          const z = allTags?.find((t: any) => t.id === zid && t.tipo === 'zona');
                          return z ? (
                            <span key={zid} style={{ fontSize: 12, fontWeight: 600, color: '#fff', border: '1px solid rgba(25,118,210,0.35)', background: 'rgba(25,118,210,0.16)', padding: '2px 8px', borderRadius: 999 }}>
                              {z.nombre}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Datos de Cuenta Bancaria */}
          {(() => {
            const bankData = (org as any)?.cuenta_bancaria;
            // Verificar que existe y no es solo un objeto vacío
            if (!bankData || typeof bankData !== 'object') return null;
            const hasBankData = bankData.banco || bankData.nombre || bankData.clabe || bankData.cuenta || bankData.concepto;
            if (!hasBankData) return null;
            return <BankAccountDisplay data={bankData} />;
          })()}

          <div
            id="organizer-invited-masters"
            data-test-id="organizer-invited-masters"
          >
            <InvitedMastersSection
              masters={[]}
              title="🎭 Maestros Invitados"
              showTitle={true}
              isEditable={false}
            />
          </div>

          {inviteItems.length > 0 && (
            <motion.section
              id="organizer-upcoming-dates"
              data-test-id="organizer-upcoming-dates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                marginBottom: spacing[6]
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: colors.gradients.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize['2xl'],
                  boxShadow: colors.shadows.glow
                }}>
                  📅
                </div>
                <div>
                  <h3 className="section-title">Próximas Fechas</h3>
                </div>
              </div>
              <DateFlyerSlider items={inviteItems} onOpen={(href: string) => navigate(href)} />
            </motion.section>
          )}

          {videos.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card-container"
              style={{
                marginBottom: '1.5rem',
                padding: '1.25rem',
                position: 'relative',
                overflow: 'visible',
                textAlign: 'left'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, rgba(240, 147, 251, 0.6), rgba(255, 209, 102, 0.6), rgba(240, 147, 251, 0.6))',
                borderRadius: '20px 20px 0 0'
              }} />
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(255, 209, 102, 0.2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    flexShrink: 0
                  }}>
                    🎥
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="section-title" style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.3 }}>
                      Videos
                    </h3>
                    <p style={{
                      margin: '0.15rem 0 0 0',
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 400,
                      lineHeight: 1.2
                    }}>
                      {videos.length === 1 ? 'Video promocional' : 'Contenido multimedia destacado'}
                    </p>
                  </div>
                </div>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  {videos.length} video{videos.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
                <VideoCarouselComponent videos={videos} />
              </div>
            </motion.section>
          )}

          {carouselPhotos.length > 0 && (
            <motion.section
              id="organizer-profile-photo-gallery"
              data-baile-id="organizer-profile-photo-gallery"
              data-test-id="organizer-profile-photo-gallery"
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
                  📷 Galería de Fotos
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

          {((org as any)?.respuestas?.musica_tocaran || (org as any)?.respuestas?.hay_estacionamiento) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                marginBottom: spacing[6]
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: colors.gradients.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize['2xl'],
                  boxShadow: `0 8px 24px ${colors.secondary[500]}40`
                }}>
                  ❓
                </div>
                <div>
                  <h3 className="section-title">❓ Información para Asistentes</h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: colors.light
                  }}>
                    Preguntas frecuentes
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                {(org as any)?.respuestas?.musica_tocaran && (
                  <FAQAccordion
                    question="🎵 ¿Qué música tocarán?"
                    answer={(org as any)?.respuestas?.musica_tocaran}
                  />
                )}

                {(org as any)?.respuestas?.hay_estacionamiento && (
                  <FAQAccordion
                    question="🅿️ ¿Hay estacionamiento?"
                    answer={(org as any)?.respuestas?.hay_estacionamiento}
                  />
                )}
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </>
  );
}
