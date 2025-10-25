// Environment configuration with fallbacks
export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

// Validate required environment variables
export function validateEnv() {
  const errors: string[] = [];
  
  if (!env.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!env.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  if (errors.length > 0) {
    console.error('[Environment] Missing required variables:', errors);
    if (env.isProd) {
      throw new Error(`Missing required environment variables: ${errors.join(', ')}`);
    }
  }
  
  return errors.length === 0;
}

// Initialize environment validation
validateEnv();