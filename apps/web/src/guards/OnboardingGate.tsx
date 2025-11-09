import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { routes } from '@/routes/registry';
import { isPinVerified, needsPinVerify } from '@/lib/pin';

export default function OnboardingGate() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // Guard only /app/* and /profile/* paths
  const PROTECTED_PREFIX = [/^\/app\//, /^\/profile(\/|$)/];
  const shouldGuard = PROTECTED_PREFIX.some((r) => r.test(location.pathname));
  if (!shouldGuard) {
    return <Outlet />;
  }

  const isOnboardingRoute = location.pathname.startsWith('/onboarding');

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['onboarding-status', user?.id],
    enabled: !!user && !authLoading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_user')
        .select('onboarding_complete, pin_hash')
        .eq('user_id', user!.id)
        .limit(1);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row ?? { onboarding_complete: false, pin_hash: null };
    },
    staleTime: 30000,
  });

  // 1) Aún autenticando o esperando query
  if (authLoading || isLoading || isFetching) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#0b0d10',
        color: '#e5e7eb',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,.12)'
        }}>
          Cargando…
        </div>
      </div>
    );
  }

  // 2) Sin usuario ⇒ manda a login
  if (!user) {
    return <Navigate to={routes.auth.login} replace />;
  }

  // 3) Error pero con usuario ⇒ deja pasar (fallback seguro)
  if (error) {
    console.warn('[OnboardingGate] Error status:', error);
    return <Outlet />;
  }

  const complete = data?.onboarding_complete === true;
  const hasPin = !!data?.pin_hash;

  // 4) Si completo ⇒ libera la app
  if (complete) {
    // Enforce PIN verification for protected areas
    const onPinRoutes = location.pathname.startsWith(routes.auth.pin) || location.pathname.startsWith(routes.auth.pinSetup);
    if (!onPinRoutes && hasPin) {
      // Solo exigir PIN si el usuario tiene PIN configurado
      if (needsPinVerify(user.id) && !isPinVerified(user.id)) {
        return <Navigate to={routes.auth.pin} replace />;
      }
    }
    return <Outlet />;
  }

  // 5) Si no completo y NO estás ya en onboarding ⇒ mándalo a onboarding/basics
  if (!isOnboardingRoute) {
    return <Navigate to={routes.onboarding.basics} replace />;
  }

  // 6) Estás en onboarding ⇒ renderiza la ruta de onboarding
  return <Outlet />;
}
