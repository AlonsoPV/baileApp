import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';

// parsear body e n Node
async function readBody<T = any>(req: IncomingMessage): Promise<T | null> {
  return await new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => (raw += c));
    req.on('end', () => {
      if (!raw) return resolve(null);
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') { res.statusCode = 405; res.end('Method Not Allowed'); return; }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const authHeader = (req.headers['authorization'] || '') as string;
  const token = authHeader.replace('Bearer', '').trim();
  if (!token) { res.statusCode = 401; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({error:'Unauthenticated'})); return; }

  const { data: userData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !userData?.user) { res.statusCode = 401; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({error:'Unauthenticated'})); return; }

  const me = userData.user;
  const body = (await readBody<{ targetUserId?: string }>(req)) || {};
  const targetUserId = body.targetUserId;
  if (!targetUserId || targetUserId === me.id) { res.statusCode = 400; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({error:'Invalid target'})); return; }

  const { data: existing, error: selErr } = await supabaseAdmin.from('follows').select('id').eq('follower_id', me.id).eq('following_id', targetUserId).maybeSingle();
  if (selErr) { res.statusCode = 500; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({error:'Database error'})); return; }

  if (existing) {
    const { error: delErr } = await supabaseAdmin.from('follows').delete().eq('id', existing.id);
    if (delErr) { res.statusCode = 500; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({error:'Error unfollow'})); return; }
    res.statusCode = 200; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({ following: false })); return;
  }

  const { error: insErr } = await supabaseAdmin.from('follows').insert({ follower_id: me.id, following_id: targetUserId });
  if (insErr) { res.statusCode = 500; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({error:'Error follow'})); return; }

  await supabaseAdmin.from('notifications').insert({ user_id: targetUserId, type: 'new_follower', data: { from_user_id: me.id } });
  res.statusCode = 200; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({ following: true }));
}