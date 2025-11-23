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
        // Verificar si hay un token de recovery en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');
        
        if (token && type === 'recovery') {
          // Si es un token de recovery, redirigir a la página de reset de contraseña
          console.log('[AuthCallback] Token de recovery detectado, redirigiendo a reset-password');
          navigate(`/reset-password?token=${token}&type=${type}`, { replace: true });
          return;
        }
        
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
          const { data: profileRaw, error: profileError } = await supabase
            .from('profiles_user')
            .select('user_id, onboarding_complete, onboarding_completed, pin_hash, display_name, ritmos, ritmos_seleccionados, zonas, rol_baile')
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

          let profile = profileRaw as any;

          // Validación extra: si tiene datos completos de perfil pero el flag no está marcado, corregirlo.
          if (profile) {
            const hasName = !!profile.display_name;
            const ritmosCount =
              (Array.isArray(profile.ritmos) ? profile.ritmos.length : 0) +
              (Array.isArray(profile.ritmos_seleccionados) ? profile.ritmos_seleccionados.length : 0);
            const hasRitmos = ritmosCount > 0;
            const hasZonas = Array.isArray(profile.zonas) && profile.zonas.length > 0;
            const hasRol = !!profile.rol_baile;

            if (!profile.onboarding_complete && hasName && hasRitmos && hasZonas && hasRol) {
              try {
                const { error: updError } = await supabase
                  .from('profiles_user')
                  .update({ onboarding_complete: true, onboarding_completed: true })
                  .eq('user_id', user.id);
                if (!updError) {
                  profile = { ...profile, onboarding_complete: true };
                } else {
                  console.warn('[AuthCallback] No se pudo auto-corregir onboarding_complete:', updError.message);
                }
              } catch (e: any) {
                console.warn('[AuthCallback] Error inesperado auto-corregir onboarding_complete:', e?.message || e);
              }
            }
          }

          // Si no tiene onboarding completo, ir a onboarding (sin verificar PIN)
          if (!profile?.onboarding_complete) {
            navigate('/onboarding/basics', { replace: true });
            return;
          }
          
          // Verificar PIN solo si tiene PIN configurado Y onboarding completo Y no está verificado en esta sesión
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


