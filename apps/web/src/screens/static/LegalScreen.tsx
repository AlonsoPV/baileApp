import React from 'react';

export default function LegalScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #0b1020 100%)',
      color: '#e5e7eb',
      padding: '32px 16px'
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 800,
            background: 'linear-gradient(90deg,#f093fb,#FFD166)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Aviso de privacidad y Términos y Condiciones</h1>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          padding: 20,
          lineHeight: 1.7
        }}>
          <h2 style={{ fontSize: '1.125rem' }}>Aviso de privacidad</h2>
          <p>Este es un texto de ejemplo de aviso de privacidad (lorem ipsum).</p>
          <h2 style={{ fontSize: '1.125rem', marginTop: 16 }}>Términos y condiciones</h2>
          <p>Este es un texto de ejemplo de términos y condiciones (lorem ipsum).</p>
        </div>
      </div>
    </div>
  );
}


