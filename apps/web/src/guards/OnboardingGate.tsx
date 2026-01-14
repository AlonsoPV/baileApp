// src/routes/guards/OnboardingGate.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { routes } from '@/routes/registry';
import { isPinVerified, needsPinVerify } from '@/lib/pin';
import LoadingScreen from '@/components/LoadingScreen';

// ---------- Constantes / Tipos (fuera del componente) ----------
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
  // why: fail-fast para evitar esperas indefinidas
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

  // Auto-corrección si los datos están completos pero el flag está desmarcado
  const hasName = !!row.display_name;
  const ritmosCount =
    (Array.isArray(row.ritmos) ? row.ritmos.length : 0) +
    (Array.isArray(row.ritmos_seleccionados) ? row.ritmos_seleccionados.length : 0);
  const hasRitmos = ritmosCount > 0;
  const hasZonas = Array.isArray(row.zonas) && row.zonas.length > 0;
  const hasRol = !!row.rol_baile;

  let complete = row.onboarding_complete === true;

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

// ---------- Componente principal ----------
export default function OnboardingGate() {
  // ✅ TODOS LOS HOOKS DEBEN IR ANTES DE CUALQUIER EARLY RETURN
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // Guard only /app/* and /profile/* paths
  const shouldGuard = React.useMemo(
    () => PROTECTED_PREFIX.some((r) => r.test(location.pathname)),
    [location.pathname]
  );
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');

  // ✅ useQuery debe llamarse SIEMPRE, sin importar shouldGuard
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['onboarding-status', user?.id],
    enabled: shouldGuard && !!user && !authLoading && !!user?.id,
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuario sin ID');
      try {
        // Timeout real de 15s sobre la query
        return await withTimeout(fetchOnboardingStatus(user.id), QUERY_TIMEOUT_MS);
      } catch (e: any) {
        throw e;
      }
    },
    staleTime: 30000,
    retry: 2,
    retryDelay: 1000,
    gcTime: 60000,
  });

  // ✅ useState debe llamarse SIEMPRE
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);

  // ✅ useEffect debe llamarse SIEMPRE
  React.useEffect(() => {
    if (authLoading || isLoading || isFetching) {
      const timeout = setTimeout(() => {
        console.error('[OnboardingGate] Timeout en carga después de 30 segundos - esto no debería pasar');
        setLoadingTimeout(true);
      }, UI_TIMEOUT_MS);
      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [authLoading, isLoading, isFetching]);

  // ---------- Early returns (después de los hooks) ----------
  if (!shouldGuard) {
    return <Outlet />;
  }

  const loading = authLoading || isLoading || isFetching;

  // 1) Aún autenticando o esperando query
  if (loading) {
    if (loadingTimeout) {
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
            padding: 24,
            borderRadius: 12,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.1)',
            maxWidth: 400,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>
              ⚠️ Error de conexión
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: 16 }}>
              No se pudo verificar tu estado de onboarding. Por favor, recarga la página.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 8,
                border: 'none',
                background: '#ef4444',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return (
      <LoadingScreen 
        message="Verificando tu perfil..." 
        submessage="Un momento por favor"
      />
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

  // 4) Si completo ⇒ libera la app (verificar PIN si no está en onboarding)
  if (complete) {
    const onPinRoutes =
      location.pathname.startsWith(routes.auth.pin) || location.pathname.startsWith(routes.auth.pinSetup);
    if (!onPinRoutes && hasPin && !isOnboardingRoute) {
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

  // 6) Estás en onboarding ⇒ renderiza la ruta de onboarding (sin verificar PIN)
  return <Outlet />;
}
