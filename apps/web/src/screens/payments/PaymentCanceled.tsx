import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PaymentCanceled() {
  const navigate = useNavigate();
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
    // Redirigir después de 5 segundos
    const timer = setTimeout(() => {
      navigate('/explore');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

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
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 20,
          background: 'rgba(239, 68, 68, 0.1)',
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
          ⚠️
        </div>
        <h1
          style={{
            marginBottom: '1rem',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#ef4444',
          }}
        >
          Pago cancelado
        </h1>
        <p
          style={{
            opacity: 0.9,
            marginBottom: '1.5rem',
            lineHeight: 1.6,
          }}
        >
          El proceso de pago fue cancelado. 
          No se realizó ningún cargo a tu tarjeta.
        </p>
        <p
          style={{
            opacity: 0.7,
            fontSize: '0.9rem',
            marginBottom: '2rem',
          }}
        >
          Si tienes alguna duda o necesitas ayuda, contáctanos.
        </p>
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
          onClick={() => navigate('/explore')}
          style={{
            padding: '0.75rem 2rem',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: 10,
            color: '#ef4444',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Volver al inicio
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

