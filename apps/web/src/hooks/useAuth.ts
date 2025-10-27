import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProfileMode } from '../state/profileMode';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    console.log('🔐 [useAuth] Initializing auth hook...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 [useAuth] Initial session:', session?.user?.id || 'null');
      setUser(session?.user ?? null);
      setLoading(false);
      console.log('🔐 [useAuth] Loading set to false');
      
      // 🎭 Resetear a usuario si no hay sesión
      if (!session?.user) {
        useProfileMode.getState().setMode("usuario");
      }
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 [useAuth] Auth state changed:', event, session?.user?.id || 'null');
      setUser(session?.user ?? null);
      setLoading(false);
      
      // 🎭 Resetear a usuario si se cierra sesión
      if (!session?.user) {
        useProfileMode.getState().setMode("usuario");
      }
    });

    return () => subscription.unsubscribe();
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
      
      // 🎭 Resetear modo de perfil a "usuario"
      useProfileMode.getState().setMode("usuario");
      
      // Si hay error, solo loguearlo pero no fallar
      if (error) {
        console.warn('[useAuth] Logout warning (puede ignorarse):', error);
      }
      
      return { error: null }; // Siempre retornar success para el logout local
    } catch (e: any) {
      console.error('[useAuth] Logout error:', e);
      // Limpiar cache de todas formas
      qc.clear();
      useProfileMode.getState().setMode("usuario");
      return { error: e };
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
}

