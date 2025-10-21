import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to get public URL for a file in a Supabase Storage bucket
 */
export function getBucketPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

