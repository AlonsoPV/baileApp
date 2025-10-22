import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthReady } from "../hooks/useAuthReady";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function OnboardingGate() {
  const loc = useLocation();
  const { ready, user, complete, authLoading, onboardingLoading } = useAuthReady();

  // 🔹 1) Mientras carga sesión o perfil: NO tomar decisiones
  // Esto previene redirecciones prematuras al onboarding
  if (!ready || authLoading || onboardingLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.dark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light
      }}>
        <div style={{
          textAlign: 'center',
          padding: '24px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${colors.light}33`,
            borderTop: `3px solid ${colors.coral}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ fontSize: '1rem', opacity: 0.8 }}>
            {authLoading ? 'Verificando autenticación...' : 'Cargando perfil...'}
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 🔹 2) Si no hay usuario autenticado, manda a login
  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: loc }} />;
  }

  const isOnboardingRoute = loc.pathname.startsWith("/onboarding");
  
  // Rutas que NO requieren onboarding completo
  const organizerRoutes = [
    '/profile/organizer',
    '/events/parent',
    '/events/date'
  ];
  const isOrganizerRoute = organizerRoutes.some(route => loc.pathname.startsWith(route));
  
  // Rutas públicas que tampoco requieren onboarding
  const publicRoutes = ['/u/', '/events/parent/', '/events/date/'];
  const isPublicRoute = publicRoutes.some(route => loc.pathname.includes(route) && !loc.pathname.includes('/edit'));

  // 🔹 3) Si ya está completo y estás en ruta onboarding → redirige a perfil
  if (complete && isOnboardingRoute) {
    return <Navigate to="/app/profile" replace />;
  }

  // 🔹 4) ONBOARDING DISABLED - Permitir acceso sin onboarding completo
  // if (!complete && !isOnboardingRoute && !isOrganizerRoute && !isPublicRoute) {
  //   return <Navigate to="/onboarding/basics" replace />;
  // }

  // 🔹 5) Todo OK → deja pasar
  return <Outlet />;
}
