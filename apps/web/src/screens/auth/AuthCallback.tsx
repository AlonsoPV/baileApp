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
        if (error) {
          console.error('[AuthCallback] Error getting session:', error);
          throw error;
        }
        
        const user = data.session?.user;
        const provider = user?.app_metadata?.provider || user?.user_metadata?.provider || 'unknown';
        console.log('[AuthCallback] Session user:', {
          email: user?.email,
          id: user?.id,
          provider: provider,
          created_at: user?.created_at,
        });
        
        if (user) {
          // Verificar si el usuario tiene perfil y onboarding completo
          const { data: profile, error: profileError } = await supabase
            .from('profiles_user')
            .select('user_id, onboarding_complete, pin_hash')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('[AuthCallback] Error fetching profile:', profileError);
            // Si el perfil no existe, crear uno básico
            const { error: insertError } = await supabase
              .from('profiles_user')
              .insert({
                user_id: user.id,
                email: user.email,
                display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
                onboarding_complete: false
              });
            
            if (insertError) {
              console.error('[AuthCallback] Error creating profile:', insertError);
            }
            
            // Redirigir a onboarding
            navigate('/onboarding/basics', { replace: true });
            return;
          }
          
          // Verificar PIN solo si tiene PIN configurado Y no está verificado en esta sesión
          if (profile?.pin_hash) {
            const { isPinVerified } = await import('@/lib/pin');
            const alreadyVerified = isPinVerified(user.id);
            
            if (!alreadyVerified) {
              setNeedsPinVerify(user.id);
              navigate('/auth/pin', { replace: true });
              return;
            }
            // Si ya está verificado, continuar normalmente
          }
          
          // Si no tiene onboarding completo, ir a onboarding
          if (!profile?.onboarding_complete) {
            navigate('/onboarding/basics', { replace: true });
            return;
          }
          
          // Si todo está OK, ir a explore
          navigate('/explore', { replace: true });
          return;
        }
        
        setMessage('No se pudo recuperar la sesión. Redirigiendo a login…');
        setTimeout(() => navigate('/auth/login', { replace: true }), 800);
      } catch (e: any) {
        console.error('[AuthCallback] Error:', e);
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


