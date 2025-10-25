import { useEffect, useRef, useState } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';

function decideRoute(opts: {
  session: any;
  profile: any;
}): string | null {
  const { session, profile } = opts;

  // No logueado
  if (!session) return '/auth/login';

  // Logueado pero sin perfil completo (ajusta tu condición real)
  const isComplete =
    !!profile &&
    (profile.display_name || (profile.ritmos?.length ?? 0) > 0 || (profile.zonas?.length ?? 0) > 0);

  if (!isComplete) return '/onboarding/basics';

  // Todo OK → no redirigir
  return null;
}

export default function WebRouteGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();

  const navigate = useNavigate();
  const didRoute = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Espera a que ambos carguen
    if (authLoading || profileLoading) return;
    if (didRoute.current) return;

    const target = decideRoute({ session, profile });

    if (target) {
      didRoute.current = true;
      safeReplace(navigate, target);
      return;
    }

    setReady(true);
  }, [authLoading, profileLoading, session, profile, navigate]);

  if (!ready) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: '#0E0E0E',
        color: 'white',
      }}>
        Cargando…
      </div>
    );
  }

  return <>{children}</>;
}

function safeReplace(navigate: NavigateFunction, to: string) {
  try {
    navigate(to, { replace: true });
  } catch {
    // fallback extremo si el router aún no está listo
    window.location.replace(to);
  }
}
