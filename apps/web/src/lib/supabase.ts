import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Debug logging for environment variables
console.log('[Supabase] Environment check:', {
  hasUrl: !!env.supabase.url,
  hasKey: !!env.supabase.anonKey,
  urlLength: env.supabase.url?.length || 0,
  keyLength: env.supabase.anonKey?.length || 0
});

if (!env.supabase.url || !env.supabase.anonKey) {
  console.error('[Supabase] Missing environment variables:', {
    VITE_SUPABASE_URL: env.supabase.url,
    VITE_SUPABASE_ANON_KEY: env.supabase.anonKey ? '***' : 'MISSING'
  });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(env.supabase.url, env.supabase.anonKey);

/**
 * Helper to get public URL for a file in a Supabase Storage bucket
 */
export function getBucketPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

