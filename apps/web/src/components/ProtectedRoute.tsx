import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
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

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

