// Utilidad para reset de contraseña
import { supabase } from '../lib/supabase';

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
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

export async function updatePassword(newPassword: string, currentPassword?: string) {
  try {
    // Si se proporciona contraseña actual, reautenticar primero
    if (currentPassword) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.email) {
        throw new Error('No se pudo obtener la información del usuario');
      }

      // Reautenticar con la contraseña actual
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (reauthError) {
        throw new Error('Contraseña actual incorrecta');
      }
    }

    // Actualizar la contraseña
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('Error al actualizar contraseña:', error);
      throw error;
    }
    
    return { success: true, message: 'Contraseña actualizada' };
  } catch (error: any) {
    console.error('Error en updatePassword:', error);
    return { success: false, error };
  }
}
