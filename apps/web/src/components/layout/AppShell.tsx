import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { FooterNav } from '../FooterNav';
import AppBootstrap from '@/providers/AppBootstrap';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useDefaultProfile } from '@/hooks/useDefaultProfile';
import { OffCanvasMenu } from '@ui/index';
import { useIsAdmin } from '@/hooks/useRoleRequests';

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { getDefaultRoute, getDefaultEditRoute, getDefaultProfileInfo } = useDefaultProfile();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const { data: isSuperAdmin } = useIsAdmin();

  const defaultProfileInfo = getDefaultProfileInfo();

  const menuItems = [
    { id: 'explore', label: 'Explorar', icon: '🔍', onClick: () => navigate('/explore') },
    { id: 'about-us', label: '¿Quiénes somos?', icon: '🏢', onClick: () => navigate('/quienes-somos') },
    { id: 'me', label: 'Mi perfil', icon: '👤', onClick: () => navigate('/app/profile') },
    { id: 'default-profile', label: 'Configurar perfil por defecto', icon: '⚙️', onClick: () => navigate('/app/profile/settings') },
    isSuperAdmin ? { id: 'admin', label: 'Admin', icon: '🛡️', onClick: () => navigate('/admin/roles') } : null,
    { id: 'info', label: 'Info', icon: 'ℹ️', onClick: () => navigate('/about') },
    { id: 'legal', label: 'Legal', icon: '📄', onClick: () => navigate('/legal') },
    { id: 'logout', label: 'Cerrar sesión', icon: '🚪', onClick: async () => { await signOut(); navigate('/auth/login'); } },
  ].filter(Boolean) as Array<{ id: string; label: string; icon?: string; onClick: () => void }>;

  return (
    <>
      <style>{`
        .app-shell-root {
          min-height: 100vh;
          background: #0b0d10;
          color: #e5e7eb;
          padding-bottom: 100px;
        }
        
        @media (max-width: 768px) {
          .app-shell-root {
            padding-bottom: 90px;
          }
        }
        
        @media (max-width: 480px) {
          .app-shell-root {
            padding-bottom: 80px;
          }
        }
      `}</style>
      <div className="app-shell-root">
        <Navbar onMenuToggle={user ? () => setMenuOpen(true) : undefined} />
        <AppBootstrap>
          <Outlet />
        </AppBootstrap>

        {/* Footer Navigation (always visible) */}
        <FooterNav />

        {user && (
          <OffCanvasMenu
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            menuItems={menuItems}
            userName={user.email?.split('@')[0] || 'Usuario'}
            userEmail={user.email || ''}
            userAvatar={profile?.avatar_url || undefined}
            displayName={profile?.display_name || undefined}
          />
        )}
      </div>
    </>
  );
}


