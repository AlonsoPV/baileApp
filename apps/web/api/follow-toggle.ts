import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE!;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('[follow-toggle] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE');
}
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});