import React from 'react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
}

export default function LoadingScreen({ 
  message = 'Cargando...', 
  submessage 
}: LoadingScreenProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        padding: '2rem',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        {/* Spinner */}
        <div
          style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTop: '4px solid #f472b6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px',
          }}
        />

        {/* Mensaje principal */}
        <h2
          style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: submessage ? '8px' : 0,
            fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          {message}
        </h2>

        {/* Mensaje secundario (opcional) */}
        {submessage && (
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            {submessage}
          </p>
        )}

        {/* Animación del spinner */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

