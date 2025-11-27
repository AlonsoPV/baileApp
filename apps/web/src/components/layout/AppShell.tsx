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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
      setMenuOpen(false);
    } catch (error) {
      console.error('[AppShell] Error al cerrar sesión:', error);
    }
  };

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
        }
        .app-shell-content {
          flex: 1;
        }
        .app-footer {
          margin-top: auto;
          padding: 1.25rem 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.2);
        }
        .app-footer-content {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: nowrap;
        }
        .app-footer-link {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          font-size: 0.8125rem;
          transition: color 0.2s ease;
        }
        .app-footer-link:hover {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
        }
        @media (max-width: 768px) {
          .app-footer {
            padding: 1rem 0.75rem;
          }
          .app-footer-content {
            gap: 0.75rem;
            flex-wrap: nowrap;
            justify-content: center;
          }
          .app-footer-link {
            font-size: 0.75rem;
            white-space: nowrap;
          }
          .join-cta-button {
            font-size: 0.75rem;
            padding: 0.5rem 1rem;
            white-space: nowrap;
          }
        }
        @media (max-width: 480px) {
          .app-footer-content {
            gap: 0.5rem;
          }
          .app-footer-link {
            font-size: 0.6875rem;
          }
          .join-cta-button {
            font-size: 0.6875rem;
            padding: 0.5rem 0.75rem;
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
            <Link to="/aviso-de-privacidad" className="app-footer-link">
              Legal
            </Link>
            <Link to="/app/roles/info" className="app-footer-link">
              Roles en la comunidad
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


