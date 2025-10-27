import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { ToastProvider } from '../Toast';
import AppBootstrap from '@/providers/AppBootstrap';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useDefaultProfile } from '@/hooks/useDefaultProfile';
import { OffCanvasMenu } from '@ui/index';

export default function AppShell() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { getDefaultRoute, getDefaultEditRoute, getDefaultProfileInfo } = useDefaultProfile();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const defaultProfileInfo = getDefaultProfileInfo();

  const menuItems = [
    { id: 'explore', label: 'Explorar', icon: '🔍', onClick: () => navigate('/explore') },
    { id: 'profile', label: `Mi Perfil (${defaultProfileInfo?.name || 'Usuario'})`, icon: defaultProfileInfo?.icon || '👤', onClick: () => navigate(getDefaultRoute()) },
    { id: 'edit-profile', label: `Editar Perfil (${defaultProfileInfo?.name || 'Usuario'})`, icon: '✏️', onClick: () => navigate(getDefaultEditRoute()) },
    { id: 'profile-settings', label: 'Configurar Perfil por Defecto', icon: '⚙️', onClick: () => navigate('/profile/settings') },
    { id: 'info', label: 'Info', icon: 'ℹ️', onClick: () => navigate('/info') },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d10', color: '#e5e7eb' }}>
      <Navbar onMenuToggle={user ? () => setMenuOpen(true) : undefined} />
      <ToastProvider>
        <AppBootstrap>
          <Outlet />
        </AppBootstrap>
      </ToastProvider>

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
  );
}


