import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OffCanvasMenu as UIOffCanvasMenu } from '@ui/index';
import { useAuth } from '@/contexts/AuthProvider';
import { useIsAdmin } from '@/hooks/useRoleRequests';
import { routes } from '@/routes/registry';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AppOffCanvasMenu({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: isSuperAdmin } = useIsAdmin();

  const navigateAndClose = React.useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  const handleLogout = React.useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[AppOffCanvasMenu] Error al cerrar sesión:', error);
      }
    } finally {
      navigate(routes.auth.login, { replace: true });
      onClose();
    }
  }, [signOut, navigate, onClose]);

  const menuItems = React.useMemo(
    () =>
      ([
        { id: 'challenges', label: 'Retos', icon: '🏆', onClick: () => navigateAndClose('/challenges') },
        { id: 'trending', label: 'Trending', icon: '📈', onClick: () => navigateAndClose('/trending') },
        { id: 'me', label: 'Mi perfil', icon: '👤', onClick: () => navigateAndClose(routes.app.profile) },
        { id: 'request-role', label: 'Solicitar rol', icon: '📝', onClick: () => navigateAndClose('/app/roles/request') },
        { id: 'validation-info', label: '¿Qué significa los perfiles con ✅?', icon: '✅', onClick: () => navigateAndClose('/validation/info') },
        !!isSuperAdmin && { id: 'admin', label: 'Admin', icon: '🛡️', onClick: () => navigateAndClose('/admin/roles') },
        { id: 'logout', label: 'Cerrar sesión', icon: '🚪', onClick: handleLogout },
      ].filter(Boolean)) as Array<{ id: string; label: string; icon?: string; onClick: () => void }>,
    [isSuperAdmin, navigateAndClose, handleLogout]
  );

  const userName = user?.user_metadata?.name || user?.email || 'Usuario';
  const userEmail = user?.email ?? '';
  const userAvatar = user?.user_metadata?.avatar_url ?? '';
  const displayName = user?.user_metadata?.name ?? userName;

  return (
    <UIOffCanvasMenu
      isOpen={isOpen}
      onClose={onClose}
      menuItems={menuItems}
      userName={userName}
      userEmail={userEmail}
      userAvatar={userAvatar}
      displayName={displayName}
    />
  );
}


