import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useOnboardingStatus } from "../hooks/useOnboardingStatus";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function OnboardingGate() {
  const { user, loading: authLoading } = useAuth();
  const { loading, complete, exists, profile } = useOnboardingStatus();
  const loc = useLocation();

  // 1) Si no hay sesión, manda a login
  if (!authLoading && !user) {
    return <Navigate to="/auth/login" replace state={{ from: loc }} />;
  }

  // 2) Espera a que el perfil cargue ANTES de decidir
  if (authLoading || loading) {
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
            Cargando perfil...
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

  // 3) Si NO completo -> fuerza a onboarding (EXCEPTO rutas de organizador o públicas)
  if (!complete && !isOnboardingRoute && !isOrganizerRoute && !isPublicRoute) {
    return <Navigate to="/onboarding/basics" replace />;
  }

  // 4) Si YA completo -> no dejes quedarse en onboarding
  if (complete && isOnboardingRoute) {
    return <Navigate to="/app/profile" replace />;
  }

  return <Outlet />;
}
