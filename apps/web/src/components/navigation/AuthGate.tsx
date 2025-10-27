import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { colors, typography, spacing, borderRadius } from '@/theme/colors';

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGate({ children, fallback }: AuthGateProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return fallback || (
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
            Verificando autenticación...
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

  // If no user, redirect to login with current location as state
  if (!user) {
    return (
      <Navigate 
        to="/auth/login" 
        replace 
        state={{ from: location.pathname }}
      />
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
