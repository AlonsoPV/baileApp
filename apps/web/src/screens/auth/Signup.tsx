import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { Button } from '@ui/index';
import { colors, typography, spacing, borderRadius, transitions } from '../../theme/colors';
import { isValidEmail, isValidPassword } from '../../utils/validation';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Email validation
    if (!isValidEmail(email)) {
      setError('Email inválido');
      showToast('Por favor ingresa un email válido', 'error');
      return;
    }

    // Password validation
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || 'Contraseña inválida');
      showToast(passwordValidation.error || 'Contraseña inválida', 'error');
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    setIsLoading(true);

    const { error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError.message);
      showToast('Error al crear la cuenta', 'error');
      setIsLoading(false);
    } else {
      showToast('¡Cuenta creada exitosamente! 🎉', 'success');
      // Navigation will be handled by RedirectIfAuthenticated
      navigate('/onboarding/basics');
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
            Crear Cuenta 🎉
          </h1>
          <p style={{ color: colors.text.medium }}>
            Únete a la comunidad de baile
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: spacing[3] }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: spacing[1],
                fontSize: '0.875rem',
                fontWeight: '600',
                color: colors.text.medium,
              }}
            >
              Email
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
                color: colors.text.light,
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
                color: colors.text.medium,
              }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: spacing[2],
                background: colors.glass.medium,
                border: `1px solid ${colors.glass.medium}`,
                borderRadius: borderRadius.md,
                color: colors.text.light,
                fontSize: '1rem',
              }}
              placeholder="••••••••"
            />
          </div>

          <div style={{ marginBottom: spacing[3] }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                marginBottom: spacing[1],
                fontSize: '0.875rem',
                fontWeight: '600',
                color: colors.text.medium,
              }}
            >
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: spacing[2],
                background: colors.glass.medium,
                border: `1px solid ${colors.glass.medium}`,
                borderRadius: borderRadius.md,
                color: colors.text.light,
                fontSize: '1rem',
              }}
              placeholder="••••••••"
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
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              marginBottom: spacing[3],
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? 'Creando cuenta...' : 'Registrarse'}
          </Button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: colors.text.medium }}>
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/auth/login"
            style={{
              color: colors.gradients.primary,
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

