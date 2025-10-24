import React from "react";
import { motion } from "framer-motion";
import ImageWithFallback from "../ImageWithFallback";
import { Chip } from "./Chip";

export interface ProfileShellProps {
  // Banner y avatar
  bannerGradient?: string;
  avatar?: string;
  avatarFallback?: string;
  title: string;
  subtitle?: string;
  
  // Chips y estado
  statusChip?: React.ReactNode;
  chips?: Array<{
    label: string;
    active?: boolean;
    variant?: 'ritmo' | 'zona';
    onClick?: () => void;
  }>;
  
  // Acciones
  actions?: React.ReactNode;
  
  // Contenido
  children: React.ReactNode;
  
  // Estilos
  className?: string;
  style?: React.CSSProperties;
}

const defaultBannerGradient = "linear-gradient(135deg, #E53935 0%, #FB8C00 100%)";

export default function ProfileShell({
  bannerGradient = defaultBannerGradient,
  avatar,
  avatarFallback,
  title,
  subtitle,
  statusChip,
  chips = [],
  actions,
  children,
  className,
  style
}: ProfileShellProps) {
  return (
    <>
      <style>{`
        .profile-shell-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .profile-shell-banner {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(229, 57, 53, 0.4);
        }
        .profile-shell-banner-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          padding: 2rem;
          align-items: center;
        }
        .profile-shell-avatar {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          overflow: hidden;
          border: 6px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
          background: linear-gradient(135deg, #1E88E5, #FF7043);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          font-weight: 700;
          color: white;
        }
        .profile-shell-avatar-fallback {
          font-size: 6rem;
        }
        @media (max-width: 768px) {
          .profile-shell-banner-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 1.5rem;
          }
          .profile-shell-banner h1 {
            font-size: 2rem !important;
          }
          .profile-shell-avatar {
            width: 180px !important;
            height: 180px !important;
          }
          .profile-shell-avatar-fallback {
            font-size: 4rem !important;
          }
        }
      `}</style>

      <div className={`profile-shell-container ${className || ''}`} style={style}>
        {/* Banner Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="profile-shell-banner"
          style={{ background: bannerGradient }}
        >
          <div className="profile-shell-banner-grid">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div className="profile-shell-avatar">
                {avatar ? (
                  <ImageWithFallback
                    src={avatar}
                    alt={title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="profile-shell-avatar-fallback" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '6rem',
                    fontWeight: '700',
                    color: 'white'
                  }}>
                    {avatarFallback || title[0]?.toUpperCase() || '🎓'}
                  </div>
                )}
              </div>
            </div>

            <div>
              {statusChip && (
                <div style={{ marginBottom: '1rem' }}>
                  {statusChip}
                </div>
              )}
              <h1 style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: 'white',
                margin: '0 0 0.5rem 0',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{
                  fontSize: '1.25rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: '0 0 1.5rem 0',
                  lineHeight: 1.4
                }}>
                  {subtitle}
                </p>
              )}
              
              {/* Chips */}
              {chips.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  {chips.map((chip, index) => (
                    <Chip
                      key={index}
                      label={chip.label}
                      active={chip.active}
                      variant={chip.variant}
                      onClick={chip.onClick}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        fontWeight: '600'
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Acciones */}
              {actions && (
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  {actions}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Contenido Principal */}
        <div style={{ padding: '2rem 0' }}>
          {children}
        </div>
      </div>
    </>
  );
}
