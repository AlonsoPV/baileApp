import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProfileMode } from '@/state/profileMode';
import { clearAllPinVerified } from '@/lib/pin';

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
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
      
      // 🎭 Resetear a usuario si no hay sesión
      if (!data.session?.user) {
        useProfileMode.getState().setMode("usuario");
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess ?? null);
      setUser(sess?.user ?? null);
      setLoading(false);
      
      // 🎭 Resetear a usuario si se cierra sesión
      if (!sess?.user) {
        useProfileMode.getState().setMode("usuario");
      }
    });

    return () => { 
      mounted = false; 
      sub.subscription.unsubscribe(); 
    };
  }, []);

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
      // 🔁 Invalida perfil justo después del login
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["profile", "me", data.user.id] });
      
      // 🎭 Resetear modo de perfil a "usuario" por defecto
      useProfileMode.getState().setMode("usuario");
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
