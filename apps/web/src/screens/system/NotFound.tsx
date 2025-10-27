import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, borderRadius, theme } from '@/theme/colors';
import { routes } from '@/routes/registry';

export default function NotFound() {
  const navigate = useNavigate();

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
        <h1 style={{
          fontSize: typography.fontSize['5xl'],
          fontWeight: typography.fontWeight.bold,
          marginBottom: spacing[4],
          color: colors.primary[500]
        }}>
          404
        </h1>
        
        <p style={{
          fontSize: typography.fontSize.lg,
          opacity: 0.8,
          marginBottom: spacing[8],
          color: theme.text.secondary
        }}>
          La página que buscas no existe o ha sido movida.
        </p>
        
        <div style={{ display: 'flex', gap: spacing[4], justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(routes.app.home)}
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
            Volver al inicio
          </button>
          
          <button
            onClick={() => navigate(-1)}
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
            Página anterior
          </button>
        </div>
      </div>
    </div>
  );
}
