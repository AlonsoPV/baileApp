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
  const location = useLocation();
  const search = location.search;
  const pathname = location.pathname;
  const locationState = location.state as any;
  const viewUserId = new URLSearchParams(search).get('userId');
  const [shouldRedirect, setShouldRedirect] = React.useState<string | null>(null);

  // Calcular una vez por render la ruta por defecto como string estable
  const defaultRoute = getDefaultRoute();

  // Si viene userId por query, redirigir a la ruta pública /u/:userId
  if (viewUserId) {
    return <Navigate to={`/u/${encodeURIComponent(viewUserId)}`} replace />;
  }

  // Si se accede a /profile o /app/profile directamente (sin ruta específica), redirigir al perfil por defecto
  React.useEffect(() => {
    // Solo procesar cuando los datos estén listos
    if (loading || isLoading || !user) return;
    
    // Solo redirigir si estamos en /profile o /app/profile (no en /profile/edit ni otras rutas)
    // y si no venimos explícitamente con una instrucción de omitir el perfil por defecto
    const isEntryRoute = pathname === '/profile' || pathname === '/app/profile';
    if (isEntryRoute && !isEditRoute && !locationState?.bypassDefault) {
      console.log('[ProfileScreen] Redirección al perfil por defecto:', {
        defaultProfile,
        defaultRoute,
        pathname,
        isEditRoute,
        mode,
        locationState,
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
        // Evitar bucles: solo actualizar si realmente cambia el modo
        if (mode !== newMode) {
          console.log('[ProfileScreen] setMode por perfil por defecto', {
            from: mode,
            to: newMode,
          });
          setMode(newMode);
        } else {
          console.log('[ProfileScreen] Modo ya coincide con perfil por defecto, no se llama setMode');
        }
        // Redirigir inmediatamente
        console.log('[ProfileScreen] Solicitando redirección a ruta por defecto', {
          target: defaultRoute,
        });
        setShouldRedirect(defaultRoute);
        return;
      }
      
      // Si el perfil por defecto es 'user', asegurar que el modo esté en 'usuario'
      if (defaultProfile === 'user') {
        if (mode !== 'usuario') {
          console.log('[ProfileScreen] Forzando modo usuario porque defaultProfile=user', {
            from: mode,
            to: 'usuario',
          });
          setMode('usuario');
        } else {
          console.log('[ProfileScreen] Modo ya es usuario, no se llama setMode');
        }
      }
    }
  }, [loading, isLoading, user, pathname, isEditRoute, defaultRoute, defaultProfile, mode, setMode, locationState]);

  // Asegurar que en /profile/user siempre se muestre el perfil de usuario (modo 'usuario')
  React.useEffect(() => {
    if (loading || isLoading || !user) return;
    if (pathname.startsWith('/profile/user')) {
      if (mode !== 'usuario') {
        console.log('[ProfileScreen] Forzando modo usuario porque pathname=/profile/user', {
          from: mode,
          to: 'usuario',
          pathname,
        });
        setMode('usuario');
      }
    }
  }, [loading, isLoading, user, pathname, mode, setMode]);

  // Redirigir si es necesario, salvo cuando venimos explícitamente con bypassDefault
  if (shouldRedirect && !locationState?.bypassDefault) {
    console.log('[ProfileScreen] Ejecutando Navigate a ruta por defecto', {
      shouldRedirect,
      bypassDefault: locationState?.bypassDefault,
    });
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
        <p>Cargando sesión…</p>
      </div>
    );
  }

  if (!user) {
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
        <p>No has iniciado sesión</p>
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
