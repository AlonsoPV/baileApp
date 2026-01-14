import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProfileMode } from '@/state/profileMode';
import { clearAllPinVerified, setNeedsPinVerify } from '@/lib/pin';
import { isMobileWebView } from '@/utils/authRedirect';

type AuthCtx = {
  session: import('@supabase/supabase-js').Session | null;
  user: import('@supabase/supabase-js').User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
};

const Ctx = createContext<AuthCtx>({ 
  session: null, 
  user: null, 
  loading: true,
  signUp: async () => ({ data: null, error: null }),
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null })
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthCtx['session']>(null);
  const [user, setUser] = useState<AuthCtx['user']>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    // Timeout de seguridad: si getSession() tarda más de 10 segundos, forzar loading = false
    timeoutId = setTimeout(() => {
      if (mounted) {
        if (import.meta.env.DEV) {
          console.warn('[AuthProvider] Timeout de seguridad (10s) en getSession(), forzando loading = false');
        }
        setLoading(false);
        // Intentar obtener sesión del localStorage como fallback
        try {
          const storedSession = localStorage.getItem('sb-' + supabase.supabaseUrl.split('//')[1]?.split('.')[0] + '-auth-token');
          if (!storedSession) {
            setSession(null);
            setUser(null);
            useProfileMode.getState().setMode("usuario");
          }
        } catch (e) {
          // Si falla, asumir que no hay sesión
          setSession(null);
          setUser(null);
          useProfileMode.getState().setMode("usuario");
        }
      }
    }, 10000);

    (async () => {
      try {
        // Intentar obtener sesión con timeout más generoso para conexiones lentas
        const sessionPromise = supabase.auth.getSession();
        // IMPORTANT:
        // If we "race" and the timeout wins, the original sessionPromise may still
        // reject later (e.g. due to AbortSignal.timeout in the global fetch wrapper),
        // which would surface as an unhandled rejection / "AbortError: Aborted" in console.
        // Attach a no-op catch to prevent noisy unhandled rejections in slow/offline cases.
        sessionPromise.catch(() => {});

        let timeoutTriggered = false;
        let raceTimer: ReturnType<typeof setTimeout> | null = null;
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          raceTimer = setTimeout(() => {
            timeoutTriggered = true;
            reject(new Error('getSession timeout'));
          }, 8000); // Aumentado de 7s a 8s para dar más tiempo en conexiones lentas
        });
        
        let result: Awaited<ReturnType<typeof supabase.auth.getSession>>;
        
        try {
          result = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
        } catch (raceError: any) {
          if (raceTimer) {
            clearTimeout(raceTimer);
            raceTimer = null;
          }
          // Si el timeout se disparó, continuar sin sesión
          if (timeoutTriggered || raceError?.message?.includes('timeout')) {
            if (!mounted) return;
            // Solo mostrar warning en desarrollo para no alarmar a usuarios
            if (import.meta.env.DEV) {
              console.warn('[AuthProvider] Timeout en getSession() (8s), continuando sin sesión. Esto puede ocurrir por conexión lenta o bloqueadores de red.');
            }
            setLoading(false);
            setSession(null);
            setUser(null);
            useProfileMode.getState().setMode("usuario");
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            return;
          }
          throw raceError;
        }
        
        if (raceTimer) {
          clearTimeout(raceTimer);
          raceTimer = null;
        }
        
        if (!mounted) return;
        
        const { data, error } = result;
        
        if (error) {
          // Si es un error de red bloqueado, intentar continuar sin sesión
          if (error.message?.includes('blocked') || error.message?.includes('ERR_BLOCKED')) {
            if (import.meta.env.DEV) {
              console.warn('[AuthProvider] Solicitud bloqueada por cliente (probablemente bloqueador de anuncios), continuando sin sesión');
            }
            setSession(null);
            setUser(null);
            setLoading(false);
            useProfileMode.getState().setMode("usuario");
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            return;
          }
          if (import.meta.env.DEV) {
            console.error('[AuthProvider] Error en getSession():', error);
          }
        }
        
        setSession(data?.session ?? null);
        setUser(data?.session?.user ?? null);
        setLoading(false);
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // 🎭 Resetear a usuario si no hay sesión
        if (!data?.session?.user) {
          useProfileMode.getState().setMode("usuario");
        }
      } catch (err: any) {
        if (!mounted) return;
        
        // Si es un timeout o error de red bloqueado, continuar sin sesión
        if (err?.message?.includes('timeout') || err?.message?.includes('blocked') || err?.message?.includes('ERR_BLOCKED')) {
          if (import.meta.env.DEV) {
            console.warn('[AuthProvider] Timeout o bloqueo en getSession(), continuando sin sesión. Esto puede ocurrir por conexión lenta o bloqueadores de red.');
          }
          setLoading(false);
          setSession(null);
          setUser(null);
          useProfileMode.getState().setMode("usuario");
        } else {
          if (import.meta.env.DEV) {
            console.error('[AuthProvider] Excepción en getSession():', err);
          }
          setLoading(false);
          setSession(null);
          setUser(null);
        }
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, sess) => {
      if (!mounted) return;
      
      setSession(sess ?? null);
      setUser(sess?.user ?? null);
      setLoading(false);
      
      // 🔁 Invalidar todas las queries de perfiles cuando cambia el estado de autenticación
      if (sess?.user) {
        try {
          await qc.invalidateQueries({ queryKey: ["profile"] });
          await qc.invalidateQueries({ queryKey: ["profile", "me", sess.user.id] });
          await qc.invalidateQueries({ queryKey: ["academy"] });
          await qc.invalidateQueries({ queryKey: ["academy", "my"] });
          await qc.invalidateQueries({ queryKey: ["academy", "mine"] });
          await qc.invalidateQueries({ queryKey: ["organizer"] });
          await qc.invalidateQueries({ queryKey: ["organizer", "mine"] });
          await qc.invalidateQueries({ queryKey: ["teacher"] });
          await qc.invalidateQueries({ queryKey: ["teacher", "mine"] });
          await qc.invalidateQueries({ queryKey: ["brand"] });
          await qc.invalidateQueries({ queryKey: ["brand", "mine"] });
        } catch (err) {
          console.warn('[AuthProvider] Error invalidando queries:', err);
        }
      }
      
      // 🎭 Resetear a usuario si se cierra sesión
      if (!sess?.user) {
        useProfileMode.getState().setMode("usuario");
      }
    });

    return () => { 
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      sub.subscription.unsubscribe(); 
    };
  }, [qc]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      // 🔁 Invalida todos los perfiles justo después del login para forzar refetch
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["profile", "me", data.user.id] });
      // Invalidar queries de todos los tipos de perfil
      await qc.invalidateQueries({ queryKey: ["academy"] });
      await qc.invalidateQueries({ queryKey: ["academy", "my"] });
      await qc.invalidateQueries({ queryKey: ["academy", "mine"] });
      await qc.invalidateQueries({ queryKey: ["organizer"] });
      await qc.invalidateQueries({ queryKey: ["organizer", "mine"] });
      await qc.invalidateQueries({ queryKey: ["teacher"] });
      await qc.invalidateQueries({ queryKey: ["teacher", "mine"] });
      await qc.invalidateQueries({ queryKey: ["brand"] });
      await qc.invalidateQueries({ queryKey: ["brand", "mine"] });
      
      // 🎭 Resetear modo de perfil a "usuario" por defecto
      useProfileMode.getState().setMode("usuario");

      // 🔐 Marcar que esta sesión requiere verificación de PIN (solo por sesión)
      setNeedsPinVerify(data.user.id);
    }
    
    return { data, error };
  };

  const signOut = async () => {
    try {
      // ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE (antes de llamar a signOut)
      // Esto asegura que la UI se actualice de forma instantánea
      setSession(null);
      setUser(null);
      setLoading(false);
      
      // 🧹 Limpiar cache INMEDIATAMENTE
      qc.clear();
      clearAllPinVerified();
      
      // 🎭 Resetear modo de perfil a "usuario"
      useProfileMode.getState().setMode("usuario");
      
      // 🔐 Cerrar sesión en Supabase (intentar global primero, luego local como fallback)
      let error: any = null;
      try {
        // Intentar logout global primero (cierra sesión en todos los dispositivos)
        const { error: globalError } = await supabase.auth.signOut({ scope: 'global' });
        if (globalError) {
          // Si falla, intentar logout local
          const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
          error = localError;
        }
      } catch (signOutError: any) {
        error = signOutError;
        console.warn('[AuthProvider] Error en signOut de Supabase (continuando con logout local):', signOutError);
      }
      
      // Si hay error, solo loguearlo pero no fallar (ya limpiamos el estado local)
      if (error) {
        console.warn('[AuthProvider] Logout warning (puede ignorarse, estado local ya limpiado):', error);
      }

      // ✅ Best-effort: notify native host to clear any SDK session (Google)
      try {
        if (isMobileWebView()) {
          const rn = (window as any).ReactNativeWebView;
          rn?.postMessage?.(JSON.stringify({ type: 'NATIVE_SIGN_OUT' }));
        }
      } catch {
        // ignore
      }
      
      return { error: null }; // Siempre retornar success porque el estado local ya está limpio
    } catch (e: any) {
      console.error('[AuthProvider] Logout error:', e);
      // ✅ Asegurar que el estado local se limpie incluso si hay excepción
      setSession(null);
      setUser(null);
      setLoading(false);
      qc.clear();
      clearAllPinVerified();
      useProfileMode.getState().setMode("usuario");
      return { error: e };
    }
  };

  return (
    <Ctx.Provider value={{ 
      session, 
      user, 
      loading, 
      signUp, 
      signIn, 
      signOut 
    }}>
      {children}
    </Ctx.Provider>
  );
}

/** Hook oficial. Lanza error legible si se usa fuera del Provider. */
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    if (import.meta.env.DEV) {
      console.error('[useAuth] Hook usado fuera de <AuthProvider>. Envuelve tu árbol en <AuthProvider>.');
      throw new Error('useAuth fue usado fuera de <AuthProvider>. Envuelve tu árbol en <AuthProvider>.');
    }
    // En prod, devolver estado inerte para no crashear
    console.warn('[useAuth] Hook usado fuera de <AuthProvider>');
    return { session: null, user: null, loading: true, signUp: async () => ({ data: null, error: new Error('Not initialized') }), signIn: async () => ({ data: null, error: new Error('Not initialized') }), signOut: async () => ({ error: null }) };
  }
  return ctx;
}

// Export default para tolerar ambos estilos de import
export default useAuth;
