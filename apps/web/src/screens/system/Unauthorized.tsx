import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { colors, typography, spacing, borderRadius, theme } from '@/theme/colors';
import { routes } from '@/routes/registry';

export default function Unauthorized() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const missingRole = sp.get('role');

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'grid',
      placeItems: 'center',
      textAlign: 'center',
      padding: spacing[8],
      background: theme.bg.app,
      color: colors.light
    }}>
      <div style={{
        background: colors.glass.light,
        borderRadius: borderRadius['2xl'],
        padding: spacing[12],
        border: `1px solid ${colors.glass.medium}`,
        boxShadow: colors.shadows.glass,
        backdropFilter: 'blur(20px)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{
          fontSize: typography.fontSize['4xl'],
          marginBottom: spacing[4],
          color: colors.warning
        }}>
          🔒
        </div>
        
        <h1 style={{
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          marginBottom: spacing[4],
          color: colors.light
        }}>
          {missingRole ? 'Rol requerido' : 'Acceso no autorizado'}
        </h1>
        
        <p style={{
          fontSize: typography.fontSize.lg,
          opacity: 0.8,
          marginBottom: spacing[8],
          color: theme.text.secondary
        }}>
          {missingRole
            ? <>No cuentas con el rol <b>{missingRole}</b> para acceder a esta sección.</>
            : <>No tienes permisos para acceder a esta página. Inicia sesión o contacta al administrador.</>}
        </p>
        
        <div style={{ display: 'flex', gap: spacing[4], justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(routes.auth.login)}
            style={{
              padding: `${spacing[3]} ${spacing[6]}`,
              borderRadius: borderRadius.lg,
              background: colors.primary[500],
              color: colors.light,
              border: 'none',
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = colors.primary[600];
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = colors.primary[500];
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Iniciar sesión
          </button>
          
          {missingRole && (
            <button
              onClick={() => navigate(`/profile/roles/request?role=${encodeURIComponent(missingRole)}`)}
              style={{
                padding: `${spacing[3]} ${spacing[6]}`,
                borderRadius: borderRadius.lg,
                background: colors.success[600] || '#10B981',
                color: colors.light,
                border: 'none',
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Solicitar rol
            </button>
          )}
          
          <button
            onClick={() => navigate(routes.app.home)}
            style={{
              padding: `${spacing[3]} ${spacing[6]}`,
              borderRadius: borderRadius.lg,
              background: 'transparent',
              color: colors.text.secondary,
              border: `1px solid ${colors.glass.medium}`,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = colors.glass.medium;
              e.currentTarget.style.color = colors.light;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = theme.text.secondary;
            }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
