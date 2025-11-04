import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function UserPublicScreen() {
  const { userId: userIdFromParams } = useParams();
  const { search } = useLocation();
  const userId = React.useMemo(() => {
    const q = new URLSearchParams(search);
    return (userIdFromParams as string) || q.get('userId') || '';
  }, [userIdFromParams, search]);
  const [profile, setProfile] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles_user')
          .select('user_id, display_name, bio, avatar_url, ritmos, zonas')
          .eq('user_id', userId as string)
          .single();
        if (error) throw error;
        setProfile(data);
      } catch (e) {
        console.warn('[UserPublicScreen] fetch error', e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Cargando…</div>;
  if (!profile) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Perfil no encontrado</div>;

  return (
    <div style={{ minHeight: '100vh', padding: '1rem', color: '#fff' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <section style={{
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,.12)',
          background: 'linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02))',
          padding: '1rem',
          boxShadow: '0 8px 32px rgba(0,0,0,.3)'
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', opacity: .8 }}>👤</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{profile.display_name || 'Usuario'}</h1>
              {profile.bio && <div style={{ opacity: .85, marginTop: 6 }}>{profile.bio}</div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


