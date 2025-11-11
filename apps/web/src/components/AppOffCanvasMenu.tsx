import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OffCanvasMenu as UIOffCanvasMenu } from '@ui/index';
import { useAuth } from '@/contexts/AuthProvider';
import { useIsAdmin } from '@/hooks/useRoleRequests';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AppOffCanvasMenu({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isSuperAdmin } = useIsAdmin();

  const menuItems = [
    { id: 'challenges', label: 'Retos', icon: '🏆', onClick: () => navigate('/challenges') },
    { id: 'trending', label: 'Trending', icon: '📈', onClick: () => navigate('/trending') },
    { id: 'me', label: 'Mi perfil', icon: '👤', onClick: () => navigate('/app/profile') },
    { id: 'request-role', label: 'Solicitar rol', icon: '📝', onClick: () => navigate('/app/roles/request') },
    isSuperAdmin ? { id: 'admin', label: 'Admin', icon: '🛡️', onClick: () => navigate('/admin/roles') } : null,
  ].filter(Boolean) as Array<{ id: string; label: string; icon?: string; onClick: () => void }>;

  return (
    <UIOffCanvasMenu
      isOpen={isOpen}
      onClose={onClose}
      menuItems={menuItems}
      userName={user?.user_metadata?.name || user?.email || 'Usuario'}
      userEmail={user?.email || undefined}
      userAvatar={user?.user_metadata?.avatar_url}
      displayName={user?.user_metadata?.name}
    />
  );
}


