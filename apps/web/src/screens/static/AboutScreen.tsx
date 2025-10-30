import React from 'react';

export default function AboutScreen() {
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
          }}>Contáctanos</h1>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          padding: 20,
        }}>
          <p>¿Tienes dudas o sugerencias? Escríbenos:</p>
          <ul style={{ lineHeight: 1.9 }}>
            <li>Email: contacto@baileapp.com</li>
            <li>WhatsApp: +52 55 0000 0000</li>
            <li>Instagram: @baileapp</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


