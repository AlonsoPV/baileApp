import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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
        }
      `}</style>
      <div className="app-shell-root">
        <Navbar onMenuToggle={user ? () => setMenuOpen(true) : undefined} />
        <AppBootstrap>
          <Outlet />
        </AppBootstrap>

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


