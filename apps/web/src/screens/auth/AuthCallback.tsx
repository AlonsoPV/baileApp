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
          // Consultar vista ligera para saber si tiene PIN
          const { data: light, error: e2 } = await supabase
            .from('profiles_user_light')
            .select('has_pin')
            .eq('user_id', user.id)
            .maybeSingle();
          if (e2) throw e2;
          // Marcar que esta sesión requiere verificación de PIN
          setNeedsPinVerify(user.id);
          // Redirigir según tenga/nó PIN configurado
          if (!light?.has_pin) {
            navigate('/auth/pin/setup', { replace: true });
          } else {
            // Ir directo a la pantalla de PIN (no protegida) para evitar rebote si aún no hidrata el user
            navigate('/auth/pin', { replace: true });
          }
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


