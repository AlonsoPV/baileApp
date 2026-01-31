import React from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../Navbar';
import AppBootstrap from '@/providers/AppBootstrap';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserMedia } from '@/hooks/useUserMedia';
import { useDefaultProfile } from '@/hooks/useDefaultProfile';
import { OffCanvasMenu } from '@ui/index';
import { useIsAdmin } from '@/hooks/useRoleRequests';
import { getMediaBySlot } from '@/utils/mediaSlots';
import SeoHead from '@/components/SeoHead';
import JoinCommunityForm from '@/components/forms/JoinCommunityForm';

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { media } = useUserMedia();
  const { getDefaultRoute, getDefaultEditRoute, getDefaultProfileInfo } = useDefaultProfile();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: isSuperAdmin } = useIsAdmin();
  const { t } = useTranslation();

  const defaultProfileInfo = getDefaultProfileInfo();

  // Obtener avatar con la misma lógica que UserProfileLive (priorizar p1)
  const avatarUrl = (() => {
    const safeMedia = media || [];
    const p1 = getMediaBySlot(safeMedia as any, 'p1');
    if (p1?.url) return p1.url;
    if (profile?.avatar_url) return profile.avatar_url;
    return undefined;
  })();

  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = React.useCallback(async () => {
    // ✅ Prevenir múltiples clicks
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setMenuOpen(false);
      
      // ✅ Cerrar sesión (actualiza el estado inmediatamente)
      await signOut();
      
      // ✅ Navegar inmediatamente a login
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('[AppShell] Error al cerrar sesión:', error);
      // ✅ Aún así navegar a login
      navigate('/auth/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }, [signOut, navigate, isLoggingOut]);

  const menuItems = [
    { id: 'challenges', label: 'Retos', icon: '🏆', onClick: () => navigate('/challenges') },
    { id: 'trending', label: 'Trending', icon: '📈', onClick: () => navigate('/trending') },
    { id: 'roles-info', label: '¿Quieres saber más sobre nuestros roles?', icon: '🎭', onClick: () => navigate('/app/roles/info') },
    { id: 'validation-info', label: '¿Qué significa los perfiles con ✅?', icon: '✅', onClick: () => navigate('/validation/info') },
    { id: 'support', label: 'Soporte', icon: '🛟', onClick: () => navigate('/soporte') },
    { id: 'legal', label: 'Aviso de Privacidad', icon: '🔒', onClick: () => navigate('/aviso-de-privacidad') },
    isSuperAdmin ? { id: 'admin', label: 'Admin', icon: '🛡️', onClick: () => navigate('/admin/roles') } : null,
    { id: 'logout', label: 'Cerrar sesión', icon: '🚪', onClick: handleLogout },
  ].filter(Boolean) as Array<{ id: string; label: string; icon?: string; onClick: () => void }>;

  return (
    <>
      <SeoHead section="default" />
      <style>{`
        .app-shell-root {
          min-height: 100vh;
          background: #0b0d10;
          color: #e5e7eb;
          display: flex;
          flex-direction: column;
          /* Safe areas support */
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          /* Asegurar que no haya overflow que cause problemas de stacking */
          overflow-x: hidden;
        }
        .app-shell-content {
          flex: 1;
          min-height: 0; /* Permite que el flex item encoja y muestre scroll */
          /* Espacio mínimo bajo el header fijo (sin duplicar safe-area) */
          padding-top: 4.5rem;
          padding-bottom: 0.5rem;
          padding-left: 1rem;
          padding-right: 1rem;
          min-height: calc(100vh - 200px);
          /* Asegurar padding-bottom suficiente para que el footer no tape contenido */
          padding-bottom: calc(2rem);
          /* Optimizaciones de scroll vertical */
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          /* Nota: NO aplicar transform/contain aquí; rompe overlays fixed en iOS/WebView */
        }
        @media (min-width: 769px) {
          .app-shell-content {
            overflow-y: auto; /* En escritorio: scroll vertical dentro del contenido */
            max-height: calc(100vh - 4.5rem); /* Altura máxima para que el scroll sea visible */
          }
        }
        @media (max-width: 768px) {
          .app-shell-content {
            padding-top: calc(64px + max(env(safe-area-inset-top), 0px) + 0px);
            padding-bottom: 0.25rem;
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            min-height: calc(100vh - 180px);
          }
        }
        @media (max-width: 480px) {
          .app-shell-content {
            padding-top: calc(60px + max(env(safe-area-inset-top), 0px) + 0px);
            padding-bottom: .25rem;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            min-height: calc(100vh - 160px);
          }
        }
        @media (max-width: 430px) {
          .app-shell-content {
            padding-bottom: calc(1.5rem) !important;
          }
        }
        .app-footer {
          margin-top: auto;
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(180deg, rgba(11, 13, 16, 0.95) 0%, rgba(8, 10, 14, 0.98) 100%);
          backdrop-filter: blur(20px);
          /* Footer fijo en la parte inferior, siempre visible */
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          /* Safe area bottom support */
          padding-bottom: calc(2rem + env(safe-area-inset-bottom));
          /* Asegurar que el footer esté por encima del contenido pero debajo de modales */
          z-index: 10;
        }
        /* Estilos para escritorio: footer más compacto */
        @media (min-width: 769px) {
          .app-footer {
            padding: 0.75rem 1.5rem;
            padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
          }
          .app-footer-content {
            gap: 1.5rem;
          }
          .app-footer-link {
            font-size: 0.8125rem;
            padding: 0.4rem 0.85rem;
          }
          .footer-separator {
            height: 20px;
          }
          .join-cta-button {
            display: none;
          }
        }
        @media (max-width: 768px) {
          .app-footer {
            padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
          }
        }
        @media (max-width: 480px) {
          .app-footer {
            padding-bottom: calc(0.25rem + env(safe-area-inset-bottom));
          }
        }
        .app-footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(229, 57, 53, 0.3) 20%, 
            rgba(251, 140, 0, 0.3) 50%, 
            rgba(229, 57, 53, 0.3) 80%, 
            transparent 100%);
        }
        .app-footer-content {
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          flex-wrap: nowrap;
          position: relative;
          z-index: 1;
          padding: 0;
        }
        
        .app-footer-content > * {
          flex-shrink: 0;
        }
        .app-footer-link {
          color: rgba(255, 255, 255, 0.65);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }
        
        .footer-link-text {
          display: inline;
        }
        .app-footer-link::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(229, 57, 53, 0.1), rgba(251, 140, 0, 0.1));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .app-footer-link:hover {
          color: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
          text-decoration: none;
        }
        .app-footer-link:hover::before {
          opacity: 1;
        }
        .footer-separator {
          width: 1px;
          height: 24px;
          background: linear-gradient(180deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.2) 50%, 
            transparent 100%);
          opacity: 0.3;
        }
        .join-cta-button {
          display: none !important;
        }
        @media (max-width: 768px) {
          .app-footer {
            padding: 1rem 0.75rem;
          }
          .app-footer-content {
            gap: 0.75rem;
            flex-wrap: nowrap;
            justify-content: center;
            padding: 0;
          }
          .app-footer-link {
            font-size: 0.75rem;
            padding: 0.4rem 0.7rem;
            white-space: nowrap;
          }
          .app-footer-link span:last-child {
            display: inline;
          }
          .footer-separator {
            height: 18px;
            flex-shrink: 0;
          }
          .join-cta-button {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .app-footer {
            padding: 0.875rem 0.5rem;
          }
          .app-footer-content {
            gap: 0.5rem;
            padding: 0;
          }
          .app-footer-link {
            font-size: 0.7rem;
            padding: 0.35rem 0.6rem;
            white-space: nowrap;
          }
          .app-footer-link span:last-child {
            display: inline;
          }
          .footer-separator {
            height: 16px;
            opacity: 0.2;
            flex-shrink: 0;
            width: 1px;
          }
          .join-cta-button {
            display: none;
          }
        }

        @media (max-width: 430px) {
          .app-footer {
            padding: 0.75rem 0.4rem !important;
            padding-bottom: calc(0.75rem + env(safe-area-inset-bottom)) !important;
          }
          .app-footer-content {
            gap: 0.35rem !important;
            flex-wrap: nowrap !important;
            justify-content: center !important;
            width: 100% !important;
            padding: 0 !important;
          }
          .app-footer-content > * {
            flex: 0 1 auto;
            min-width: 0;
            max-width: 100%;
          }
          .app-footer-link {
            font-size: 0.65rem !important;
            padding: 0.3rem 0.5rem !important;
            border-radius: 6px !important;
            text-align: center !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .app-footer-link span:first-child {
            font-size: 0.7rem !important;
            flex-shrink: 0;
          }
          .app-footer-link .footer-link-text {
            display: inline !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 120px;
          }
          .footer-separator {
            height: 14px !important;
            opacity: 0.15 !important;
            flex-shrink: 0 !important;
            width: 1px !important;
          }
          .join-cta-button {
            display: none !important;
          }
        }
        
        @media (max-width: 360px) {
          .app-footer {
            padding: 0.65rem 0.3rem !important;
            padding-bottom: calc(0.65rem + env(safe-area-inset-bottom)) !important;
          }
          .app-footer-content {
            gap: 0.25rem !important;
            padding: 0 !important;
          }
          .app-footer-link {
            font-size: 0.6rem !important;
            padding: 0.3rem 0.4rem !important;
          }
          .app-footer-link .footer-link-text {
            max-width: 100px !important;
          }
          .join-cta-button {
            display: none !important;
          }
        }
      `}</style>
      <div className="app-shell-root">
        <Navbar onMenuToggle={user ? () => setMenuOpen(true) : undefined} isMenuOpen={menuOpen} />
        <div className="app-shell-content">
          <AppBootstrap>
            <Outlet />
          </AppBootstrap>
        </div>

        <footer className="app-footer">
          <div className="app-footer-content">
            <JoinCommunityForm />
            <div className="footer-separator" />
            <Link to="/soporte" className="app-footer-link">
              <span>🛟</span>
              <span className="footer-link-text">Soporte</span>
            </Link>
            <div className="footer-separator" />
            <Link to="/aviso-de-privacidad" className="app-footer-link">
              <span>🔒</span>
              <span>{t('legal')}</span>
            </Link>
            <div className="footer-separator" />
            <Link to="/app/roles/info" className="app-footer-link">
              <span>🎭</span>
              <span className="footer-link-text">{t('roles_in_community_short')}</span>
            </Link>
          </div>
        </footer>

        {user && (
          <OffCanvasMenu
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            menuItems={menuItems}
            userName={user.email?.split('@')[0] || 'Usuario'}
            userEmail={user.email || ''}
            userAvatar={avatarUrl}
            displayName={profile?.display_name || undefined}
          />
        )}
      </div>
    </>
  );
}


