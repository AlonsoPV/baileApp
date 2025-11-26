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
          padding: 1.5rem 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.3);
        }
        .app-footer-content {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .app-footer-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.2s ease;
        }
        .app-footer-link:hover {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: underline;
        }
        @media (max-width: 768px) {
          .app-footer {
            padding: 1rem 0.75rem;
          }
          .app-footer-content {
            gap: 1rem;
          }
          .app-footer-link {
            font-size: 0.8125rem;
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
            <Link to="/aviso-de-privacidad" className="app-footer-link">
              Legal
            </Link>
            <Link to="/app/roles/info" className="app-footer-link">
              Info
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


