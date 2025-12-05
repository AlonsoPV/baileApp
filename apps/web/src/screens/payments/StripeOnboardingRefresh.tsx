import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';

export default function StripeOnboardingRefresh() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    // Invalidar queries para refrescar datos
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['academy', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['organizer', 'me'] });
    }

    // Mensaje informativo y redirigir
    const timer = setTimeout(() => {
      navigate('/profile/edit');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, queryClient, user?.id]);

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
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: 20,
          background: 'rgba(251, 191, 36, 0.1)',
          textAlign: 'center',
          maxWidth: 500,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            fontSize: '4rem',
            marginBottom: '1.5rem',
          }}
        >
          🔄
        </div>
        <h1
          style={{
            marginBottom: '1rem',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#fbbf24',
          }}
        >
          Actualizando información
        </h1>
        <p
          style={{
            opacity: 0.9,
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          Estamos actualizando el estado de tu cuenta de Stripe.
          Esto puede tomar unos momentos.
        </p>
        <div
          style={{
            opacity: 0.7,
            fontSize: '0.9rem',
          }}
        >
          Redirigiendo...
        </div>
      </div>
    </div>
  );
}

