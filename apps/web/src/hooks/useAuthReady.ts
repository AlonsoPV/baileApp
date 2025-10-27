import { useAuth } from '@/contexts/AuthProvider';
import { useOnboardingStatus } from "./useOnboardingStatus";

/**
 * Hook centralizado que espera a que TODOS los datos estén listos
 * antes de permitir que los guards tomen decisiones.
 * 
 * Esto previene redirecciones prematuras al onboarding.
 */
export function useAuthReady() {
  const { user, loading: authLoading } = useAuth();
  const { loading: onboardingLoading, complete, exists, profile } = useOnboardingStatus();

  // Solo está "ready" cuando ambos dejaron de cargar
  const ready = !authLoading && !onboardingLoading;

  return { 
    ready, 
    user, 
    complete, 
    exists,
    profile,
    authLoading, 
    onboardingLoading 
  };
}
