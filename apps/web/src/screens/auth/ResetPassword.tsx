import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { updatePassword } from '@/utils/passwordReset';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Verificar si hay un token en la URL
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    // Cuando Supabase redirige con un token de recovery, 
    // el token se procesa automáticamente al acceder a la URL
    // Solo necesitamos verificar que el usuario esté autenticado
    const checkSession = async () => {
      try {
        // Esperar un momento para que Supabase procese el token
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error obteniendo sesión:', error);
          setError('Error al verificar el enlace de recuperación.');
          setVerifying(false);
          return;
        }

        if (session) {
          console.log('Usuario autenticado para reset de contraseña');
          setVerifying(false);
        } else if (token && type === 'recovery') {
          // Si hay token pero no hay sesión, intentar verificar el token
          console.log('Intentando verificar token de recovery...');
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          });
          
          if (verifyError) {
            console.error('Error verificando token:', verifyError);
            setError('El enlace de recuperación no es válido o ha expirado.');
            setVerifying(false);
          } else {
            console.log('Token verificado correctamente:', data);
            setVerifying(false);
          }
        } else {
          setError('No se encontró un enlace de recuperación válido.');
          setVerifying(false);
        }
      } catch (err) {
        console.error('Error al verificar:', err);
        setError('Error al verificar el enlace de recuperación.');
        setVerifying(false);
      }
    };

    checkSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(password);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      } else {
        setError(result.error?.message || 'Error al actualizar la contraseña.');
      }
    } catch (err: any) {
      console.error('Error al actualizar contraseña:', err);
      setError(err?.message || 'Error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'grid', 
        placeItems: 'center', 
        background: '#0b0d10', 
        color: '#e5e7eb',
        padding: 20
      }}>
        <div style={{ 
          padding: 24, 
          border: '1px solid rgba(255,255,255,0.12)', 
          borderRadius: 12,
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: 16 }}>Verificando enlace de recuperación...</div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'grid', 
        placeItems: 'center', 
        background: '#0b0d10', 
        color: '#e5e7eb',
        padding: 20
      }}>
        <div style={{ 
          padding: 24, 
          border: '1px solid rgba(0,255,0,0.3)', 
          borderRadius: 12,
          background: 'rgba(0,255,0,0.1)',
          textAlign: 'center',
          maxWidth: 400
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 16 }}>✅</div>
          <div style={{ marginBottom: 16, fontSize: '1.2rem', fontWeight: 700 }}>
            Contraseña actualizada
          </div>
          <div style={{ opacity: 0.8 }}>
            Tu contraseña ha sido actualizada correctamente. Redirigiendo al login...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'grid', 
      placeItems: 'center', 
      background: '#0b0d10', 
      color: '#e5e7eb',
      padding: 20
    }}>
      <div style={{ 
        padding: 32, 
        border: '1px solid rgba(255,255,255,0.12)', 
        borderRadius: 16,
        background: 'rgba(255,255,255,0.03)',
        maxWidth: 400,
        width: '100%'
      }}>
        <h1 style={{ 
          margin: '0 0 24px 0', 
          fontSize: '1.8rem', 
          fontWeight: 900,
          textAlign: 'center'
        }}>
          Restablecer Contraseña
        </h1>

        {error && (
          <div style={{
            padding: 12,
            marginBottom: 20,
            borderRadius: 8,
            background: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#ff6b6b'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: '0.9rem',
              opacity: 0.9
            }}>
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: '0.9rem',
              opacity: 0.9
            }}>
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 8,
              border: 'none',
              background: loading 
                ? 'rgba(255,255,255,0.1)' 
                : 'linear-gradient(135deg, rgba(30,136,229,.95), rgba(0,188,212,.95))',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>

        <div style={{ 
          marginTop: 20, 
          textAlign: 'center',
          opacity: 0.7,
          fontSize: '0.9rem'
        }}>
          <button
            onClick={() => navigate('/auth/login')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#60a5fa',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Volver al login
          </button>
        </div>
      </div>
    </div>
  );
}

