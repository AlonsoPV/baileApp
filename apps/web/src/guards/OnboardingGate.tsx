import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthReady } from "../hooks/useAuthReady";
import { colors, typography, spacing, borderRadius } from "../theme/colors";

const TIMEOUT_MS = 6000; // 6 seconds timeout

export default function OnboardingGate() {
  const loc = useLocation();
  const { ready, user, complete, authLoading, onboardingLoading } = useAuthReady();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Timeout fallback to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  // 🔹 1) Mientras carga sesión o perfil: NO tomar decisiones
  // Esto previene redirecciones prematuras al onboarding
  if (!ready || authLoading || onboardingLoading) {
    // If timeout reached, fallback to profile
    if (timeoutReached) {
      console.warn('[OnboardingGate] Timeout reached, falling back to profile');
      return <Navigate to="/app/profile" replace />;
    }

    return (
      <div style={{
        minHeight: '100vh',
        background: colors.gradients.app,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light
      }}>
        <div style={{
          textAlign: 'center',
          padding: spacing[8],
          background: colors.glass.light,
          borderRadius: borderRadius['2xl'],
          border: `1px solid ${colors.glass.medium}`,
          boxShadow: colors.shadows.glass,
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${colors.glass.medium}`,
            borderTop: `3px solid ${colors.primary[500]}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ 
            fontSize: typography.fontSize.base, 
            opacity: 0.8,
            color: colors.text.secondary
          }}>
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
    return <Navigate to="/auth/login" replace state={{ from: loc.pathname }} />;
  }

  const isOnboardingRoute = loc.pathname.startsWith("/onboarding");
  
  // 🌐 Rutas LIVE (públicas) que NO requieren onboarding ni autenticación completa
  // Estas rutas deben ser accesibles para todos los usuarios autenticados
  const LIVE_WHITELIST = [
    /^\/organizador\/\d+$/,        // /organizador/:id
    /^\/academia\/\d+$/,           // /academia/:id
    /^\/marca\/\d+$/,              // /marca/:id
    /^\/maestro\/\d+$/,            // /maestro/:id
    /^\/evento\/\d+$/,             // /evento/:id
    /^\/evento\/fecha\/\d+$/,      // /evento/fecha/:id
    /^\/events\/date\/\d+$/,        // /events/date/:id
    /^\/events\/parent\/\d+$/,      // /events/parent/:id (legacy)
    /^\/u\/[^/]+$/,                // /u/:userId
    /^\/explore\/?$/,              // /explore
    /^\/explore\/list/,            // /explore/list
    /^\/social\/\d+$/,             // /social/:id
    /^\/social\/fecha\/\d+$/,     // /social/fecha/:id
  ];
  const isLivePath = LIVE_WHITELIST.some(rx => rx.test(loc.pathname));
  
  // Rutas de edición (requieren ser owner pero no onboarding necesariamente)
  const organizerEditRoutes = [
    '/profile/organizer/edit',
    '/profile/organizer/events',
    '/profile/organizer/date',
    '/profile/organizer/dashboard',
    '/organizador/editar',
    '/academia/editar',
    '/marca/editar',
    '/maestro/editar',
  ];
  const isOrganizerRoute = organizerEditRoutes.some(route => loc.pathname.startsWith(route));

  // 🔹 3) Si ya está completo y estás en ruta onboarding → redirige a perfil
  if (complete && isOnboardingRoute) {
    return <Navigate to="/app/profile" replace />;
  }

  // 🔹 4) Si está en ruta LIVE → permitir siempre (sin onboarding requerido)
  if (isLivePath) {
    return <Outlet />;
  }

  // 🔹 5) ONBOARDING REQUERIDO (comentado por ahora)
  // Descomenta esto cuando quieras forzar onboarding para rutas protegidas
  // if (!complete && !isOnboardingRoute && !isOrganizerRoute) {
  //   return <Navigate to="/onboarding/basics" replace />;
  // }

  // 🔹 6) Todo OK → deja pasar
  return <Outlet />;
}
