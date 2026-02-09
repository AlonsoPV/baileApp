import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors as rawColors, typography, spacing, borderRadius } from '@/theme/colors';
import { routes } from '@/routes/registry';

const colors: any = rawColors;

export default function NotFound() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing[6],
      background: `linear-gradient(135deg, ${colors.dark} 0%, #1a1a1a 50%, ${colors.dark} 100%)`,
      position: 'relative',
      overflow: 'hidden',
      color: colors.light
    }}>
      {/* Efectos de fondo animados */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle, ${colors.primary[500]}15 0%, transparent 70%)`,
        animation: 'pulse 8s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        right: '-30%',
        width: '60%',
        height: '60%',
        background: `radial-gradient(circle, ${colors.secondary[500]}10 0%, transparent 70%)`,
        animation: 'pulse 10s ease-in-out infinite',
        animationDelay: '2s',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease'
      }}>
        {/* Tarjeta principal con efecto glassmorphism */}
        <div style={{
          background: colors.glass.light,
          borderRadius: borderRadius['2xl'],
          padding: spacing[12],
          border: `1px solid ${colors.glass.medium}`,
          boxShadow: `${colors.shadows.glass}, 0 0 60px ${colors.primary[500]}20`,
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Borde superior con gradiente */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${colors.primary[500]}, ${colors.secondary[500]}, ${colors.primary[500]})`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite'
          }} />

          {/* Número 404 grande con efecto */}
          <div style={{
            position: 'relative',
            marginBottom: spacing[6]
          }}>
            <h1 style={{
              fontSize: 'clamp(4rem, 15vw, 8rem)',
              fontWeight: 900,
              lineHeight: 1,
              margin: 0,
              background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.secondary[500]}, ${colors.primary[500]})`,
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradientShift 4s ease infinite',
              textShadow: `0 0 40px ${colors.primary[500]}40`,
              letterSpacing: '-0.05em'
            }}>
              404
            </h1>
            
            {/* Icono decorativo */}
            <div style={{
              fontSize: '4rem',
              marginTop: spacing[4],
              opacity: 0.6,
              animation: 'float 3s ease-in-out infinite',
              filter: 'drop-shadow(0 0 20px rgba(255, 60, 56, 0.3))'
            }}>
              💃
            </div>
          </div>

          {/* Título */}
          <h2 style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing[3],
            color: colors.light,
            lineHeight: 1.3
          }}>
            ¡Oops! Página no encontrada
          </h2>
          
          {/* Descripción */}
          <p style={{
            fontSize: typography.fontSize.lg,
            opacity: 0.85,
            marginBottom: spacing[8],
            color: colors.text.secondary,
            lineHeight: 1.6,
            maxWidth: '480px',
            margin: `0 auto ${spacing[8]}`
          }}>
            La página que buscas no existe, ha sido movida o eliminada. 
            Pero no te preocupes, ¡hay mucho más que explorar!
          </p>
          
          {/* Botones de acción */}
          <div style={{ 
            display: 'flex', 
            gap: spacing[4], 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            marginTop: spacing[8]
          }}>
            <button
              onClick={() => navigate(routes.app.home)}
              style={{
                padding: `${spacing[3]} ${spacing[8]}`,
                borderRadius: borderRadius.lg,
                background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
                color: colors.light,
                border: 'none',
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 4px 14px ${colors.primary[500]}40`,
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${colors.primary[500]}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = `0 4px 14px ${colors.primary[500]}40`;
              }}
            >
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                🏠 Volver al inicio
              </span>
            </button>
            
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: `${spacing[3]} ${spacing[8]}`,
                borderRadius: borderRadius.lg,
                background: 'transparent',
                color: colors.text.secondary,
                border: `2px solid ${colors.glass.medium}`,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.glass.medium;
                e.currentTarget.style.color = colors.light;
                e.currentTarget.style.borderColor = colors.primary[500];
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = colors.text.secondary;
                e.currentTarget.style.borderColor = colors.glass.medium;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                ← Página anterior
              </span>
            </button>
          </div>

          {/* Enlaces rápidos */}
          <div style={{
            marginTop: spacing[8],
            paddingTop: spacing[8],
            borderTop: `1px solid ${colors.glass.medium}`,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[3],
            alignItems: 'center'
          }}>
            <p style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              opacity: 0.7,
              margin: 0
            }}>
              O explora estas secciones:
            </p>
            <div style={{
              display: 'flex',
              gap: spacing[4],
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {[
                { label: 'Explorar', path: routes.app.explore, emoji: '🔍' },
                { label: 'Eventos', path: '/explore/list?type=fechas', emoji: '📅' },
                { label: 'Clases', path: '/explore/list?type=clases', emoji: '💃' }
              ].map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  style={{
                    padding: `${spacing[2]} ${spacing[4]}`,
                    borderRadius: borderRadius.md,
                    background: 'transparent',
                    color: colors.text.secondary,
                    border: `1px solid ${colors.glass.medium}`,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2]
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.glass.medium;
                    e.currentTarget.style.color = colors.light;
                    e.currentTarget.style.borderColor = colors.primary[500];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = colors.text.secondary;
                    e.currentTarget.style.borderColor = colors.glass.medium;
                  }}
                >
                  <span>{link.emoji}</span>
                  <span>{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de animación */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
