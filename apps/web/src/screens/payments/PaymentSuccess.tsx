import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Normalizar URL si tiene doble barra
  useEffect(() => {
    if (location.pathname.includes('//')) {
      const normalizedPath = location.pathname.replace(/\/+/g, '/');
      navigate(normalizedPath + location.search, { replace: true });
      return;
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    // Invalidar queries para refrescar datos de reservas/pagos
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['clase_asistencias'] });
      queryClient.invalidateQueries({ queryKey: ['event_rsvp'] });
      queryClient.invalidateQueries({ queryKey: ['my-rsvps'] });
    }

    // Redirigir después de 5 segundos
    const timer = setTimeout(() => {
      // Intentar redirigir según el origen del pago
      const origin = searchParams.get('origin') || 'clase';
      
      if (origin === 'clase') {
        // Redirigir a las clases del usuario o al explore
        navigate('/explore');
      } else if (origin === 'fecha') {
        // Redirigir a los eventos del usuario
        navigate('/me/rsvps');
      } else {
        // Por defecto, ir al explore
        navigate('/explore');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, queryClient, user?.id, searchParams]);

  const sessionId = searchParams.get('session_id');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #0b0d10 0%, #1a1d24 100%)',
        color: '#e5e7eb',
        padding: 20,
      }}
    >
      <div
        style={{
          padding: '3rem 2rem',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 20,
          background: 'rgba(34, 197, 94, 0.1)',
          textAlign: 'center',
          maxWidth: 500,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            fontSize: '4rem',
            marginBottom: '1.5rem',
            animation: 'scaleIn 0.5s ease-out',
          }}
        >
          ✅
        </div>
        <h1
          style={{
            marginBottom: '1rem',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#22c55e',
          }}
        >
          ¡Pago realizado exitosamente!
        </h1>
        <p
          style={{
            opacity: 0.9,
            marginBottom: '1.5rem',
            lineHeight: 1.6,
          }}
        >
          Tu pago ha sido procesado correctamente. 
          Recibirás un correo de confirmación con los detalles de tu compra.
        </p>
        {sessionId && (
          <div
            style={{
              opacity: 0.6,
              fontSize: '0.75rem',
              marginBottom: '1.5rem',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}
          >
            ID de sesión: {sessionId}
          </div>
        )}
        <div
          style={{
            opacity: 0.7,
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}
        >
          Redirigiendo en unos segundos...
        </div>
        <button
          onClick={() => {
            const origin = searchParams.get('origin') || 'clase';
            if (origin === 'fecha') {
              navigate('/me/rsvps');
            } else {
              navigate('/explore');
            }
          }}
          style={{
            padding: '0.75rem 2rem',
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            borderRadius: 10,
            color: '#22c55e',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Continuar
        </button>
      </div>

      <style>
        {`
          @keyframes scaleIn {
            from {
              transform: scale(0);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

