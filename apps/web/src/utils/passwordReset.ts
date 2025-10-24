// Utilidad para reset de contraseña
import { supabase } from '../lib/supabase';

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      console.error('Error al enviar email de reset:', error);
      throw error;
    }
    
    return { success: true, message: 'Email de reset enviado' };
  } catch (error) {
    console.error('Error en resetPassword:', error);
    return { success: false, error };
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('Error al actualizar contraseña:', error);
      throw error;
    }
    
    return { success: true, message: 'Contraseña actualizada' };
  } catch (error) {
    console.error('Error en updatePassword:', error);
    return { success: false, error };
  }
}
