// Utilidad para autenticación con Magic Link (sin contraseña)
import { supabase } from '../lib/supabase';

// Protección contra múltiples llamadas simultáneas para el mismo email
const pendingRequests = new Map<string, Promise<any>>();
const lastSentTime = new Map<string, number>();
const MIN_TIME_BETWEEN_REQUESTS = 60000; // 60 segundos mínimo entre envíos al mismo email

export async function signInWithMagicLink(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Verificar si hay una petición pendiente para este email
  if (pendingRequests.has(normalizedEmail)) {
    console.warn('[magicLinkAuth] Ya hay una petición pendiente para este email');
    return {
      success: false,
      error: { message: 'Ya hay una petición en proceso para este email' },
      message: 'Ya se está enviando un enlace. Por favor espera unos segundos.',
    };
  }
  
  // Verificar si se envió recientemente (rate limiting local)
  const lastSent = lastSentTime.get(normalizedEmail);
  if (lastSent && Date.now() - lastSent < MIN_TIME_BETWEEN_REQUESTS) {
    const secondsLeft = Math.ceil((MIN_TIME_BETWEEN_REQUESTS - (Date.now() - lastSent)) / 1000);
    console.warn(`[magicLinkAuth] Rate limit local: espera ${secondsLeft} segundos`);
    return {
      success: false,
      error: { status: 429, message: 'rate limit' },
      message: `Ya se envió un correo hace poco. Revisa tu bandeja (y spam) o espera ${secondsLeft} segundos antes de intentar de nuevo.`,
      isRateLimit: true,
    };
  }
  
  // Crear la promesa y guardarla para evitar duplicados
  const requestPromise = (async () => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
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
          
          // Mensaje más amigable para rate limit
          const message = 'Ya se envió un correo hace poco. Revisa tu bandeja (y spam) o espera unos minutos antes de intentar de nuevo. Si el problema persiste, usa "Continuar con Google" para iniciar sesión.';
          
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
      
      // Registrar el tiempo de envío exitoso
      lastSentTime.set(normalizedEmail, Date.now());
      
      return { 
        success: true, 
        message: 'Te enviamos un enlace a tu correo. Revisa tu bandeja y spam.' 
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
        
        const message = 'Ya se envió un correo hace poco. Revisa tu bandeja (y spam) o espera unos minutos antes de intentar de nuevo. Si el problema persiste, usa "Continuar con Google" para iniciar sesión.';
        
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
    } finally {
      // Limpiar la petición pendiente
      pendingRequests.delete(normalizedEmail);
    }
  })();
  
  // Guardar la promesa para evitar duplicados
  pendingRequests.set(normalizedEmail, requestPromise);
  
  return requestPromise;
}

export async function signUpWithMagicLink(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Verificar si hay una petición pendiente para este email
  if (pendingRequests.has(normalizedEmail)) {
    console.warn('[magicLinkAuth] Ya hay una petición pendiente para este email (signup)');
    return {
      success: false,
      error: { message: 'Ya hay una petición en proceso para este email' },
      message: 'Ya se está enviando un enlace. Por favor espera unos segundos.',
    };
  }
  
  // Verificar si se envió recientemente (rate limiting local)
  const lastSent = lastSentTime.get(normalizedEmail);
  if (lastSent && Date.now() - lastSent < MIN_TIME_BETWEEN_REQUESTS) {
    const secondsLeft = Math.ceil((MIN_TIME_BETWEEN_REQUESTS - (Date.now() - lastSent)) / 1000);
    console.warn(`[magicLinkAuth] Rate limit local (signup): espera ${secondsLeft} segundos`);
    return {
      success: false,
      error: { status: 429, message: 'rate limit' },
      message: `Ya se envió un correo hace poco. Revisa tu bandeja (y spam) o espera ${secondsLeft} segundos antes de intentar de nuevo.`,
      isRateLimit: true,
    };
  }
  
  // Crear la promesa y guardarla para evitar duplicados
  const requestPromise = (async () => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
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
          
          // Mensaje más amigable para rate limit
          const message = 'Ya se envió un correo hace poco. Revisa tu bandeja (y spam) o espera unos minutos antes de intentar de nuevo. Si el problema persiste, usa "Continuar con Google" para registrarte.';
          
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
      
      // Registrar el tiempo de envío exitoso
      lastSentTime.set(normalizedEmail, Date.now());
      
      return { 
        success: true, 
        message: 'Te enviamos un enlace a tu correo. Revisa tu bandeja y spam.' 
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
        
        const message = 'Ya se envió un correo hace poco. Revisa tu bandeja (y spam) o espera unos minutos antes de intentar de nuevo. Si el problema persiste, usa "Continuar con Google" para registrarte.';
        
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
    } finally {
      // Limpiar la petición pendiente
      pendingRequests.delete(normalizedEmail);
    }
  })();
  
  // Guardar la promesa para evitar duplicados
  pendingRequests.set(normalizedEmail, requestPromise);
  
  return requestPromise;
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
