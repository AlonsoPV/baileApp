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
      
      // Manejar error de rate limit específicamente
      if (error.status === 429 || error.message?.includes('rate limit') || error.message?.includes('email rate limit')) {
        console.error('[magicLinkAuth] Rate limit error details:', {
          status: error.status,
          message: error.message,
          code: error.code,
          fullError: error,
        });
        
        // Si el SMTP está configurado pero sigue dando rate limit, puede ser problema de configuración
        const message = 'El servicio de emails está temporalmente limitado. Esto puede deberse a una configuración incorrecta de SMTP. Por favor verifica la configuración en Supabase Dashboard → Settings → Authentication → SMTP Settings, o usa "Continuar con Google" para iniciar sesión.';
        
        return {
          success: false,
          error,
          message,
          isRateLimit: true,
        };
      }
      
      // Otros errores de email
      if (error.message?.includes('email') || error.message?.includes('SMTP') || error.message?.includes('smtp')) {
        console.error('[magicLinkAuth] Email/SMTP error:', {
          status: error.status,
          message: error.message,
          code: error.code,
          fullError: error,
        });
        
        return {
          success: false,
          error,
          message: 'Error al enviar el email. Por favor verifica la configuración de SMTP en Supabase Dashboard → Settings → Authentication → SMTP Settings, o usa "Continuar con Google" para iniciar sesión.',
        };
      }
      
      throw error;
    }
    
    return { 
      success: true, 
      message: 'Te hemos enviado un enlace mágico a tu email. Revisa tu bandeja de entrada.' 
    };
  } catch (error: any) {
    console.error('Error en signInWithMagicLink:', error);
    
    // Verificar si es rate limit en el catch también
    if (error?.status === 429 || error?.message?.includes('rate limit') || error?.message?.includes('email rate limit')) {
      console.error('[magicLinkAuth] Rate limit error in catch:', {
        status: error?.status,
        message: error?.message,
        code: error?.code,
        fullError: error,
      });
      
      const message = 'El servicio de emails está temporalmente limitado. Esto puede deberse a una configuración incorrecta de SMTP. Por favor verifica la configuración en Supabase Dashboard → Settings → Authentication → SMTP Settings, o usa "Continuar con Google" para iniciar sesión.';
      
      return {
        success: false,
        error,
        message,
        isRateLimit: true,
      };
    }
    
    // Otros errores de email/SMTP
    if (error?.message?.includes('email') || error?.message?.includes('SMTP') || error?.message?.includes('smtp')) {
      console.error('[magicLinkAuth] Email/SMTP error in catch:', {
        status: error?.status,
        message: error?.message,
        code: error?.code,
        fullError: error,
      });
      
      return {
        success: false,
        error,
        message: 'Error al enviar el email. Por favor verifica la configuración de SMTP en Supabase Dashboard → Settings → Authentication → SMTP Settings, o usa "Continuar con Google" para iniciar sesión.',
      };
    }
    
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
      
      // Manejar error de rate limit específicamente
      if (error.status === 429 || error.message?.includes('rate limit') || error.message?.includes('email rate limit')) {
        console.error('[magicLinkAuth] Rate limit error details (signup):', {
          status: error.status,
          message: error.message,
          code: error.code,
          fullError: error,
        });
        
        const message = 'El servicio de emails está temporalmente limitado. Esto puede deberse a una configuración incorrecta de SMTP. Por favor verifica la configuración en Supabase Dashboard → Settings → Authentication → SMTP Settings, o usa "Continuar con Google" para registrarte.';
        
        return {
          success: false,
          error,
          message,
          isRateLimit: true,
        };
      }
      
      // Otros errores de email
      if (error.message?.includes('email') || error.message?.includes('SMTP') || error.message?.includes('smtp')) {
        console.error('[magicLinkAuth] Email/SMTP error (signup):', {
          status: error.status,
          message: error.message,
          code: error.code,
          fullError: error,
        });
        
        return {
          success: false,
          error,
          message: 'Error al enviar el email. Por favor verifica la configuración de SMTP en Supabase Dashboard → Settings → Authentication → SMTP Settings, o usa "Continuar con Google" para registrarte.',
        };
      }
      
      throw error;
    }
    
    return { 
      success: true, 
      message: 'Te hemos enviado un enlace mágico para completar tu registro.' 
    };
  } catch (error: any) {
    console.error('Error en signUpWithMagicLink:', error);
    
    // Verificar si es rate limit en el catch también
    if (error?.status === 429 || error?.message?.includes('rate limit') || error?.message?.includes('email rate limit')) {
      console.error('[magicLinkAuth] Rate limit error in catch (signup):', {
        status: error?.status,
        message: error?.message,
        code: error?.code,
        fullError: error,
      });
      
      const message = 'El servicio de emails está temporalmente limitado. Esto puede deberse a una configuración incorrecta de SMTP. Por favor verifica la configuración en Supabase Dashboard → Settings → Authentication → SMTP Settings, o usa "Continuar con Google" para registrarte.';
      
      return {
        success: false,
        error,
        message,
        isRateLimit: true,
      };
    }
    
    // Otros errores de email/SMTP
    if (error?.message?.includes('email') || error?.message?.includes('SMTP') || error?.message?.includes('smtp')) {
      console.error('[magicLinkAuth] Email/SMTP error in catch (signup):', {
        status: error?.status,
        message: error?.message,
        code: error?.code,
        fullError: error,
      });
      
      return {
        success: false,
        error,
        message: 'Error al enviar el email. Por favor verifica la configuración de SMTP en Supabase Dashboard → Settings → Authentication → SMTP Settings, o usa "Continuar con Google" para registrarte.',
      };
    }
    
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
