import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';

export default function StripeOnboardingSuccess() {
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
    // Invalidar queries para refrescar datos de Stripe
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['academy', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['organizer', 'me'] });
    }

    // Redirigir después de 3 segundos
    const timer = setTimeout(() => {
      // Intentar redirigir a la página de edición de perfil según el rol
      const from = searchParams.get('from');
      
      if (from === 'academia' || from === 'academy') {
        navigate('/profile/academy/edit');
      } else if (from === 'maestro' || from === 'teacher') {
        navigate('/profile/teacher/edit');
      } else if (from === 'organizador' || from === 'organizer') {
        navigate('/profile/organizer/edit');
      } else {
        // Por defecto, ir al editor de perfil
        navigate('/profile/edit');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, queryClient, user?.id, searchParams]);

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
          Cuenta de Stripe conectada exitosamente
        </h1>
        <p
          style={{
            opacity: 0.9,
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          Tu cuenta ha sido verificada y está lista para recibir pagos.
          Ya puedes cobrar por tus clases y eventos.
        </p>
        <div
          style={{
            opacity: 0.7,
            fontSize: '0.9rem',
          }}
        >
          Redirigiendo a tu perfil...
        </div>
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

