// path: src/routes/guards/OnboardingGate.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { routes } from "@/routes/registry";
import { isPinVerified, needsPinVerify } from "@/lib/pin";
import LoadingScreen from "@/components/LoadingScreen";

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
  ritmos?: unknown[] | string | null;
  ritmos_seleccionados?: unknown[] | string | null;
  zonas?: unknown[] | string | null;
  rol_baile?: string | null;
};

type OnboardingStatus = OnboardingRow & { onboarding_complete: boolean };

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Query timeout")), ms);
    Promise.resolve(promise)
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

function safeArrayLen(v: any): number {
  if (Array.isArray(v)) return v.length;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

async function fetchOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const { data, error } = await supabase
    .from("profiles_user")
    .select("user_id, onboarding_complete, pin_hash, updated_at, display_name, ritmos, ritmos_seleccionados, zonas, rol_baile")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const row = (data as OnboardingRow | null) ?? null;
  if (!row) return { onboarding_complete: false, pin_hash: null, user_id: userId };

  const hasName = !!row.display_name;
  const ritmosCount = safeArrayLen(row.ritmos) + safeArrayLen(row.ritmos_seleccionados);
  const hasRitmos = ritmosCount > 0;
  const hasZonas = safeArrayLen(row.zonas) > 0;
  const hasRol = !!row.rol_baile;

  // Fuente de verdad: onboarding_complete
  // (Si quieres mantener compat: OR con onboarding_completed)
  const flag = row.onboarding_complete === true;

  // NO escribir en DB aquí. Solo computar.
  const complete = flag || (hasName && hasRitmos && hasZonas && hasRol);

  return { ...row, onboarding_complete: complete };
}

export default function OnboardingGate() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const shouldGuard = React.useMemo(
    () => PROTECTED_PREFIX.some((r) => r.test(location.pathname)),
    [location.pathname]
  );
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["onboarding-status", user?.id],
    enabled: shouldGuard && !!user?.id && !authLoading,
    queryFn: async () => {
      if (!user?.id) throw new Error("Usuario sin ID");
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
      const timeout = setTimeout(() => setLoadingTimeout(true), UI_TIMEOUT_MS);
      return () => clearTimeout(timeout);
    }
    setLoadingTimeout(false);
  }, [authLoading, isLoading, isFetching]);

  if (!shouldGuard) return <Outlet />;

  const loading = authLoading || isLoading || isFetching;
  if (loading) {
    if (loadingTimeout) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0d10", color: "#e5e7eb" }}>
          <div style={{ padding: 24, borderRadius: 12, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", maxWidth: 400, textAlign: "center" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8 }}>⚠️ Error de conexión</div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: 16 }}>
              No se pudo verificar tu estado de onboarding. Por favor, recarga la página.
            </div>
            <button onClick={() => window.location.reload()} style={{ padding: "0.75rem 1.5rem", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return <LoadingScreen message="Verificando tu perfil..." submessage="Un momento por favor" />;
  }

  if (!user) return <Navigate to={routes.auth.login} replace />;

  if (error) {
    console.warn("[OnboardingGate] Error status:", error);
    return <Outlet />;
  }

  const complete = data?.onboarding_complete === true;
  const hasPin = !!data?.pin_hash;

  if (complete) {
    const onPinRoutes = location.pathname.startsWith(routes.auth.pin) || location.pathname.startsWith(routes.auth.pinSetup);
    if (!onPinRoutes && hasPin && !isOnboardingRoute) {
      if (needsPinVerify(user.id) && !isPinVerified(user.id)) {
        return <Navigate to={routes.auth.pin} replace />;
      }
    }
    return <Outlet />;
  }

  if (!isOnboardingRoute) return <Navigate to={routes.onboarding.basics} replace />;

  return <Outlet />;
}