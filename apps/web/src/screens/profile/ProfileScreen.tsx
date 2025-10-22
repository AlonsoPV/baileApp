import { motion } from 'framer-motion';
import { UserProfileEditor } from './UserProfileEditor';
import { UserProfileLive } from './UserProfileLive';
import { OrganizerProfileEditor } from './OrganizerProfileEditor';
import { OrganizerProfileLive } from './OrganizerProfileLive';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useProfileMode } from '../../state/profileMode';

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function ProfileScreen() {
  const { profile, isLoading } = useUserProfile();
  const { mode } = useProfileMode(); // mode ahora es el rol actual
  const isEditRoute = window.location.pathname.includes('/edit');

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.dark,
          color: colors.light,
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            fontSize: '3rem',
          }}
        >
          💃
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.dark,
          color: colors.light,
        }}
      >
        <p>No se encontró el perfil</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.dark,
        padding: '24px 16px 120px',
      }}
    >
      {/* Render based on current mode (role) */}
      {mode === 'usuario' && (
        isEditRoute ? <UserProfileEditor /> : <UserProfileLive />
      )}

      {mode === 'organizador' && (
        isEditRoute ? <OrganizerProfileEditor /> : <OrganizerProfileLive />
      )}

      {/* Otros roles se manejan en sus propias rutas */}
    </div>
  );
}
