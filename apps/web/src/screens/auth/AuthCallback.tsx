import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { setNeedsPinVerify } from '@/lib/pin';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Procesando inicio de sesión…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Forzar lectura/establecimiento de sesión desde la URL (hash/callback)
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data.session?.user;
        if (user) {
          // Exigir verificación de PIN para esta sesión
          setNeedsPinVerify(user.id);
          // Ir a una ruta protegida para que OnboardingGate dirija a PIN/Onboarding
          navigate('/profile', { replace: true });
          return;
        }
        setMessage('No se pudo recuperar la sesión. Redirigiendo a login…');
        setTimeout(() => navigate('/auth/login', { replace: true }), 800);
      } catch (e: any) {
        if (!cancelled) {
          setMessage('Error procesando el acceso. Redirigiendo a login…');
          setTimeout(() => navigate('/auth/login', { replace: true }), 800);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b0d10', color: '#e5e7eb' }}>
      <div style={{ padding: 24, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}>
        {message}
      </div>
    </div>
  );
}


