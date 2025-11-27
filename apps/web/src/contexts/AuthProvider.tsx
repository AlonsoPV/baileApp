import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProfileMode } from '@/state/profileMode';
import { clearAllPinVerified, setNeedsPinVerify } from '@/lib/pin';

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
        console.warn('[AuthProvider] Timeout en getSession(), forzando loading = false');
        setLoading(false);
      }
    }, 10000);

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error('[AuthProvider] Error en getSession():', error);
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
      } catch (err) {
        console.error('[AuthProvider] Excepción en getSession():', err);
        if (mounted) {
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
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      // 🧹 Limpiar cache SIEMPRE, incluso si hay error 403
      // El error 403 puede ser de Supabase pero el logout local funciona
      qc.clear();
      clearAllPinVerified();
      
      // 🎭 Resetear modo de perfil a "usuario"
      useProfileMode.getState().setMode("usuario");
      
      // Si hay error, solo loguearlo pero no fallar
      if (error) {
        console.warn('[AuthProvider] Logout warning (puede ignorarse):', error);
      }
      
      return { error: null }; // Siempre retornar success para el logout local
    } catch (e: any) {
      console.error('[AuthProvider] Logout error:', e);
      // Limpiar cache de todas formas
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
