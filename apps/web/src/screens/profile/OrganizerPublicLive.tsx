import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import ImageWithFallback from '@/components/ImageWithFallback';
import RitmosChips from '@/components/RitmosChips';
import { PHOTO_SLOTS, getMediaBySlot } from '@/utils/mediaSlots';

export default function OrganizerPublicLive() {
  const { id, organizerId } = useParams();
  const navigate = useNavigate();
  const rawId = (id as string) || (organizerId as string) || '';
  const [org, setOrg] = React.useState<any | null>(null);
  const [media, setMedia] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('profiles_organizer').select('*').eq('id', rawId).maybeSingle();
        if (error) throw error;
        setOrg(data);
        setMedia((data?.media as any[]) || []);
      } catch (e) {
        setOrg(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [rawId]);

  if (!rawId) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Falta id</div>;
  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Cargando…</div>;
  if (!org) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Organizador no encontrado</div>;

  const cover = getMediaBySlot(media as any, 'cover')?.url || getMediaBySlot(media as any, 'p1')?.url;
  const carouselPhotos = PHOTO_SLOTS.map(s => getMediaBySlot(media as any, s)?.url).filter(Boolean) as string[];

  return (
    <div className="date-public-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)', padding: '24px 0' }}>
      <style>{`
        .date-public-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .glass { border-radius: 18px; background: linear-gradient(135deg, rgba(40,30,45,0.92), rgba(30,20,40,0.92)); border: 1px solid rgba(240,147,251,0.18); box-shadow: 0 10px 28px rgba(0,0,0,0.35); padding: 1.25rem; }
      `}</style>
      <div className="date-public-inner">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="glass" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.9)' }}>
              {cover ? (
                <ImageWithFallback src={cover} alt={org?.nombre_publico} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 36 }}>🎤</div>
              )}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{org?.nombre_publico || 'Organizador'}</h1>
              {Array.isArray(org?.ritmos_seleccionados) && org.ritmos_seleccionados.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <RitmosChips selected={org.ritmos_seleccionados as string[]} onChange={() => {}} readOnly />
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {carouselPhotos.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="glass">
            <h3 style={{ marginTop: 0, color: '#fff' }}>📷 Galería</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {carouselPhotos.map((src, i) => (
                <ImageWithFallback key={i} src={src} alt={`Foto ${i + 1}`} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}


