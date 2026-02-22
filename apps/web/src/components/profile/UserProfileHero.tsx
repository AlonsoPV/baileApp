import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ImageWithFallback from "../ImageWithFallback";
import RitmosChips from "../RitmosChips";
import ZonaGroupedChips from "./ZonaGroupedChips";
import { BioSection } from "./BioSection";
import { colors } from "../../theme/colors";

type TagLike = { id: number; nombre?: string; slug?: string; tipo?: string };

export interface UserProfileHeroFollowState {
  followers: number;
  following: number;
  isFollowing: boolean;
  loading: boolean;
}

export interface UserProfileHeroProps {
  user: {
    display_name?: string;
    bio?: string;
    redes_sociales?: import("./BioSection").BioSectionRedes | null;
    zonas?: Array<number | null | undefined> | null;
    [key: string]: unknown;
  };
  avatarUrl?: string;
  allTags?: TagLike[] | null;
  ritmosSlugs: string[];
  isOwnProfile: boolean;
  showFollowButton: boolean;
  followState: UserProfileHeroFollowState;
  onFollowToggle: () => void | Promise<void>;
  onShare: () => void | Promise<void>;
  copied?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  avatarError?: boolean;
  onAvatarError?: () => void;
}

const BIO_TRUNCATE_LENGTH = 120;

export const UserProfileHero: React.FC<UserProfileHeroProps> = ({
  user,
  avatarUrl,
  allTags,
  ritmosSlugs,
  isOwnProfile,
  showFollowButton,
  followState,
  onFollowToggle,
  onShare,
  copied = false,
  onBack,
  showBackButton = true,
  avatarError = false,
  onAvatarError,
}) => {
  const { t } = useTranslation();
  const [bioExpanded, setBioExpanded] = useState(false);
  const bio = user?.bio || "";
  const displayName = user?.display_name || t("user");
  const needsBioExpand = bio.length > BIO_TRUNCATE_LENGTH;
  const bioDisplay = needsBioExpand && !bioExpanded
    ? `${bio.slice(0, BIO_TRUNCATE_LENGTH).trim()}...`
    : bio;

  const redes = user?.redes_sociales || (user?.respuestas as { redes?: BioSection["props"]["redes"] })?.redes;

  return (
    <>
      <style>{`
        .user-profile-hero {
          position: relative;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 20px;
          background: linear-gradient(
            165deg,
            rgba(8, 8, 14, 0.98) 0%,
            rgba(14, 12, 22, 0.97) 35%,
            rgba(10, 8, 16, 0.98) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .user-profile-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(125deg, rgba(255,255,255,0.06) 0%, transparent 25%, transparent 60%),
            linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 30%),
            linear-gradient(165deg, rgba(255,255,255,0.04) 0%, transparent 40%);
          pointer-events: none;
        }
        .user-profile-hero::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          width: 45%;
          height: 50%;
          background: radial-gradient(
            ellipse 80% 80% at 90% 100%,
            rgba(255, 255, 255, 0.03) 0%,
            transparent 60%
          );
          pointer-events: none;
        }
        .user-profile-hero-inner {
          position: relative;
          z-index: 1;
          padding: 2rem;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 2rem;
          align-items: start;
          text-align: left;
        }
        .user-profile-hero-avatar-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }
        .user-profile-hero-avatar {
          width: 200px;
          height: 200px;
          min-width: 200px;
          min-height: 200px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid rgba(255, 255, 255, 0.12);
          box-shadow:
            0 16px 48px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.06) inset;
          background: colors.gradients.primary;
        }
        .user-profile-hero-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-width: 0;
        }
        .user-profile-hero-name {
          margin: 0;
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px;
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .user-profile-hero-metrics {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.85);
        }
        .user-profile-hero-metric-chip {
          display: inline-flex;
          align-items: baseline;
          gap: 0.35rem;
        }
        .user-profile-hero-metric-chip strong {
          font-weight: 700;
          color: #fff;
        }
        .user-profile-hero-chips {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          align-items: flex-start;
        }
        .user-profile-hero-bio {
          width: 100%;
          font-size: 0.95rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
          text-align: left;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .user-profile-hero-bio-expand {
          background: none;
          border: none;
          color: #E53935;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 0.25rem;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .user-profile-hero-bio-expand:hover {
          color: #FF6B6B;
        }
        .user-profile-hero-top-actions {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 12;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .user-profile-hero-share-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(50, 50, 58, 0.8);
          color: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1.1rem;
        }
        .user-profile-hero-share-btn:hover {
          background: rgba(70, 70, 80, 0.9);
          border-color: rgba(255, 255, 255, 0.25);
        }
        .user-profile-hero-follow-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          border: none;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #fff;
        }
        .user-profile-hero-follow-btn:not([data-following="true"]) {
          background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
        }
        .user-profile-hero-follow-btn[data-following="true"] {
          background: rgba(34, 197, 94, 0.35);
        }
        .user-profile-hero-follow-btn:disabled {
          opacity: 0.7;
          cursor: progress;
        }
        .user-profile-hero-back-btn {
          position: absolute;
          top: 1rem;
          left: 1rem;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, rgba(240,147,251,0.2), rgba(255,209,102,0.15));
          cursor: pointer;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .user-profile-hero-back-btn:hover {
          background: linear-gradient(135deg, rgba(240,147,251,0.3), rgba(255,209,102,0.25));
          box-shadow: 0 6px 20px rgba(240,147,251,0.4);
        }
        @media (max-width: 768px) {
          .user-profile-hero {
            border-radius: 0;
            margin: 0;
          }
          .user-profile-hero-inner {
            grid-template-columns: 1fr;
            padding: 1.5rem 1rem;
            gap: 1.25rem;
            text-align: center;
          }
          .user-profile-hero-avatar-wrap {
            justify-content: center;
          }
          .user-profile-hero-content {
            align-items: center;
            text-align: center;
          }
          .user-profile-hero-avatar {
            width: 160px;
            height: 160px;
            min-width: 160px;
            min-height: 160px;
          }
          .user-profile-hero-name {
            font-size: 1.85rem;
          }
          .user-profile-hero-metrics {
            justify-content: center;
          }
          .user-profile-hero-chips {
            align-items: center;
          }
          .user-profile-hero-bio {
            text-align: center;
          }
        }
        @media (max-width: 480px) {
          .user-profile-hero-avatar {
            width: 140px;
            height: 140px;
            min-width: 140px;
            min-height: 140px;
          }
          .user-profile-hero-name {
            font-size: 1.55rem;
          }
          .user-profile-hero-top-actions {
            top: 0.75rem;
            right: 0.75rem;
          }
        }
      `}</style>

      <div
        id="user-profile-hero"
        data-baile-id="user-profile-hero"
        data-test-id="user-profile-hero"
        className="user-profile-hero"
      >
        {showBackButton && onBack && (
          <motion.button
            className="user-profile-hero-back-btn"
            onClick={onBack}
            whileHover={{ scale: 1.1, x: -3 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t("back_to_start")}
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
              style={{ color: "#f093fb" }}
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </motion.button>
        )}

        {/* Share + Follow en esquina superior derecha */}
        <div className="user-profile-hero-top-actions">
          <motion.button
            type="button"
            className="user-profile-hero-share-btn"
            onClick={onShare}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t("share_profile")}
            title={t("share")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </motion.button>
          {showFollowButton && (
            <motion.button
              type="button"
              className="user-profile-hero-follow-btn"
              data-following={followState.isFollowing ? "true" : "false"}
              onClick={onFollowToggle}
              disabled={followState.loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              {followState.isFollowing ? t("following") : t("follow")}
            </motion.button>
          )}
        </div>

        {copied && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              zIndex: 10,
              padding: "6px 12px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            {t("copied")}
          </motion.div>
        )}

        <div className="user-profile-hero-inner">
          {/* Avatar grande circular (izquierda) */}
          <div className="user-profile-hero-avatar-wrap">
            <div
              id="user-profile-banner-avatar"
              data-baile-id="user-profile-banner-avatar"
              data-test-id="user-profile-banner-avatar"
              className="user-profile-hero-avatar"
            >
              {avatarUrl && !avatarError ? (
                <ImageWithFallback
                  src={avatarUrl}
                  alt={t("avatar")}
                  onError={onAvatarError}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "5rem",
                    fontWeight: 700,
                    color: "white",
                  }}
                >
                  {displayName[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
          </div>

          {/* Contenido (derecha): nombre, métricas, chips, bio, redes */}
          <div className="user-profile-hero-content">
            <h1
              id="user-profile-display-name"
              data-baile-id="user-profile-display-name"
              data-test-id="user-profile-display-name"
              className="user-profile-hero-name"
            >
              {displayName}
            </h1>

            {/* Seguidores / Siguiendo: "1405 Seguidores  289 Siguiendo" */}
            <div className="user-profile-hero-metrics">
              <div className="user-profile-hero-metric-chip">
                <strong>{followState.followers.toLocaleString("es-MX")}</strong>
                <span>{t("followers")}</span>
              </div>
              <div className="user-profile-hero-metric-chip">
                <strong>{followState.following.toLocaleString("es-MX")}</strong>
                <span>{t("following")}</span>
              </div>
            </div>

            {/* Chips Ritmos + Zonas */}
            <div className="user-profile-hero-chips">
              {ritmosSlugs.length > 0 && (
                <RitmosChips selected={ritmosSlugs} onChange={() => {}} readOnly size="compact" />
              )}
              <ZonaGroupedChips
                selectedIds={user?.zonas}
                allTags={allTags}
                mode="display"
                icon="📍"
                size="compact"
              />
            </div>

            {/* Bio + Ver más + redes sociales */}
            {(bio || redes) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
                {bio && (
                  <div>
                    <p className="user-profile-hero-bio">{bioDisplay}</p>
                    {needsBioExpand && (
                      <button
                        type="button"
                        className="user-profile-hero-bio-expand"
                        onClick={() => setBioExpanded(!bioExpanded)}
                      >
                        {bioExpanded ? t("see_less") || "Ver menos" : t("see_more") || "Ver más"}
                      </button>
                    )}
                  </div>
                )}
                <BioSection bio={undefined} redes={redes} variant="hero" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
