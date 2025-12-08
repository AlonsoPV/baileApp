import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary para capturar errores de React Query con Suspense
 * 
 * Uso:
 * ```tsx
 * <QueryErrorBoundary fallback={<ErrorScreen />}>
 *   <Suspense fallback={<Skeleton />}>
 *     <YourComponent />
 *   </Suspense>
 * </QueryErrorBoundary>
 * ```
 */
export class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[QueryErrorBoundary] Error capturado:', error);
    console.error('[QueryErrorBoundary] Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };
}

/**
 * Hook para usar QueryErrorBoundary con reset automático
 * 
 * Uso:
 * ```tsx
 * function MyComponent() {
 *   const { reset } = useQueryErrorResetBoundary();
 *   
 *   return (
 *     <QueryErrorBoundary onReset={reset}>
 *       <Suspense fallback={<Skeleton />}>
 *         <YourComponent />
 *       </Suspense>
 *     </QueryErrorBoundary>
 *   );
 * }
 * ```
 */
export function QueryErrorBoundaryWithReset({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <QueryErrorBoundary fallback={fallback} onReset={reset}>
      {children}
    </QueryErrorBoundary>
  );
}

/**
 * Componente de error por defecto
 */
function DefaultErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #121212, #1a1a1a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F5F5F5',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700 }}>
          Algo salió mal
        </h2>
        <p style={{ marginBottom: '1.5rem', opacity: 0.8, lineHeight: 1.6 }}>
          {error?.message || 'Ocurrió un error al cargar los datos. Por favor, intenta de nuevo.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onReset}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              border: '1px solid rgba(30,136,229,0.4)',
              background: 'linear-gradient(135deg, rgba(30,136,229,0.2), rgba(0,188,212,0.2))',
              color: '#1E88E5',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Reintentar
          </button>
          <button
            onClick={() => navigate('/explore')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

