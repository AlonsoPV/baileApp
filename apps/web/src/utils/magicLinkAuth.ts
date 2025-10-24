// Utilidad para autenticación con Magic Link (sin contraseña)
import { supabase } from '../lib/supabase';

export async function signInWithMagicLink(email: string) {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    if (error) {
      console.error('Error enviando magic link:', error);
      throw error;
    }
    
    return { 
      success: true, 
      message: 'Te hemos enviado un enlace mágico a tu email. Revisa tu bandeja de entrada.' 
    };
  } catch (error) {
    console.error('Error en signInWithMagicLink:', error);
    return { success: false, error };
  }
}

export async function signUpWithMagicLink(email: string) {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    if (error) {
      console.error('Error enviando magic link de registro:', error);
      throw error;
    }
    
    return { 
      success: true, 
      message: 'Te hemos enviado un enlace mágico para completar tu registro.' 
    };
  } catch (error) {
    console.error('Error en signUpWithMagicLink:', error);
    return { success: false, error };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error cerrando sesión:', error);
      throw error;
    }
    
    return { success: true, message: 'Sesión cerrada correctamente' };
  } catch (error) {
    console.error('Error en signOut:', error);
    return { success: false, error };
  }
}
