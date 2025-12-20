import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OffCanvasMenu as UIOffCanvasMenu } from '@ui/index';
import { useAuth } from '@/contexts/AuthProvider';
import { useIsAdmin } from '@/hooks/useRoleRequests';
import { routes } from '@/routes/registry';
import { useTranslation } from 'react-i18next';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AppOffCanvasMenu({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: isSuperAdmin } = useIsAdmin();
  const { t, i18n } = useTranslation();

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
        { id: 'home', label: t('home'), icon: '🏠', onClick: () => navigateAndClose('/explore') },
        { id: 'challenges', label: t('challenges'), icon: '🏆', onClick: () => navigateAndClose('/challenges') },
        { id: 'trending', label: t('trending'), icon: '📈', onClick: () => navigateAndClose('/trending') },
        { id: 'me', label: t('my_profile'), icon: '👤', onClick: () => navigateAndClose(routes.app.profile) },
        { id: 'request-role', label: t('request_role'), icon: '📝', onClick: () => navigateAndClose('/app/roles/request') },
        { id: 'validation-info', label: t('validation_info'), icon: '✅', onClick: () => navigateAndClose('/validation/info') },
        !!isSuperAdmin && { id: 'admin', label: t('admin'), icon: '🛡️', onClick: () => navigateAndClose('/admin/roles') },
        { id: 'logout', label: t('logout'), icon: '🚪', onClick: handleLogout },
      ].filter(Boolean)) as Array<{ id: string; label: string; icon?: string; onClick: () => void }>,
    [isSuperAdmin, navigateAndClose, handleLogout, t, i18n.language]
  );

  const userName = user?.user_metadata?.name || user?.email || t('user');
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


