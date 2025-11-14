import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithMagicLink, signUpWithMagicLink } from '../../utils/magicLinkAuth';

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function MagicLinkLogin() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleMagicLink = async (isSignUp: boolean = false) => {
    if (!email.trim()) {
      setMessage('Por favor ingresa tu email');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = isSignUp 
        ? await signUpWithMagicLink(email)
        : await signInWithMagicLink(email);

      if (result.success) {
        setMessage(result.message);
        setIsSuccess(true);
      } else {
        setMessage('Error al enviar el enlace mágico');
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('Error inesperado. Intenta de nuevo.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #1E88E5 0%, #FF3D57 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🎭 Dónde Bailar
          </h1>
          <p style={{ opacity: 0.8, fontSize: '1rem' }}>
            Accede con tu email - Sin contraseñas
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            fontSize: '0.9rem'
          }}>
            📧 Tu Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: colors.light,
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMagicLink(false)}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: isLoading ? `${colors.light}33` : colors.blue,
              color: colors.light,
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isLoading ? '⏳ Enviando...' : '🔑 Iniciar Sesión'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMagicLink(true)}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: isLoading ? `${colors.light}33` : colors.coral,
              color: colors.light,
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isLoading ? '⏳ Enviando...' : '✨ Registrarse'}
          </motion.button>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '1rem',
              background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${isSuccess ? '#10B981' : '#EF4444'}`,
              borderRadius: '8px',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}
          >
            {isSuccess ? '✅' : '❌'} {message}
          </motion.div>
        )}

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          opacity: 0.7,
          textAlign: 'center'
        }}>
          <p style={{ margin: 0 }}>
            💡 Te enviaremos un enlace mágico a tu email.<br/>
            Haz clic en el enlace para acceder sin contraseña.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
