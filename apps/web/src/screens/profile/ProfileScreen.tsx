import React from 'react';
import { motion } from 'framer-motion';
import { Navigate, useLocation } from 'react-router-dom';
import UserProfileEditor from './UserProfileEditor';
import { UserProfileLive } from './UserProfileLive';
import OrganizerProfileEditor from './OrganizerProfileEditor';
import { OrganizerProfileLive } from './OrganizerProfileLive';
import { useUserProfile } from '../../hooks/useUserProfile';
import UserPublicScreen from './UserPublicScreen';
import { useProfileMode } from '../../state/profileMode';
import { useAuth } from '@/contexts/AuthProvider';
import { useDefaultProfile } from '../../hooks/useDefaultProfile';

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function ProfileScreen() {
  const { user, loading } = useAuth();
  const { profile, isLoading } = useUserProfile();
  const { mode, setMode } = useProfileMode(); // mode ahora es el rol actual
  const { getDefaultRoute, defaultProfile } = useDefaultProfile();
  const isEditRoute = window.location.pathname.includes('/edit');
  const { search, pathname } = useLocation();
  const viewUserId = new URLSearchParams(search).get('userId');
  const [shouldRedirect, setShouldRedirect] = React.useState<string | null>(null);

  // Si viene userId por query, redirigir a la ruta pública /u/:userId
  if (viewUserId) {
    return <Navigate to={`/u/${encodeURIComponent(viewUserId)}`} replace />;
  }

  // Si se accede a /profile directamente (sin ruta específica), redirigir al perfil por defecto
  React.useEffect(() => {
    // Solo procesar cuando los datos estén listos
    if (loading || isLoading || !user) return;
    
    // Solo redirigir si estamos en /profile (no en /profile/edit ni otras rutas)
    if (pathname === '/profile' && !isEditRoute) {
      const defaultRoute = getDefaultRoute();
      
      console.log('[ProfileScreen] Redirección al perfil por defecto:', {
        defaultProfile,
        defaultRoute,
        pathname,
        isEditRoute
      });
      
      // Si la ruta por defecto es diferente a /profile, redirigir
      if (defaultRoute !== '/profile') {
        // Sincronizar el modo con el perfil por defecto
        const modeMap: Record<string, 'usuario' | 'organizador' | 'maestro' | 'academia' | 'marca'> = {
          'user': 'usuario',
          'organizer': 'organizador',
          'teacher': 'maestro',
          'academy': 'academia',
          'brand': 'marca'
        };
        const newMode = modeMap[defaultProfile] || 'usuario';
        setMode(newMode);
        // Redirigir inmediatamente
        setShouldRedirect(defaultRoute);
        return;
      }
      
      // Si el perfil por defecto es 'user', asegurar que el modo esté en 'usuario'
      if (defaultProfile === 'user') {
        setMode('usuario');
      }
    }
  }, [loading, isLoading, user, pathname, isEditRoute, getDefaultRoute, defaultProfile, setMode]);

  // Redirigir si es necesario
  if (shouldRedirect) {
    return <Navigate to={shouldRedirect} replace />;
  }

  if (loading || isLoading) {
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
        <p>Cargando perfil…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
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
