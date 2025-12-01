import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthProvider';

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

type ProfileRole = 'user' | 'academy' | 'organizer' | 'teacher' | 'brand';

export function ProfileScreen() {
  const { user, loading } = useAuth();
  const { profile, isLoading } = useUserProfile();
  const location = useLocation();
  const search = location.search;
  const viewUserId = new URLSearchParams(search).get('userId');

  const isLoadingUser = loading;
  const isLoadingProfile = isLoading;
  const hasProfile = !!profile;

  // Si viene userId por query, redirigir a la ruta pública /u/:userId
  if (viewUserId) {
    return <Navigate to={`/u/${encodeURIComponent(viewUserId)}`} replace />;
  }

  // Rol crudo desde el perfil
  const profileRoleRaw = (profile as any)?.role as ProfileRole | null | undefined;
  // Fallback a "user" cuando el rol venga null/undefined o desconocido
  const effectiveRole: ProfileRole =
    profileRoleRaw === 'academy' ||
    profileRoleRaw === 'organizer' ||
    profileRoleRaw === 'teacher' ||
    profileRoleRaw === 'brand' ||
    profileRoleRaw === 'user'
      ? profileRoleRaw
      : 'user';

  const roleToRoute: Record<ProfileRole, string> = {
    user: '/profile/user',
    academy: '/profile/academy',
    organizer: '/profile/organizer',
    teacher: '/profile/teacher',
    brand: '/profile/brand',
  };

  const defaultRoute = roleToRoute[effectiveRole];

  // Loading explícito
  if (isLoadingUser || isLoadingProfile) {
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
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 16px' }}>
          <p style={{ marginBottom: '8px' }}>Estamos cargando tu perfil...</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Si tarda mucho, intenta refrescar la página para una carga más rápida.
          </p>
        </div>
      </div>
    );
  }

  // Sin usuario autenticado
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
        <p style={{ color: 'red' }}>No hay usuario autenticado.</p>
      </div>
    );
  }

  // Sin perfil base
  if (!hasProfile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.dark,
          color: colors.light,
          padding: 16,
          textAlign: 'center',
        }}
      >
        <div>
          <h2 style={{ marginBottom: 8 }}>Aún no tienes un perfil configurado</h2>
          <p style={{ opacity: 0.8 }}>
            Completa tu información básica para activar tu perfil en la comunidad.
          </p>
        </div>
      </div>
    );
  }

  // Debug visual del estado actual
  const debugState = {
    isLoadingUser,
    user: user ? { id: user.id, email: (user as any).email ?? null } : null,
    isLoadingProfile,
    hasProfile,
    profilePreview: profile
      ? {
          id: (profile as any).id,
          role: (profile as any).role || (profile as any).type || null,
        }
      : null,
    effectiveRole,
    defaultRoute,
  };

  // Según el rol efectivo, navegar a la ruta correspondiente
  if (effectiveRole === 'academy') {
    return <Navigate to={roleToRoute.academy} replace />;
  }

  if (effectiveRole === 'organizer') {
    return <Navigate to={roleToRoute.organizer} replace />;
  }

  if (effectiveRole === 'teacher') {
    return <Navigate to={roleToRoute.teacher} replace />;
  }

  if (effectiveRole === 'brand') {
    return <Navigate to={roleToRoute.brand} replace />;
  }

  // Fallback "user" (cuando el rol es null o "user")
  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.dark,
        padding: '24px 16px 120px',
      }}
    >
      {/* <pre
        style={{
          fontSize: 12,
          background: '#f3f4f6',
          padding: 8,
          marginBottom: 16,
          borderRadius: 8,
          whiteSpace: 'pre-wrap',
          color: '#111827',
        }}
      >
        {JSON.stringify(debugState, null, 2)}
      </pre> */}

      <Navigate to={roleToRoute.user} replace />
    </div>
  );
}
