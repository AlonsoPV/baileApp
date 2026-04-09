import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;
const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;
const serverKey = serviceRoleKey || anonKey;

if (!supabaseUrl || !serverKey) {
  throw new Error(
    '[supabaseAdmin] Missing Supabase server env. Expected SUPABASE_URL plus SUPABASE_SERVICE_ROLE or SUPABASE_ANON_KEY (VITE_* also supported).'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serverKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});