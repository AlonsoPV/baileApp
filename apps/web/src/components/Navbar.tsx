import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { routes } from '@/routes/registry';
import { useIsAdmin } from '../hooks/useRoleRequests';
import { useAuth } from '@/contexts/AuthProvider';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
const APP_LOGO_URL = 'https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/DB_LOGO150.webp';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useDefaultProfile } from '@/hooks/useDefaultProfile';
import { LanguageSwitcher } from './settings/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useRenderLogger } from '@/hooks/useRenderLogger';
import { useProfilePrefetch } from '@/hooks/useProfilePrefetch';

interface NavbarProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function Navbar({ onMenuToggle, isMenuOpen }: NavbarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: isAdmin } = useIsAdmin();
  const { hasUnread, markAllAsRead } = useUnreadNotifications(user?.id);
  const { profile } = useUserProfile();
  const { getDefaultRoute } = useDefaultProfile();
  const { prefetchDefaultProfile } = useProfilePrefetch();
  
  // Performance: Log renders in development
  useRenderLogger('Navbar', { userId: user?.id, hasUnread, isMenuOpen });

  // Prefetch profile data on hover for faster navigation
  const handleAvatarMouseEnter = React.useCallback(() => {
    prefetchDefaultProfile().catch(() => {
      // Silently fail - prefetch is just an optimization
    });
  }, [prefetchDefaultProfile]);

  const profileInitial = React.useMemo(
    () => user?.email?.[0]?.toUpperCase() ?? '👤',
    [user?.email]
  );

  const avatarUrl = React.useMemo(() => profile?.avatar_url, [profile?.avatar_url]);

  const profileAriaLabel = React.useMemo(
    () => hasUnread ? 'Ir a mi perfil — tienes notificaciones nuevas' : 'Ir a mi perfil',
    [hasUnread]
  );

  const handleAvatarClick = React.useCallback(() => {
    // Performance instrumentation: mark start of profile switch
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('profile_switch_click');
    }
    
    const target = getDefaultRoute();
    if (process.env.NODE_ENV === 'development') {
      console.log('[Navbar] Navegando al perfil por defecto desde avatar', { target });
    }
    
    // Track navigation start
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('profile_switch_navigate_start');
    }
    
    navigate(target);
    markAllAsRead().catch(err => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Navbar] Error al marcar notificaciones como leídas:', err);
      }
    });
  }, [getDefaultRoute, navigate, markAllAsRead]);

  return (
    <nav
      className="nav-root"
      role="navigation"
      aria-label="Barra de navegación"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      <style>{`
        .nav-root {
          box-sizing: border-box;
          min-height: 64px;
          height: auto;
          padding-left: 1rem;
          padding-right: 1rem;
          padding-bottom: 0.75rem;
          padding-top: calc(0.75rem + max(env(safe-area-inset-top), 0px));
          display: flex;
          align-items: center;
          justify-content: center;
          background: #297F96;
          border-bottom: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
        }

        .nav-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background: transparent;
          pointer-events: none;
        }

        .nav-inner {
          width: 100%;
          max-width: 1200px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          position: relative;
          z-index: 1;
          min-width: 0;
          overflow: hidden;
        }

        /* Brand truncation + stable layout */
        .nav-center-brand {
          max-width: 640px;
          min-width: 0;
        }

        .nav-center-brand > div {
          min-width: 0;
        }

        .nav-brand-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .nav-brand-tagline {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .nav-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(0, 0, 0, 0.12);
          color: #fff;
          text-decoration: none;
          transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;
          box-shadow: none;
        }

        .nav-icon:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.35);
          transform: translateY(-1px);
          box-shadow: none;
        }

        .nav-icon:active {
          transform: translateY(0px) scale(0.98);
        }

        .nav-icon.active {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.55);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.18);
        }

        .nav-icon:focus-visible,
        .nav-profile-button:focus-visible,
        .nav-login-button:focus-visible,
        .nav-hamburger:focus-visible,
        .nav-center-brand:focus-visible {
          outline: none;
          box-shadow: 0 0 0 4px rgba(255,255,255,0.28);
        }

        .nav-hamburger {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.25);
          background: rgba(0,0,0,0.12);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;
          box-shadow: none;
          padding: 0;
        }

        .nav-hamburger:hover {
          background: rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.35);
          transform: translateY(-1px);
          box-shadow: none;
        }

        .nav-hamburger:active {
          transform: translateY(0px) scale(0.98);
        }

        .nav-hamburger-bars {
          width: 18px;
          height: 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .nav-hamburger-bar {
          height: 2px;
          background: rgba(255,255,255,0.95);
          border-radius: 999px;
          transition: transform 0.16s ease, opacity 0.16s ease, width 0.16s ease;
          width: 100%;
        }

        .nav-hamburger[data-open="true"] .nav-hamburger-bar:nth-child(1) {
          transform: translateY(6px) rotate(45deg);
        }
        .nav-hamburger[data-open="true"] .nav-hamburger-bar:nth-child(2) {
          opacity: 0;
        }
        .nav-hamburger[data-open="true"] .nav-hamburger-bar:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg);
        }

        /* Escritorio: > 1024px */
        @media (min-width: 1025px) {
          .nav-brand-title {
            font-size: 1.5rem !important;
          }
        }

        /* iPad: 768px - 1024px */
        @media (min-width: 768px) and (max-width: 1024px) {
          .nav-root {
            padding-left: 0.9rem !important;
            padding-right: 0.9rem !important;
            padding-bottom: 0.65rem !important;
            padding-top: calc(0.65rem + max(env(safe-area-inset-top), 0px)) !important;
          }
          .nav-center-brand {
            gap: 0.5rem !important;
          }
          .nav-brand-title {
            font-size: 1.15rem !important;
            letter-spacing: 1.3px !important;
          }
          .nav-brand-tagline {
            font-size: 0.75rem !important;
          }
          .nav-logo-img {
            width: 48px !important;
            height: 48px !important;
          }
          .nav-icons { 
            gap: 0.5rem !important;
          }
          .nav-icon { 
            font-size: 1.15rem !important; 
            width: 40px !important;
            height: 40px !important;
          }
          .nav-profile-button {
            width: 42px !important;
            height: 42px !important;
            min-width: 42px !important;
            min-height: 42px !important;
          }
          .nav-login-button {
            padding: 0.45rem 0.9rem !important;
            font-size: 0.88rem !important;
          }
          .nav-hamburger {
            width: 40px !important;
            height: 40px !important;
          }
        }

        @media (max-width: 768px) {
          .nav-inner {
            gap: 0.5rem !important;
            overflow: hidden !important;
          }
          .nav-root {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            padding-bottom: 0.6rem !important;
            padding-top: calc(0.6rem + max(env(safe-area-inset-top), 0px)) !important;
            box-shadow: 0 12px 36px rgba(0,0,0,0.20) !important;
            min-height: 64px !important;
            height: auto !important;
          }
          .nav-left { 
            display: flex !important; 
            flex: 0 0 auto !important;
            min-width: 0 !important;
          }
          .nav-center {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            overflow: hidden !important;
          }
          .nav-center-brand {
            gap: 0.45rem !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }
          .nav-brand-title {
            font-size: 1rem !important;
            letter-spacing: 1.2px !important;
          }
          .nav-brand-tagline {
            display: none !important;
          }
          .nav-icons { 
            gap: .3rem !important; 
            flex: 0 0 auto !important;
            min-width: 0 !important;
            flex-shrink: 0 !important;
          }
          .nav-icon { 
            font-size: 1.1rem !important; 
            width: 38px !important;
            height: 38px !important;
            flex-shrink: 0 !important;
          }
          .nav-logo-img {
            width: 38px !important;
            height: 38px !important;
            flex-shrink: 0 !important;
          }
          .nav-hamburger {
            width: 38px !important;
            height: 38px !important;
            flex-shrink: 0 !important;
          }
        }

        @media (max-width: 480px) {
          .nav-root {
            padding-left: 0.65rem !important;
            padding-right: 0.65rem !important;
            padding-bottom: 0.55rem !important;
            padding-top: calc(0.55rem + max(env(safe-area-inset-top), 0px)) !important;
          }
          .nav-brand-tagline {
            display: none !important;
          }
          .nav-center-brand {
            max-width: 100% !important;
          }
          .nav-icons {
            gap: 0.25rem !important;
          }
        }

        @media (max-width: 430px) {
          .nav-root {
            padding-left: 0.6rem !important;
            padding-right: 0.6rem !important;
            padding-bottom: 0.55rem !important;
            padding-top: calc(0.55rem + max(env(safe-area-inset-top), 0px)) !important;
            min-height: 60px !important;
            height: auto !important;
          }
          .nav-brand-title {
            font-size: 0.9rem !important;
            letter-spacing: 1px !important;
          }
          .nav-logo-img {
            width: 34px !important;
            height: 34px !important;
          }
          .nav-center-brand {
            gap: 0.35rem !important;
            max-width: 100% !important;
          }
          .nav-icon {
            font-size: 1rem !important;
            width: 34px !important;
            height: 34px !important;
          }
          .nav-profile-button {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
          }
          .nav-profile-button img {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            min-width: 100% !important;
            min-height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            box-sizing: border-box !important;
          }
          .nav-login-button {
            padding: 0.35rem 0.7rem !important;
            font-size: 0.75rem !important;
            border-radius: 16px !important;
          }
          .nav-icons {
            gap: 0.25rem !important;
          }
          .nav-hamburger {
            width: 34px !important;
            height: 34px !important;
          }
        }

        @media (max-width: 360px) {
          .nav-center-brand {
            max-width: 100% !important;
          }
          .nav-brand-title {
            font-size: 0.85rem !important;
            letter-spacing: 0.9px !important;
          }
          .nav-icon {
            width: 32px !important;
            height: 32px !important;
          }
          .nav-profile-button {
            width: 34px !important;
            height: 34px !important;
            min-width: 34px !important;
            min-height: 34px !important;
          }
          .nav-hamburger {
            width: 32px !important;
            height: 32px !important;
          }
          .nav-logo-img {
            width: 32px !important;
            height: 32px !important;
          }
        }

        .nav-profile-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.28);
          background: rgba(0,0,0,0.12);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;
          overflow: hidden;
          box-sizing: border-box;
          flex-shrink: 0;
          box-shadow: none;
        }
        
        .nav-profile-button img {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          min-width: 100% !important;
          min-height: 100% !important;
          object-fit: cover !important;
          object-position: center !important;
          display: block !important;
          border-radius: 50% !important;
          box-sizing: border-box !important;
        }

        .nav-profile-button:hover {
          background: rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.38);
          transform: translateY(-1px);
          box-shadow: none;
        }

        .nav-profile-button:active {
          transform: translateY(0px) scale(0.98);
        }

        .nav-profile-button .badge-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #ff3d57;
          box-shadow: 0 0 6px rgba(255,61,87,0.7);
        }

        .nav-login-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.28);
          background: rgba(0,0,0,0.16);
          color: #fff;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;
          text-decoration: none;
          box-shadow: none;
        }

        .nav-login-button:hover {
          background: rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.38);
          transform: translateY(-1px);
          box-shadow: none;
        }

        .nav-login-button:active {
          transform: translateY(0px) scale(0.98);
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .nav-login-button {
            padding: 0.45rem 0.9rem !important;
            font-size: 0.88rem !important;
          }
        }

        @media (max-width: 768px) {
          .nav-login-button {
            padding: 0.4rem 0.8rem;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 430px) {
          .nav-login-button {
            padding: 0.35rem 0.7rem !important;
            font-size: 0.75rem !important;
            border-radius: 16px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nav-root,
          .nav-icon,
          .nav-profile-button,
          .nav-login-button,
          .nav-hamburger {
            transition: none !important;
          }
        }
      `}</style>
      <div className="nav-inner">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '0 0 auto', minWidth: 0 }}>
          {/* Hamburger Button (only when logged in) */}
          {user && onMenuToggle && (
            <button
              type="button"
              className="nav-hamburger"
              data-open={isMenuOpen ? 'true' : 'false'}
              onClick={onMenuToggle}
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMenuOpen ?? false}
              aria-controls="app-drawer"
            >
              <span className="nav-hamburger-bars" aria-hidden="true">
                <span className="nav-hamburger-bar" />
                <span className="nav-hamburger-bar" />
                <span className="nav-hamburger-bar" />
              </span>
            </button>
          )}
        </div>

        {/* Logo + Nombre centrado */}
        <div
          className="nav-center"
          style={{
            flex: '1 1 auto',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <Link
            to="/"
            className="nav-center-brand"
            style={{
              textDecoration: 'none',
              color: '#FFF',
              fontSize: '1.1rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              pointerEvents: 'auto',
            }}
          >
            <img
              src={APP_LOGO_URL}
              alt="Logo Dónde Bailar"
              className="nav-logo-img"
              loading="eager"
              decoding="async"
              style={{
                width: 52,
                height: 52,
                filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.22))',
              }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                lineHeight: 1.05,
              }}
            >
              <span
                className="nav-brand-title"
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: 1.4,
                  fontSize: '1.6rem',
                }}
              >
                Dónde Bailar MX
              </span>
              <span
                className="nav-brand-tagline"
                style={{
                  fontSize: '0.78rem',
                  opacity: 0.92,
                }}
              >
                {t('nav_tagline')}
              </span>
            </div>
          </Link>
        </div>

        {/* Nav Icons */}
        <div className="nav-icons" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', justifyContent: 'flex-end', flex: 1, minWidth: 0 }}>
          {/* Language Switcher */}
          <LanguageSwitcher />

          {user ? (
            <button
              type="button"
              className="nav-profile-button"
              aria-label={profileAriaLabel}
              onClick={handleAvatarClick}
              onMouseEnter={handleAvatarMouseEnter}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              ) : (
                <span>{profileInitial}</span>
              )}
              {hasUnread && <span className="badge-dot" aria-hidden="true" />}
            </button>
          ) : (
            <Link
              to={routes.auth.login}
              className="nav-login-button"
              aria-label={t('login')}
              title={t('login')}
            >
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

