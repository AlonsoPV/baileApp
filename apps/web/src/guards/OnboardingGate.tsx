// src/routes/guards/OnboardingGate.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { routes } from '@/routes/registry';
import { isPinVerified, needsPinVerify } from '@/lib/pin';

// ---------- Constantes / Tipos ----------
const PROTECTED_PREFIX = [/^\/app\//, /^\/profile(\/|$)/];
const QUERY_TIMEOUT_MS = 15_000;
const UI_TIMEOUT_MS = 30_000;

type OnboardingRow = {
  user_id: string;
  onboarding_complete?: boolean | null;
  onboarding_completed?: boolean | null;
  pin_hash?: string | null;
  updated_at?: string | null;
  display_name?: string | null;
  ritmos?: unknown[] | null;
  ritmos_seleccionados?: unknown[] | null;
  zonas?: unknown[] | null;
  rol_baile?: string | null;
};

type OnboardingStatus = OnboardingRow & { onboarding_complete: boolean };

// ---------- Helpers ----------
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Query timeout')), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

async function fetchOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const { data, error } = await supabase
    .from('profiles_user')
    .select(
      'user_id, onboarding_complete, onboarding_completed, pin_hash, updated_at, display_name, ritmos, ritmos_seleccionados, zonas, rol_baile'
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as OnboardingRow | undefined;
  if (!row) return { onboarding_complete: false, pin_hash: null, user_id: userId };

  const hasName = !!row.display_name;
  const ritmosCount =
    (Array.isArray(row.ritmos) ? row.ritmos.length : 0) +
    (Array.isArray(row.ritmos_seleccionados) ? row.ritmos_seleccionados.length : 0);
  const hasRitmos = ritmosCount > 0;
  const hasZonas = Array.isArray(row.zonas) && row.zonas.length > 0;
  const hasRol = !!row.rol_baile;

  let complete = row.onboarding_complete === true;

  // Auto-corrección si los datos están completos pero el flag está desmarcado
  if (!complete && hasName && hasRitmos && hasZonas && hasRol) {
    try {
      const { error: updError } = await supabase
        .from('profiles_user')
        .update({ onboarding_complete: true, onboarding_completed: true })
        .eq('user_id', userId);
      if (updError) {
        console.warn('[OnboardingGate] No se pudo actualizar onboarding_complete automáticamente:', updError.message);
      } else {
        complete = true;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('[OnboardingGate] Error inesperado al auto-corregir onboarding_complete:', msg);
    }
  }

  return { ...row, onboarding_complete: complete };
}

// ---------- UI ----------
function LoadingScreen() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#0b0d10] text-gray-200 font-sans">
      <div className="p-4 rounded-xl border border-white/10">Cargando…</div>
    </div>
  );
}

function ConnectionError() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#0b0d10] text-gray-200 font-sans">
      <div className="max-w-[400px] text-center p-6 rounded-xl border border-red-500/30 bg-red-500/10">
        <div className="text-lg font-semibold mb-2">⚠️ Error de conexión</div>
        <div className="text-sm opacity-80 mb-4">No se pudo verificar tu estado de onboarding. Por favor, recarga la página.</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-md bg-red-500 text-white font-semibold text-sm cursor-pointer"
        >
          Recargar página
        </button>
      </div>
    </div>
  );
}

// ---------- Main ----------
export default function OnboardingGate() {
  // Hooks: siempre antes de cualquier early return
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const pathname = location.pathname;
  const shouldGuard = React.useMemo(() => PROTECTED_PREFIX.some((r) => r.test(pathname)), [pathname]);
  const isOnboardingRoute = pathname.startsWith('/onboarding');

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['onboarding-status', user?.id],
    enabled: shouldGuard && !!user && !authLoading && !!user?.id,
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuario sin ID');
      // timeout real de 15s sobre la query
      return withTimeout(fetchOnboardingStatus(user.id), QUERY_TIMEOUT_MS);
    },
    staleTime: 30_000,
    retry: 2,
    retryDelay: 1_000,
    gcTime: 60_000,
  });

  const [loadingTimeout, setLoadingTimeout] = React.useState(false);

  React.useEffect(() => {
    if (authLoading || isLoading || isFetching) {
      const t = setTimeout(() => {
        console.error('[OnboardingGate] Timeout en carga después de 30 segundos - esto no debería pasar');
        setLoadingTimeout(true);
      }, UI_TIMEOUT_MS);
      return () => clearTimeout(t);
    }
    setLoadingTimeout(false);
  }, [authLoading, isLoading, isFetching]);

  // Early returns después de los hooks
  if (!shouldGuard) {
    return <Outlet />;
  }

  const loading = authLoading || isLoading || isFetching;

  // 1) Cargando
  if (loading) {
    return loadingTimeout ? <ConnectionError /> : <LoadingScreen />;
  }

  // 2) Sin usuario ⇒ login
  if (!user) {
    return <Navigate to={routes.auth.login} replace />;
  }

  // 3) Error pero con usuario ⇒ deja pasar (fallback)
  if (error) {
    console.warn('[OnboardingGate] Error status:', error);
    return <Outlet />;
  }

  const complete = data?.onboarding_complete === true;
  const hasPin = !!data?.pin_hash;

  // 4) Completo ⇒ liberar app (PIN si aplica y no está en onboarding)
  if (complete) {
    const onPinRoute = pathname.startsWith(routes.auth.pin) || pathname.startsWith(routes.auth.pinSetup);
    if (!onPinRoute && hasPin && !isOnboardingRoute) {
      if (needsPinVerify(user.id) && !isPinVerified(user.id)) {
        return <Navigate to={routes.auth.pin} replace />;
      }
    }
    return <Outlet />;
  }

  // 5) Incompleto y fuera de onboarding ⇒ redirigir a onboarding/basics
  if (!isOnboardingRoute) {
    return <Navigate to={routes.onboarding.basics} replace />;
  }

  // 6) En onboarding ⇒ renderizar
  return <Outlet />;
}
