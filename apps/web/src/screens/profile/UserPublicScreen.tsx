import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import ImageWithFallback from '@/components/ImageWithFallback';
import RitmosChips from '@/components/RitmosChips';
import SocialMediaSection from '@/components/profile/SocialMediaSection';
import { useTags } from '@/hooks/useTags';
import { Chip } from '@/components/profile/Chip';

export default function UserPublicScreen() {
  const { userId: userIdFromParams } = useParams();
  const { search } = useLocation();
  const userId = (() => {
    const q = new URLSearchParams(search);
    return (userIdFromParams as string) || q.get('userId') || '';
  })();
  const [profile, setProfile] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { data: allTags } = useTags();

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles_user')
          .select('user_id, display_name, bio, avatar_url, ritmos, ritmos_seleccionados, zonas, respuestas, media')
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

  const toSupabasePublicUrl = (maybePath?: string): string | undefined => {
    if (!maybePath) return undefined;
    const v = String(maybePath).trim();
    if (/^https?:\/\//i.test(v) || v.startsWith('data:') || v.startsWith('/')) return v;
    const slash = v.indexOf('/');
    if (slash > 0) {
      const bucket = v.slice(0, slash);
      const path = v.slice(slash + 1);
      try { const { data } = supabase.storage.from(bucket).getPublicUrl(path); return data.publicUrl || v; } catch { return v; }
    }
    return v;
  };

  const media: any[] = Array.isArray(profile.media) ? profile.media : [];
  const slot = (s: string) => {
    const bySlot: any = media.find((m: any) => m?.slot === s);
    return bySlot?.url ? toSupabasePublicUrl(bySlot.url) : (bySlot?.path ? toSupabasePublicUrl(bySlot.path) : undefined);
  };
  const avatarUrl = slot('p1') || profile.avatar_url;
  const p2 = slot('p2');
  const p3 = slot('p3');
  const v1 = slot('v1');
  const galleryOthers: string[] = (Array.isArray(profile.media) ? profile.media : [])
    .filter((m: any) => m?.slot?.startsWith('p') && !['p1','p2','p3'].includes(m.slot))
    .map((m: any) => (m?.url ? toSupabasePublicUrl(m.url) : (m?.path ? toSupabasePublicUrl(m.path) : undefined)))
    .filter(Boolean) as string[];
  const zonaNames: string[] = (() => {
    try {
      const ids: number[] = (profile?.zonas || []) as number[];
      if (!Array.isArray(allTags)) return [] as string[];
      return ids
        .map((id: number) => allTags.find((t: any) => t.id === id && t.tipo === 'zona'))
        .filter(Boolean)
        .map((t: any) => t.nombre as string);
    } catch {}
    return [] as string[];
  })();

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d10', color: '#fff' }}>
      {/* CSS idéntico al de UserProfileLive */}
      <style>{`
        .profile-container { width: 100%; max-width: 900px; margin: 0 auto; }
        .profile-banner { width: 100%; max-width: 900px; margin: 0 auto; }
        .banner-grid { display: grid; grid-template-columns: auto 1fr; gap: 3rem; align-items: center; }
        .question-section { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center; }
        .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
        .section-title { font-size: 1.5rem; font-weight: 800; margin: 0 0 1rem 0; background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: flex; align-items: center; gap: .5rem; }
        .glass-card-container { opacity: 1; margin-bottom: 2rem; padding: 2rem; text-align: center; background: linear-gradient(135deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.02) 100%); border-radius: 20px; border: 1px solid rgba(255,255,255,.15); box-shadow: 0 8px 32px rgba(0,0,0,.3); backdrop-filter: blur(10px); transform: none; }
        @media (max-width: 768px) {
          .profile-container { max-width: 100% !important; padding: 1rem !important; }
          .profile-banner { border-radius: 0 !important; padding: 1.5rem 1rem !important; margin: 0 !important; }
          .banner-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; justify-items: center !important; text-align: center !important; }
          .banner-grid h1 { font-size: 2rem !important; line-height: 1.2 !important; }
          .banner-avatar { width: 150px !important; height: 150px !important; }
          .banner-avatar-fallback { font-size: 3.5rem !important; }
          .question-section { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .events-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .glass-card-container { padding: 1rem !important; margin-bottom: 1rem !important; border-radius: 16px !important; }
        }
        @media (max-width: 480px) {
          .banner-grid h1 { font-size: 1.75rem !important; }
          .banner-avatar { width: 120px !important; height: 120px !important; }
          .banner-avatar-fallback { font-size: 3rem !important; }
          .glass-card-container { padding: .75rem !important; border-radius: 12px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 120px' }}>
        <section className="glass-card-container" style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: 220, height: 220, borderRadius: '50%', overflow: 'hidden', border: '6px solid rgba(255,255,255,.9)', boxShadow: '0 12px 40px rgba(0,0,0,.8)', background: 'linear-gradient(135deg,#1E88E5,#00BCD4)' }}>
                {avatarUrl ? (
                  <ImageWithFallback src={avatarUrl} alt={profile.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '5rem' }}>👤</div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: 0 }}>{profile.display_name || 'Usuario'}</h1>
              {Array.isArray(profile.ritmos_seleccionados) && profile.ritmos_seleccionados.length > 0 ? (
                <RitmosChips selected={profile.ritmos_seleccionados} onChange={() => {}} readOnly />
              ) : null}
              {zonaNames.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {zonaNames.map((name) => (
                    <Chip key={`z-${name}`} label={name} icon="📍" variant="zona" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {profile.bio && (
          <section className="glass-card-container" style={{ marginTop: 16 }}>
            <h3 className="section-title">💬 Sobre mí</h3>
            <p style={{ lineHeight: 1.6, opacity: .9 }}>{profile.bio}</p>
          </section>
        )}

        <div>
          <SocialMediaSection respuestas={profile?.respuestas} availablePlatforms={['instagram','tiktok','youtube','facebook','whatsapp']} />
        </div>

        <section className="glass-card-container" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
            <div>
              <h3 className="section-title">💡 Dime un dato curioso de ti</h3>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,.08)', borderRadius: 12, border: '1px solid rgba(255,255,255,.15)' }}>
                {profile?.respuestas?.dato_curioso || 'Aún no hay dato curioso.'}
              </div>
            </div>
            <div>
              {p2 ? (
                <ImageWithFallback src={p2} alt="Foto personal" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
              ) : (
                <div style={{ width: '100%', height: '100%', minHeight: 220, background: 'rgba(255,255,255,.08)', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.7)' }}>📷 Sin foto</div>
              )}
            </div>
          </div>
        </section>

        <section className="glass-card-container" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
            <div>
              <h3 className="section-title">💃 ¿Qué es lo que más te gusta bailar?</h3>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,.08)', borderRadius: 12, border: '1px solid rgba(255,255,255,.15)' }}>
                {profile?.respuestas?.gusta_bailar || 'Aún no has compartido qué te gusta bailar.'}
              </div>
            </div>
            <div>
              {p3 ? (
                <ImageWithFallback src={p3} alt="Foto de baile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
              ) : (
                <div style={{ width: '100%', height: '100%', minHeight: 220, background: 'rgba(255,255,255,.08)', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.7)' }}>📷 Sin foto</div>
              )}
            </div>
          </div>
        </section>

        {v1 && (
          <section className="glass-card-container" style={{ marginTop: 16 }}>
            <h3 className="section-title">🎥 Video Principal</h3>
            <div style={{ width: '100%', maxWidth: 600, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,.1)', margin: '0 auto' }}>
              <video src={v1} controls style={{ width: '100%', height: 'auto', aspectRatio: '4 / 5', display: 'block', objectFit: 'contain', objectPosition: 'center' }} />
            </div>
          </section>
        )}

        {galleryOthers.length > 0 && (
          <section className="glass-card-container" style={{ marginTop: 16 }}>
            <h3 className="section-title">📷 Galería de Fotos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
              {galleryOthers.map((src, i) => (
                <ImageWithFallback key={`gal-${i}`} src={src} alt={`Foto ${i+1}`} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)' }} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}


