import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
}

export function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
  const { user, loading } = useAuth();
  const { profile, isLoading } = useUserProfile();

  if (loading || isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontSize: '1.5rem',
        }}
      >
        Cargando...
      </div>
    );
  }

  if (user) {
    // ONBOARDING DISABLED - Always redirect to app
    return <Navigate to="/app/profile" replace />;
    
    // Check if user has completed profile/onboarding
    // if (profile && profile.display_name && profile.ritmos?.length > 0 && profile.zonas?.length > 0) {
    //   // Profile is complete, redirect to app
    //   return <Navigate to="/app/profile" replace />;
    // } else {
    //   // Profile is incomplete, redirect to onboarding
    //   return <Navigate to="/onboarding/basics" replace />;
    // }
  }

  return <>{children}</>;
}

