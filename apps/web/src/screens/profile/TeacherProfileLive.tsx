import React from 'react';
import { motion } from 'framer-motion';
import { useUserProfile } from '../../hooks/useUserProfile';
import SocialMediaSection from '../../components/profile/SocialMediaSection';
import { useTags } from '../../hooks/useTags';

const colors = {
  coral: '#FF3D57',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function TeacherProfileLive() {
  const { profile, isLoading } = useUserProfile();
  const { ritmos = [], zonas = [] } = useTags() as any;

  const getRitmoNombres = (ids: number[] = []) =>
    ids.map(id => ritmos.find((t: any) => t.id === id)?.nombre).filter(Boolean) as string[];

  const getZonaNombres = (ids: number[] = []) =>
    ids.map(id => zonas.find((t: any) => t.id === id)?.nombre).filter(Boolean) as string[];

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: colors.dark, color: colors.light }}>
        ⏳ Cargando…
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: colors.dark, color: colors.light }}>
        No se encontró el perfil
      </div>
    );
  }

  const ritmoNombres = getRitmoNombres(profile.ritmos);
  const zonaNombres = getZonaNombres(profile.zonas);

  return (
    <div style={{ minHeight: '100vh', background: colors.dark, color: colors.light }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)'
          }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 32 }}>🎓</div>
            )}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{profile.display_name || 'Maestro'}</h1>
            {profile.bio && (
              <p style={{ margin: '6px 0 0 0', opacity: 0.8 }}>{profile.bio}</p>
            )}
          </div>
        </header>

        {/* Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {ritmoNombres.map((n) => (
            <span key={`r-${n}`} style={{ padding: '6px 10px', borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>🎵 {n}</span>
          ))}
          {zonaNombres.map((n) => (
            <span key={`z-${n}`} style={{ padding: '6px 10px', borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>📍 {n}</span>
          ))}
        </div>

        {/* Redes sociales */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', marginBottom: 16 }}>
          <SocialMediaSection
            availablePlatforms={[ 'instagram','tiktok','youtube','facebook','whatsapp' ]}
            respuestas={{ redes: (profile as any)?.respuestas?.redes || {} }}
          />
        </motion.div>

        {/* Galería simple */}
        {(profile as any).media?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)' }}>
            <h3 style={{ marginTop: 0 }}>📸 Galería</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {(profile as any).media.map((m: any, i: number) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
                  {m.type === 'video' ? (
                    <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


