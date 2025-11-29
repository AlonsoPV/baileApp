import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
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
  const { data: isSuperAdmin } = useIsAdmin();

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
      
      // ✅ Navegar inmediatamente
      navigate('/', { replace: true });
    } catch (error) {
      console.error('[AppShell] Error al cerrar sesión:', error);
      // ✅ Aún así navegar
      navigate('/', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }, [signOut, navigate, isLoggingOut]);

  const menuItems = [
    { id: 'challenges', label: 'Retos', icon: '🏆', onClick: () => navigate('/challenges') },
    { id: 'trending', label: 'Trending', icon: '📈', onClick: () => navigate('/trending') },
    { id: 'roles-info', label: '¿Quieres saber más sobre nuestros roles?', icon: '🎭', onClick: () => navigate('/app/roles/info') },
    { id: 'validation-info', label: '¿Qué significa los perfiles con ✅?', icon: '✅', onClick: () => navigate('/validation/info') },
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
          /* Dejar espacio mínimo para el header fijo */
          padding-top: calc(3.25rem + env(safe-area-inset-top));
          padding-bottom: 2rem;
          padding-left: 1rem;
          padding-right: 1rem;
          min-height: calc(100vh - 200px);
          /* Asegurar padding-bottom suficiente para que el footer no tape contenido */
          padding-bottom: calc(2rem + 120px);
        }
        @media (max-width: 768px) {
          .app-shell-content {
            padding-top: calc(3.1rem + env(safe-area-inset-top));
            padding-bottom: calc(1.75rem + 100px);
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            min-height: calc(100vh - 180px);
          }
        }
        @media (max-width: 480px) {
          .app-shell-content {
            padding-top: calc(3rem + env(safe-area-inset-top));
            padding-bottom: calc(1.5rem + 90px);
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            min-height: calc(100vh - 160px);
          }
        }
        @media (max-width: 430px) {
          .app-shell-content {
            padding-bottom: calc(1.5rem + 80px) !important;
          }
        }
        .app-footer {
          margin-top: auto;
          padding: 2rem 1.5rem;
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
        @media (max-width: 768px) {
          .app-footer {
            padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
          }
        }
        @media (max-width: 480px) {
          .app-footer {
            padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));
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
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          flex-wrap: nowrap;
          position: relative;
          z-index: 1;
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
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
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
        @media (max-width: 768px) {
          .app-footer {
            padding: 1.5rem 1rem;
          }
          .app-footer-content {
            gap: 1rem;
            flex-wrap: nowrap;
            justify-content: center;
          }
          .app-footer-link {
            font-size: 0.8125rem;
            padding: 0.45rem 0.85rem;
          }
          .footer-separator {
            height: 20px;
          }
          .join-cta-button {
            font-size: 0.8125rem;
            padding: 0.55rem 1.1rem;
            white-space: nowrap;
          }
        }
        @media (max-width: 480px) {
          .app-footer {
            padding: 1.25rem 0.75rem;
          }
          .app-footer-content {
            gap: 0.75rem;
          }
          .app-footer-link {
            font-size: 0.75rem;
            padding: 0.4rem 0.7rem;
          }
          .footer-separator {
            height: 18px;
            opacity: 0.2;
          }
          .join-cta-button {
            font-size: 0.75rem;
            padding: 0.5rem 0.9rem;
          }
        }

        @media (max-width: 430px) {
          .app-footer {
            padding: 1rem 0.5rem !important;
            padding-bottom: calc(1rem + env(safe-area-inset-bottom)) !important;
          }
          .app-footer-content {
            gap: 0.5rem !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
          .app-footer-link {
            font-size: 0.7rem !important;
            padding: 0.35rem 0.6rem !important;
            border-radius: 6px !important;
          }
          .app-footer-link span:first-child {
            font-size: 0.75rem !important;
          }
          .footer-separator {
            height: 16px !important;
            opacity: 0.15 !important;
          }
          .join-cta-button {
            font-size: 0.7rem !important;
            padding: 0.45rem 0.8rem !important;
            border-radius: 16px !important;
          }
          .join-cta-button span {
            font-size: 0.7rem !important;
          }
        }
      `}</style>
      <div className="app-shell-root">
        <Navbar onMenuToggle={user ? () => setMenuOpen(true) : undefined} />
        <div className="app-shell-content">
          <AppBootstrap>
            <Outlet />
          </AppBootstrap>
        </div>

        <footer className="app-footer">
          <div className="app-footer-content">
            <JoinCommunityForm />
            <div className="footer-separator" />
            <Link to="/aviso-de-privacidad" className="app-footer-link">
              <span>🔒</span>
              <span>Legal</span>
            </Link>
            <div className="footer-separator" />
            <Link to="/app/roles/info" className="app-footer-link">
              <span>🎭</span>
              <span>Roles en la comunidad</span>
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


