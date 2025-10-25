import React, { createContext, useContext, useState, useCallback } from 'react';
import { colors, typography, spacing, borderRadius, transitions } from '../theme/colors';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const typeStyles: Record<ToastType, { bg: string; border: string; color: string }> = {
    success: {
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.4)',
      color: '#10b981',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.4)',
      color: '#ef4444',
    },
    info: {
      bg: 'rgba(30, 136, 229, 0.15)',
      border: 'rgba(30, 136, 229, 0.4)',
      color: colors.blue,
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: '400px',
        }}
      >
        {toasts.map((toast) => {
          const styles = typeStyles[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                background: styles.bg,
                border: `1px solid ${styles.border}`,
                borderRadius: borderRadius.md,
                padding: spacing[2],
                color: styles.color,
                fontSize: '0.875rem',
                fontWeight: '500',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                animation: 'slideInRight 0.3s ease-out',
              }}
            >
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: styles.color,
                  fontSize: '1.25rem',
                  padding: '0',
                  lineHeight: '1',
                  opacity: 0.7,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Animation */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

