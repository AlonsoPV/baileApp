import React, { useEffect, useState } from 'react';

interface RefreshingIndicatorProps {
  isFetching: boolean;
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  message?: string;
  autoHide?: boolean;
  hideDelay?: number;
}

/**
 * Indicador discreto de actualización/refetch
 * No bloquea la UI, solo muestra que hay una actualización en curso
 */
export function RefreshingIndicator({
  isFetching,
  position = 'top-right',
  message = 'Actualizando...',
  autoHide = true,
  hideDelay = 2000,
}: RefreshingIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isFetching) {
      setVisible(true);
    } else if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, hideDelay);
      return () => clearTimeout(timer);
    }
  }, [isFetching, autoHide, hideDelay]);

  if (!visible && !isFetching) return null;

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-right': { top: '1rem', right: '1rem' },
    'top-left': { top: '1rem', left: '1rem' },
    'top-center': { top: '1rem', left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { bottom: '1rem', right: '1rem' },
    'bottom-left': { bottom: '1rem', left: '1rem' },
    'bottom-center': { bottom: '1rem', left: '50%', transform: 'translateX(-50%)' },
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        padding: '0.5rem 1rem',
        background: 'rgba(30, 136, 229, 0.95)',
        color: 'white',
        borderRadius: '999px',
        fontSize: '0.875rem',
        fontWeight: 600,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: visible ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-out',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '12px',
          height: '12px',
          border: '2px solid white',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span>{message}</span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: ${position.includes('top') ? 'translateY(-10px)' : 'translateY(10px)'};
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: ${position.includes('top') ? 'translateY(-10px)' : 'translateY(10px)'};
          }
        }
      `}</style>
    </div>
  );
}

export default RefreshingIndicator;

