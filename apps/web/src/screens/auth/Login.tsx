import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { Button } from '@ui/index';
import { colors, typography, spacing, borderRadius, transitions } from '../../theme/colors';
import { isValidEmail } from '../../utils/validation';
import { signInWithMagicLink, signUpWithMagicLink } from '../../utils/magicLinkAuth';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { motion } from 'framer-motion';
import { getAuthRedirectUrl, isMobileWebView } from '../../utils/authRedirect';

export function Login() {
  // Brand palette (requested): #297F96 + tonalidades
  const brand = {
    base: '#297F96',
    dark: '#1B5C6E',
    deep: '#0F3E4A',
    light: '#43A9C1',
    ice: '#7CE0F5',
  } as const;
  const brandGradientPrimary = `linear-gradient(135deg, ${brand.base} 0%, ${brand.light} 45%, ${brand.dark} 100%)`;
  const brandGradientSecondary = `linear-gradient(135deg, ${brand.deep} 0%, ${brand.dark} 60%, ${brand.base} 140%)`;

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [error, setError] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [signUpMessage, setSignUpMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  // Listen for errors coming from the native host (React Native WebView)
  useEffect(() => {
    const onNativeAuthError = (e: any) => {
      const msg = e?.detail?.message || 'No se pudo iniciar sesión.';
      setError(msg);
      setSignUpError(msg);
      setIsGoogleLoading(false);
      setIsAppleLoading(false);
      showToast(msg, 'error');
    };
    window.addEventListener('baileapp:native-auth-error', onNativeAuthError as any);
    return () => window.removeEventListener('baileapp:native-auth-error', onNativeAuthError as any);
  }, [showToast]);

  const handleMagicLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Protección contra doble submit
    if (isLoading) {
      console.warn('[Login] Intento de doble submit bloqueado');
      return;
    }

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
      const result = await signInWithMagicLink(email);

      if (result.success) {
        setMessage(result.message);
        setIsSuccess(true);
        showToast(result.message, 'success');
      } else {
        // Manejar mensaje de rate limit específicamente
        const errorMessage = (result as any)?.message || 'Error al enviar el enlace mágico';
        setError(errorMessage);
        setIsSuccess(false);
        showToast(errorMessage, 'error');
      }
    } catch (error: any) {
      // Verificar si es rate limit
      if (error?.status === 429 || error?.message?.includes('rate limit') || error?.message?.includes('email rate limit')) {
        const rateLimitMessage = 'El servicio de emails está temporalmente limitado. Por favor usa "Continuar con Apple" o "Continuar con Google" para iniciar sesión, o contacta al administrador si el problema persiste.';
        setError(rateLimitMessage);
        showToast(rateLimitMessage, 'error');
      } else {
        console.error('[Login] Unexpected error:', error);
        setError('Error inesperado. Intenta de nuevo.');
        showToast('Error inesperado. Intenta de nuevo.', 'error');
      }
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpMagicLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Protección contra doble submit
    if (isSignUpLoading) {
      console.warn('[Login] Intento de doble submit bloqueado (signup)');
      return;
    }

    if (!signUpEmail.trim()) {
      setSignUpError('Por favor ingresa tu email');
      setIsSignUpSuccess(false);
      return;
    }

    if (!isValidEmail(signUpEmail)) {
      setSignUpError('Email inválido');
      setIsSignUpSuccess(false);
      return;
    }

    setIsSignUpLoading(true);
    setSignUpError('');
    setSignUpMessage('');

    try {
      const result = await signUpWithMagicLink(signUpEmail);

      if (result.success) {
        setSignUpMessage(result.message);
        setIsSignUpSuccess(true);
        showToast(result.message, 'success');
      } else {
        // Manejar mensaje de rate limit específicamente
        const errorMessage = (result as any)?.message || 'Error al enviar el enlace mágico';
        setSignUpError(errorMessage);
        setIsSignUpSuccess(false);
        showToast(errorMessage, 'error');
      }
    } catch (error: any) {
      // Verificar si es rate limit
      if (error?.status === 429 || error?.message?.includes('rate limit') || error?.message?.includes('email rate limit')) {
        const rateLimitMessage = 'El servicio de emails está temporalmente limitado. Por favor usa "Continuar con Apple" o "Continuar con Google" para registrarte, o contacta al administrador si el problema persiste.';
        setSignUpError(rateLimitMessage);
        showToast(rateLimitMessage, 'error');
      } else {
        console.error('[Login] Unexpected error (signup):', error);
        setSignUpError('Error inesperado. Intenta de nuevo.');
        showToast('Error inesperado. Intenta de nuevo.', 'error');
      }
      setIsSignUpSuccess(false);
    } finally {
      setIsSignUpLoading(false);
    }
  };

  const handleGoogleAuth = async (isSignUp: boolean = false) => {
    setIsGoogleLoading(true);
    setError('');
    setSignUpError('');

    try {
      // ✅ Guideline 4.0: in-app auth inside React Native WebView (no browser OAuth)
      if (isMobileWebView()) {
        const rn = (window as any).ReactNativeWebView;
        // En algunos builds (especialmente Android) puede no existir un bridge nativo.
        // En ese caso, hacer fallback al OAuth web normal.
        if (!rn?.postMessage) {
          console.warn('[Login] No native bridge for Google; falling back to web OAuth');
        } else {
          const requestId =
            (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
              ? (crypto as any).randomUUID()
              : `g_${Date.now()}_${Math.random().toString(16).slice(2)}`;
          console.log('[Login] NATIVE_AUTH_GOOGLE requestId=', requestId);
          rn.postMessage(JSON.stringify({ type: 'NATIVE_AUTH_GOOGLE', requestId }));
          return; // native will set web session + redirect
        }
      }

      const redirectTo = getAuthRedirectUrl();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }

      // El flujo de OAuth redirige automáticamente, así que no necesitamos hacer nada más
      // El callback manejará la redirección después de la autenticación
    } catch (err: any) {
      console.error('[Login] Google OAuth error', err);
      const msg = err?.message ?? 'Error al iniciar sesión con Google.';
      if (isSignUp) {
        setSignUpError(msg);
        showToast(msg, 'error');
      } else {
        setError(msg);
        showToast(msg, 'error');
      }
      setIsGoogleLoading(false);
    }
  };

  const handleAppleAuth = async (isSignUp: boolean = false) => {
    setIsAppleLoading(true);
    setError('');
    setSignUpError('');

    try {
      // ✅ Guideline 4.0: in-app auth inside React Native WebView (no browser OAuth)
      if (isMobileWebView()) {
        const rn = (window as any).ReactNativeWebView;
        // En algunos builds (especialmente Android) puede no existir un bridge nativo.
        // En ese caso, hacer fallback al OAuth web normal.
        if (!rn?.postMessage) {
          console.warn('[Login] No native bridge for Apple; falling back to web OAuth');
        } else {
          rn.postMessage(JSON.stringify({ type: 'NATIVE_AUTH_APPLE' }));
          return; // native will set web session + redirect
        }
      }

      const redirectTo = getAuthRedirectUrl();
      
      // Configuración para mantener el flujo dentro del WebView
      const oauthOptions: any = {
        redirectTo,
        // Apple supports requesting email + name. Supabase will only receive what's granted by the user.
        scopes: 'email name',
      };

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: oauthOptions,
      });

      if (error) throw error;
      
      // OAuth flow redirects automatically
    } catch (err: any) {
      console.error('[Login] Apple OAuth error', err);
      const msg = err?.message ?? 'Error al iniciar sesión con Apple.';
      if (isSignUp) {
        setSignUpError(msg);
        showToast(msg, 'error');
      } else {
        setError(msg);
        showToast(msg, 'error');
      }
      setIsAppleLoading(false);
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
      const { data, error } = await signIn(email.trim(), password);

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
    <>
      <style>{`
          @media (max-width: 768px) {
            .login-grid {
              grid-template-columns: 1fr !important;
            }
            .login-home-button {
              top: ${spacing[2]} !important;
              right: ${spacing[2]} !important;
              padding: ${spacing[1]} ${spacing[2]} !important;
              font-size: 0.75rem !important;
            }
          }
          @media (max-width: 480px) {
            .login-home-button {
              top: ${spacing[1]} !important;
              right: ${spacing[1]} !important;
              padding: ${spacing[1]} ${spacing[2]} !important;
              font-size: 0.7rem !important;
            }
          }
          .tab-button {
            transition: all 0.3s ease;
          }
          .tab-button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }
      `}</style>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${brand.deep} 0%, ${brand.dark} 45%, ${brand.base} 100%)`,
          padding: spacing[4],
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '500px',
          }}
        >
          {/* Pestañas */}
          <div style={{ 
            display: 'flex', 
            gap: spacing[2], 
            marginBottom: spacing[4],
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: borderRadius.lg,
            padding: spacing[1],
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              style={{
                flex: 1,
                padding: spacing[3],
                borderRadius: borderRadius.md,
                border: 'none',
                background: activeTab === 'login' 
                  ? brandGradientPrimary
                  : 'transparent',
                color: activeTab === 'login' ? '#fff' : colors.gray[400],
                fontSize: '1rem',
                fontWeight: activeTab === 'login' ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              🔓 Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              style={{
                flex: 1,
                padding: spacing[3],
                borderRadius: borderRadius.md,
                border: 'none',
                background: activeTab === 'signup' 
                  ? brandGradientSecondary
                  : 'transparent',
                color: activeTab === 'signup' ? '#fff' : colors.gray[400],
                fontSize: '1rem',
                fontWeight: activeTab === 'signup' ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              ✨ Crear Cuenta
            </button>
          </div>

          {/* Contenido de las pestañas */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: colors.glass.light,
              borderRadius: borderRadius['2xl'],
              padding: spacing[4],
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              position: 'relative',
            }}
          >
            {/* Botón para ir a inicio */}
            <button
              type="button"
              className="login-home-button"
              onClick={() => navigate('/')}
              style={{
                position: 'absolute',
                top: spacing[3],
                right: spacing[3],
                padding: `${spacing[2]} ${spacing[3]}`,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: borderRadius.md,
                color: colors.gray[200],
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[1],
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🏠 Ir a inicio
            </button>
          {/* Pestaña: Inicio de Sesión */}
          {activeTab === 'login' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: spacing[1], color: colors.gray[100] }}>
                  🔓 Iniciar Sesión
                </h2>
                <p style={{ color: colors.gray[400], fontSize: '0.9rem' }}>
                  Accede a tu cuenta
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
                type="button"
                onClick={() => handleAppleAuth(false)}
                disabled={(activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading || isAppleLoading}
                style={{
                  width: '100%',
                  opacity: (activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading || isAppleLoading ? 0.5 : 1,
                  background: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2],
                  fontWeight: 700,
                }}
              >
                {isAppleLoading ? (
                  '⏳ Conectando...'
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continuar con Apple
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={() => handleGoogleAuth(false)}
                disabled={(activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading || isAppleLoading}
                style={{
                  width: '100%',
                  opacity: (activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading || isAppleLoading ? 0.5 : 1,
                  background: '#FFFFFF',
                  color: '#1F2937',
                  border: '1px solid rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2],
                  fontWeight: 600,
                }}
              >
                {isGoogleLoading ? (
                  '⏳ Conectando...'
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z"
                        fill="#4285F4"
                      />
                      <path
                        d="M9 18C11.43 18 13.467 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65454 14.4204 4.67181 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48181 18 9 18Z"
                        fill="#34A853"
                      />
                      <path
                        d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40681 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65455 3.57955 9 3.57955Z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continuar con Google
                  </>
                )}
              </Button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  margin: `${spacing[2]} 0`,
                  color: colors.gray[400],
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <span>o</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              </div>

              <Button
                type="submit"
                disabled={(activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading}
                style={{
                  width: '100%',
                  opacity: (activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading ? 0.5 : 1,
                  background: brandGradientPrimary,
                }}
              >
                {isLoading ? '⏳ Verificando...' : '🔓 Entrar con contraseña'}
              </Button>

              <Button
                type="button"
                onClick={handleMagicLink}
                disabled={(activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading}
                style={{
                  width: '100%',
                  opacity: (activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading ? 0.5 : 1,
                  background: brandGradientSecondary,
                }}
              >
                {isLoading ? '⏳ Enviando...' : '📬 Enlace de inicio'}
              </Button>
            </div>
          </form>
          </>
          )}

          {/* Pestaña: Crear Cuenta */}
          {activeTab === 'signup' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: spacing[1], color: colors.gray[100] }}>
                  ✨ Crear Cuenta
                </h2>
                <p style={{ color: colors.gray[400], fontSize: '0.9rem' }}>
                  Únete a nuestra comunidad
                </p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSignUpMagicLink(e); }}>
            <div style={{ marginBottom: spacing[3] }}>
              <label
                htmlFor="signup-email"
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
                id="signup-email"
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
                disabled={isSignUpLoading}
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

            {signUpError && (
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
                ❌ {signUpError}
              </div>
            )}

            {signUpMessage && (
              <div
                style={{
                  marginBottom: spacing[3],
                  padding: spacing[2],
                  background: isSignUpSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${isSignUpSuccess ? '#10B981' : '#EF4444'}`,
                  borderRadius: borderRadius.md,
                  color: isSignUpSuccess ? '#10B981' : '#EF4444',
                  fontSize: '0.875rem',
                }}
              >
                {isSignUpSuccess ? '✅' : '❌'} {signUpMessage}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], marginBottom: spacing[3] }}>
              <Button
                type="button"
                onClick={() => handleGoogleAuth(true)}
                disabled={(activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading || isAppleLoading}
                style={{
                  width: '100%',
                  opacity: (activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading || isAppleLoading ? 0.5 : 1,
                  background: '#FFFFFF',
                  color: '#1F2937',
                  border: '1px solid rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2],
                  fontWeight: 600,
                }}
              >
                {isGoogleLoading ? (
                  '⏳ Conectando...'
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z"
                        fill="#4285F4"
                      />
                      <path
                        d="M9 18C11.43 18 13.467 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65454 14.4204 4.67181 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48181 18 9 18Z"
                        fill="#34A853"
                      />
                      <path
                        d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40681 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65455 3.57955 9 3.57955Z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continuar con Google
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={() => handleAppleAuth(true)}
                disabled={(activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading || isAppleLoading}
                style={{
                  width: '100%',
                  opacity: (activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading || isAppleLoading ? 0.5 : 1,
                  background: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2],
                  fontWeight: 700,
                }}
              >
                {isAppleLoading ? (
                  '⏳ Conectando...'
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continuar con Apple
                  </>
                )}
              </Button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  margin: `${spacing[2]} 0`,
                  color: colors.gray[400],
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <span>o</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              </div>

              <Button
                type="button"
                onClick={handleSignUpMagicLink}
                disabled={(activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading}
                style={{
                  width: '100%',
                  opacity: (activeTab === 'login' ? isLoading : isSignUpLoading) || isGoogleLoading ? 0.5 : 1,
                  background: colors.gradients.tertiary ?? colors.gradients.secondary,
                }}
              >
                {isSignUpLoading ? '⏳ Enviando...' : '✨ Enlace de registro'}
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
              <p style={{ margin: 0, fontSize: '0.8rem', marginBottom: spacing[1] }}>
                💡 <strong>Con Google, Apple o enlace mágico no necesitas contraseña.</strong>
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>
                Si deseas iniciar sesión con email y contraseña después, podrás establecerla en tu perfil (si iniciaste con Google o Apple, también podrás configurar una contraseña).
              </p>
            </div>
          </form>
          </>
          )}
          </motion.div>
        </div>
      </div>
    </>
  );
}

