import { supabase } from "../lib/supabase";

export async function supaHealth() {
  try {
    const { data, error } = await supabase.from('tags').select('id').limit(1);
    if (error) throw error;
    console.log('[SUPA HEALTH] ✅ ok. tags len ~', data?.length ?? 0);
    return true;
  } catch (e) {
    console.error('[SUPA HEALTH] ❌ fail:', e);
    return false;
  }
}
