import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from './_supabaseAdmin';

interface FollowToggleRequestBody {
  targetUserId?: string;
}

async function readRequestBody<T>(req: IncomingMessage): Promise<T | null> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.socket.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function getUserFromRequest(req: IncomingMessage) {
  const authHeader =
    req.headers['authorization'] || req.headers['Authorization'.toLowerCase() as 'authorization'];
  if (!authHeader || Array.isArray(authHeader)) return null;

  const token = authHeader.replace('Bearer', '').trim();
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) {
    console.error('[follow-toggle] auth.getUser error', error);
    return null;
  }
  return data.user;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>
) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Unauthenticated' }));
      return;
    }

    const body = (await readRequestBody<FollowToggleRequestBody>(req)) || {};
    const { targetUserId } = body;

    if (!targetUserId || targetUserId === user.id) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid target' }));
      return;
    }

    const { data: existing, error: selectError } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (selectError) {
      console.error('[follow-toggle] select error', selectError);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Database error' }));
      return;
    }

    if (existing) {
      const { error: deleteError } = await supabaseAdmin.from('follows').delete().eq('id', existing.id);
      if (deleteError) {
        console.error('[follow-toggle] delete error', deleteError);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Error unfollow' }));
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ following: false }));
      return;
    }

    const { error: insertError } = await supabaseAdmin.from('follows').insert({
      follower_id: user.id,
      following_id: targetUserId,
    });

    if (insertError) {
      console.error('[follow-toggle] insert error', insertError);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Error follow' }));
      return;
    }

    const { error: notificationError } = await supabaseAdmin.from('notifications').insert({
      user_id: targetUserId,
      type: 'new_follower',
      data: { from_user_id: user.id },
    });

    if (notificationError) {
      console.error('[follow-toggle] notification insert error', notificationError);
      // Continue even if notification fails
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ following: true }));
  } catch (error) {
    console.error('[follow-toggle] unexpected error', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Unexpected error' }));
  }
}


