import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { Button } from '@ui/index';
import { theme } from '@theme/colors';
import { isValidEmail } from '../../utils/validation';
import { signInWithMagicLink, signUpWithMagicLink } from '../../utils/magicLinkAuth';

export function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleMagicLink = async (isSignUp: boolean = false) => {
    if (!email.trim()) {
      setError('Por favor ingresa tu email');
      setIsSuccess(false);
      return;
    }

    if (!isValidEmail(email)) {
      setError('Email inválido');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const result = isSignUp 
        ? await signUpWithMagicLink(email)
        : await signInWithMagicLink(email);

      if (result.success) {
        setMessage(result.message);
        setIsSuccess(true);
        showToast(result.message, 'success');
      } else {
        setError('Error al enviar el enlace mágico');
        setIsSuccess(false);
        showToast('Error al enviar el enlace mágico', 'error');
      }
    } catch (error) {
      setError('Error inesperado. Intenta de nuevo.');
      setIsSuccess(false);
      showToast('Error inesperado. Intenta de nuevo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.bg.app,
        padding: theme.spacing(2),
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: theme.bg.card,
          borderRadius: theme.radius.xl,
          padding: theme.spacing(4),
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: theme.spacing(4) }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: theme.spacing(1) }}>
            ¡Bienvenido! 💃
          </h1>
          <p style={{ color: theme.text.secondary }}>
            Accede con tu email - Sin contraseñas
          </p>
        </div>
          <div style={{ marginBottom: theme.spacing(3) }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: theme.spacing(1),
                fontSize: '0.875rem',
                fontWeight: '600',
                color: theme.text.secondary,
              }}
            >
              📧 Tu Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: theme.spacing(2),
                background: theme.bg.surface,
                border: `1px solid ${theme.palette.gray3}`,
                borderRadius: theme.radius.md,
                color: theme.text.primary,
                fontSize: '1rem',
              }}
              placeholder="tu@email.com"
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: theme.spacing(3),
                padding: theme.spacing(2),
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: theme.radius.md,
                color: '#ef4444',
                fontSize: '0.875rem',
              }}
            >
              ❌ {error}
            </div>
          )}

          {message && (
            <div
              style={{
                marginBottom: theme.spacing(3),
                padding: theme.spacing(2),
                background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${isSuccess ? '#10B981' : '#EF4444'}`,
                borderRadius: theme.radius.md,
                color: isSuccess ? '#10B981' : '#EF4444',
                fontSize: '0.875rem',
              }}
            >
              {isSuccess ? '✅' : '❌'} {message}
            </div>
          )}

          <div style={{ display: 'flex', gap: theme.spacing(2), marginBottom: theme.spacing(3) }}>
            <Button
              onClick={() => handleMagicLink(false)}
              disabled={isLoading}
              style={{
                flex: 1,
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {isLoading ? '⏳ Enviando...' : '🔑 Iniciar Sesión'}
            </Button>

            <Button
              onClick={() => handleMagicLink(true)}
              disabled={isLoading}
              style={{
                flex: 1,
                opacity: isLoading ? 0.5 : 1,
                background: theme.brand.secondary,
              }}
            >
              {isLoading ? '⏳ Enviando...' : '✨ Registrarse'}
            </Button>
          </div>

        <div style={{ 
          textAlign: 'center', 
          fontSize: '0.875rem', 
          color: theme.text.secondary,
          marginTop: theme.spacing(3),
          padding: theme.spacing(2),
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: theme.radius.md,
        }}>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>
            💡 Te enviaremos un enlace mágico a tu email.<br/>
            Haz clic en el enlace para acceder sin contraseña.
          </p>
        </div>
      </div>
    </div>
  );
}

