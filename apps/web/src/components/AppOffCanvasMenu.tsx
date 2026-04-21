import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OffCanvasMenu as UIOffCanvasMenu, type OffCanvasMenuSection } from '@ui/index';
import { useAuth } from '@/contexts/AuthProvider';
import { useIsAdmin } from '@/hooks/useRoleRequests';
import { routes } from '@/routes/registry';
import { useTranslation } from 'react-i18next';
import { SEO_LOGO_URL } from '@/lib/seoConfig';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AppOffCanvasMenu({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: isSuperAdmin } = useIsAdmin();
  const { t, i18n } = useTranslation();

  const navigateAndClose = React.useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose]
  );

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

  const menuSections = React.useMemo((): OffCanvasMenuSection[] => {
    const main: OffCanvasMenuSection['items'] = [
      { id: 'home', label: t('home'), icon: '🏠', onClick: () => navigateAndClose('/explore'), activePath: '/explore', activeExact: true },
      { id: 'me', label: t('my_profile'), icon: '👤', onClick: () => navigateAndClose(routes.app.profile), activePath: routes.app.profile },
      { id: 'request-role', label: t('request_role'), icon: '📝', onClick: () => navigateAndClose('/app/roles/request'), activePath: '/app/roles/request' },
      { id: 'validation-info', label: t('validation_info'), icon: '✅', onClick: () => navigateAndClose('/validation/info'), activePath: '/validation/info' },
    ];
    if (isSuperAdmin) {
      main.push({
        id: 'admin',
        label: t('admin'),
        icon: '🛡️',
        onClick: () => navigateAndClose('/admin/roles'),
        activePath: '/admin/roles',
      });
    }
    const resources: OffCanvasMenuSection['items'] = [
      {
        id: 'roles-info',
        label: t('offcanvas_roles_prompt'),
        icon: '🎭',
        onClick: () => navigateAndClose('/app/roles/info'),
        activePath: '/app/roles/info',
      },
      {
        id: 'legal',
        label: t('legal'),
        icon: '🔒',
        onClick: () => navigateAndClose('/aviso-de-privacidad'),
        activePath: '/aviso-de-privacidad',
      },
    ];
    return [
      { id: 'main', title: t('offcanvas_section_main'), items: main },
      { id: 'resources', title: t('offcanvas_section_help'), items: resources },
    ];
  }, [isSuperAdmin, navigateAndClose, t, i18n.language]);

  const logoutItem = React.useMemo(
    () => ({
      id: 'logout',
      label: t('logout'),
      icon: '🚪',
      onClick: handleLogout,
    }),
    [t, i18n.language, handleLogout]
  );

  const userName = user?.user_metadata?.name || user?.email || t('user');
  const userEmail = user?.email ?? '';
  const userAvatar = user?.user_metadata?.avatar_url ?? '';
  const displayName = user?.user_metadata?.name ?? userName;

  return (
    <UIOffCanvasMenu
      isOpen={isOpen}
      onClose={onClose}
      pathname={location.pathname}
      menuSections={menuSections}
      logoutItem={logoutItem}
      userName={userName}
      userEmail={userEmail}
      userAvatar={userAvatar}
      displayName={displayName}
      brandName={t('where_dance')}
      brandLogoUrl={SEO_LOGO_URL}
      menuTitle={t('offcanvas_menu_title')}
      closeLabel={t('close')}
      footerInfoLabel={t('offcanvas_footer_info')}
      footerLegalLabel={t('legal')}
      disabledItemHint={t('coming_soon')}
    />
  );
}
