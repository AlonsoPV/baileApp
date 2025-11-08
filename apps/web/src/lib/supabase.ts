export { supabase } from './supabaseClient';

/**
 * Helper to get public URL for a file in a Supabase Storage bucket
 */
export function getBucketPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

