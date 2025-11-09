import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Button } from '@ui/index';
import { colors, typography, spacing, borderRadius, transitions } from '../../theme/colors';
import { isValidEmail } from '../../utils/validation';
import { signInWithMagicLink, signUpWithMagicLink } from '../../utils/magicLinkAuth';
import { supabase } from '../../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handlePasswordLogin = async (e?: FormEvent) => {
    if (e) e.preventDefault();

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

    if (!password.trim()) {
      setError('Por favor ingresa tu contraseña');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        showToast('Inicio de sesión exitoso ✅', 'success');
        navigate('/app/profile');
      } else {
        setError('No pudimos iniciar sesión. Revisa tus credenciales.');
        showToast('No pudimos iniciar sesión. Revisa tus credenciales.', 'error');
      }
    } catch (err: any) {
      console.error('[Login] Password sign-in error', err);
      const msg = err?.message ?? 'Error al iniciar sesión con contraseña.';
      setError(msg);
      showToast(msg, 'error');
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
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        padding: spacing[2],
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: colors.glass.light,
          borderRadius: borderRadius['2xl'],
          padding: spacing[4],
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: spacing[1] }}>
            ¡Bienvenido! 💃
          </h1>
          <p style={{ color: colors.gray[400] }}>
            Accede con tu email o contraseña
          </p>
        </div>
        <form onSubmit={handlePasswordLogin}>
          <div style={{ marginBottom: spacing[3] }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: spacing[1],
                fontSize: '0.875rem',
                fontWeight: '600',
                color: colors.gray[400],
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
                padding: spacing[2],
                background: colors.glass.medium,
                border: `1px solid ${colors.glass.medium}`,
                borderRadius: borderRadius.md,
                color: colors.gray[200],
                fontSize: '1rem',
              }}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ marginBottom: spacing[3] }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: spacing[1],
                fontSize: '0.875rem',
                fontWeight: '600',
                color: colors.gray[400],
              }}
            >
              🔒 Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: spacing[2],
                background: colors.glass.medium,
                border: `1px solid ${colors.glass.medium}`,
                borderRadius: borderRadius.md,
                color: colors.gray[200],
                fontSize: '1rem',
              }}
              placeholder="Tu contraseña segura"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: spacing[3],
                padding: spacing[2],
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: borderRadius.md,
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
                marginBottom: spacing[3],
                padding: spacing[2],
                background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${isSuccess ? '#10B981' : '#EF4444'}`,
                borderRadius: borderRadius.md,
                color: isSuccess ? '#10B981' : '#EF4444',
                fontSize: '0.875rem',
              }}
            >
              {isSuccess ? '✅' : '❌'} {message}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], marginBottom: spacing[3] }}>
            <Button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                opacity: isLoading ? 0.5 : 1,
                background: colors.gradients.primary,
              }}
            >
              {isLoading ? '⏳ Verificando...' : '🔓 Entrar con contraseña'}
            </Button>

            <Button
              onClick={() => handleMagicLink(false)}
              disabled={isLoading}
              style={{
                width: '100%',
                opacity: isLoading ? 0.5 : 1,
                background: colors.gradients.secondary,
              }}
            >
              {isLoading ? '⏳ Enviando...' : '📬 Enlace mágico'}
            </Button>

            <Button
              onClick={() => handleMagicLink(true)}
              disabled={isLoading}
              style={{
                width: '100%',
                opacity: isLoading ? 0.5 : 1,
                background: colors.gradients.tertiary ?? colors.gradients.secondary,
              }}
            >
              {isLoading ? '⏳ Enviando...' : '✨ Registrarse'}
            </Button>
          </div>

          <div
            style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              color: colors.gray[400],
              marginTop: spacing[3],
              padding: spacing[2],
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.md,
            }}
          >
            <p style={{ margin: 0, fontSize: '0.8rem' }}>
              💡 Usa tu contraseña o solicita un enlace mágico directo a tu email.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

