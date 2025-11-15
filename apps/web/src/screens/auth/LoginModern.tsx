import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '../../components/Toast';
import { Button } from '@ui/index';
import { colors, typography, spacing, borderRadius, transitions } from '../../theme/colors';
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
      console.error('Error:', error);
      setError('Error inesperado');
      setIsSuccess(false);
      showToast('Error inesperado', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleMagicLink(false);
  };

  const handleSignUp = (e: FormEvent) => {
    e.preventDefault();
    handleMagicLink(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: ${typography.fontFamily.primary};
        }
        
        .login-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, ${colors.dark[500]} 0%, ${colors.dark[400]} 100%);
        }
        
        .login-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, ${colors.primary[500]}20 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${colors.secondary[500]}20 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, ${colors.accent[500]}10 0%, transparent 50%);
          animation: float 6s ease-in-out infinite;
        }
        
        .glass-card {
          background: ${colors.glass.light};
          backdrop-filter: blur(20px);
          border: 1px solid ${colors.glass.medium};
          box-shadow: ${colors.shadows.glass};
        }
        
        .gradient-text {
          background: ${colors.gradients.primary};
          -webkit-background-clip: text;
          background-clip: text;
        }
        
        .floating-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .shimmer-effect {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        .form-input {
          width: 100%;
          padding: ${spacing[4]};
          background: ${colors.glass.light};
          border: 1px solid ${colors.glass.medium};
          border-radius: ${borderRadius.lg};
          color: ${colors.gray[50]};
          font-size: ${typography.fontSize.base};
          transition: ${transitions.normal};
          backdrop-filter: blur(10px);
        }
        
        .form-input:focus {
          outline: none;
          border-color: ${colors.primary[500]};
          box-shadow: 0 0 0 3px ${colors.primary[500]}20;
        }
        
        .form-input::placeholder {
          color: ${colors.gray[400]};
        }
        
        .btn-primary {
          padding: ${spacing[4]} ${spacing[8]};
          background: ${colors.gradients.primary};
          border: none;
          border-radius: ${borderRadius.full};
          color: ${colors.gray[50]};
          font-size: ${typography.fontSize.lg};
          font-weight: ${typography.fontWeight.semibold};
          cursor: pointer;
          transition: ${transitions.normal};
          box-shadow: ${colors.shadows.glow};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${spacing[2]};
          min-width: 200px;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: ${colors.shadows.lg};
        }
        
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .btn-secondary {
          padding: ${spacing[4]} ${spacing[8]};
          background: ${colors.gradients.secondary};
          border: none;
          border-radius: ${borderRadius.full};
          color: ${colors.gray[50]};
          font-size: ${typography.fontSize.lg};
          font-weight: ${typography.fontWeight.semibold};
          cursor: pointer;
          transition: ${transitions.normal};
          box-shadow: ${colors.shadows.glow};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${spacing[2]};
          min-width: 200px;
        }
        
        .btn-secondary:hover {
          transform: translateY(-2px);
          box-shadow: ${colors.shadows.lg};
        }
        
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        @media (max-width: 768px) {
          .login-container {
            padding: ${spacing[4]} !important;
          }
          
          .login-form {
            padding: ${spacing[6]} !important;
          }
          
          .login-hero {
            padding: ${spacing[8]} !important;
          }
        }
      `}</style>
      
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        color: colors.gray[50],
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Elementos flotantes de fondo */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '100px',
          height: '100px',
          background: colors.gradients.primary,
          borderRadius: '50%',
          opacity: 0.1,
          animation: 'float 8s ease-in-out infinite',
          zIndex: 0
        }} />
        
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '60px',
          height: '60px',
          background: colors.gradients.secondary,
          borderRadius: '50%',
          opacity: 0.15,
          animation: 'float 6s ease-in-out infinite reverse',
          zIndex: 0
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: '80px',
          height: '80px',
          background: colors.gradients.deep,
          borderRadius: '50%',
          opacity: 0.1,
          animation: 'float 7s ease-in-out infinite',
          zIndex: 0
        }} />

        <div className="login-container" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[8],
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[8]
          }}>
            {/* Hero Section */}
            <motion.div
              className="login-hero"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                padding: spacing[12],
                textAlign: 'center',
                borderRadius: borderRadius['2xl'],
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Floating Elements */}
              <div style={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                width: '60px',
                height: '60px',
                background: colors.gradients.primary,
                borderRadius: '50%',
                animation: 'float 4s ease-in-out infinite',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${colors.glass.medium}`
              }} />
              
              <div style={{
                position: 'absolute',
                top: '30%',
                right: '15%',
                width: '40px',
                height: '40px',
                background: colors.gradients.secondary,
                borderRadius: '50%',
                animation: 'float 3s ease-in-out infinite reverse',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${colors.glass.medium}`
              }} />
              
              <div style={{
                position: 'absolute',
                bottom: '20%',
                left: '20%',
                width: '80px',
                height: '80px',
                background: colors.gradients.deep,
                borderRadius: '50%',
                animation: 'float 5s ease-in-out infinite',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${colors.glass.medium}`
              }} />

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                style={{ position: 'relative', zIndex: 2 }}
              >
                <h1 style={{
                  fontSize: typography.fontSize['5xl'],
                  fontWeight: typography.fontWeight.black,
                  background: colors.gradients.primary,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: spacing[6],
                  textShadow: `0 4px 20px ${colors.primary[500]}40`,
                  letterSpacing: '-0.02em'
                }}>
                  ¡Bienvenido!
                </h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  style={{
                    fontSize: typography.fontSize.xl,
                    opacity: 0.9,
                    marginBottom: spacing[8],
                    lineHeight: typography.lineHeight.relaxed,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.gray[100]
                  }}
                >
                  Únete a la comunidad de baile más vibrante. 
                  Descubre eventos, conecta con organizadores y maestros.
                </motion.p>
              </motion.div>
            </motion.div>

            {/* Login Form */}
            <motion.div
              className="login-form glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{
                padding: spacing[10],
                borderRadius: borderRadius['2xl']
              }}
            >
              <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[6]
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: spacing[2],
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.gray[50]
                  }}>
                    📧 Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="form-input"
                    disabled={isLoading}
                    required
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: spacing[3],
                      background: colors.error[500] + '20',
                      border: `1px solid ${colors.error[500]}`,
                      borderRadius: borderRadius.lg,
                      color: colors.error[500],
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium
                    }}
                  >
                    ❌ {error}
                  </motion.div>
                )}

                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: spacing[3],
                      background: colors.success[500] + '20',
                      border: `1px solid ${colors.success[500]}`,
                      borderRadius: borderRadius.lg,
                      color: colors.success[500],
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium
                    }}
                  >
                    ✅ {message}
                  </motion.div>
                )}

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing[4]
                }}>
                  <motion.button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: `2px solid ${colors.gray[300]}`,
                          borderTop: `2px solid ${colors.gray[50]}`,
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Enviando...
                      </>
                    ) : (
                      <>
                        🔗 Iniciar Sesión
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleSignUp}
                    className="btn-secondary"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: `2px solid ${colors.gray[300]}`,
                          borderTop: `2px solid ${colors.gray[50]}`,
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Enviando...
                      </>
                    ) : (
                      <>
                        ✨ Crear Cuenta
                      </>
                    )}
                  </motion.button>
                </div>
              </form>

              <div style={{
                marginTop: spacing[6],
                paddingTop: spacing[6],
                borderTop: `1px solid ${colors.glass.medium}`,
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.gray[300],
                  margin: 0,
                  marginBottom: spacing[4]
                }}>
                  Al continuar, aceptas nuestros términos de servicio
                </p>
                
                <Link
                  to="/explore"
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.primary[500],
                    textDecoration: 'none',
                    fontWeight: typography.fontWeight.medium,
                    padding: `${spacing[2]} ${spacing[4]}`,
                    borderRadius: borderRadius.lg,
                    background: colors.glass.light,
                    border: `1px solid ${colors.glass.medium}`,
                    transition: transitions.normal,
                    display: 'inline-block'
                  }}
                >
                  🔍 Explorar sin cuenta
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
