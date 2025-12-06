import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabaseClient] Missing Supabase URL or anon key', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    // Configuración de Realtime para manejar conexiones de manera más robusta
    params: {
      eventsPerSecond: 10,
    },
    // Configuración adicional para mejorar la estabilidad de WebSocket
    // timeout: tiempo máximo para establecer conexión (30 segundos)
    // heartbeatIntervalMs: intervalo para mantener la conexión viva (30 segundos)
    // reconnectAfterMs: tiempo antes de intentar reconectar (1 segundo)
    // transport: usar 'websocket' explícitamente para mejor compatibilidad
  },
  global: {
    headers: {
      'x-client-info': 'baileapp-web',
    },
  },
});


