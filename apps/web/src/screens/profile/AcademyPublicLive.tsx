import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAcademyPublic } from '@/hooks/useAcademy';
import ImageWithFallback from '@/components/ImageWithFallback';
import RitmosChips from '@/components/RitmosChips';
import ClasesLive from '@/components/events/ClasesLive';
import { PHOTO_SLOTS, getMediaBySlot } from '@/utils/mediaSlots';

export default function AcademyPublicLive() {
  const { academyId } = useParams();
  const idNum = Number(academyId);
  const { data: academy, isLoading } = useAcademyPublic(!Number.isNaN(idNum) ? idNum : (undefined as any));

  if (!academyId) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Falta id</div>;
  if (isLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Cargando…</div>;
  if (!academy) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Academia no encontrada</div>;

  const media = (academy as any)?.media || [];
  const cover = getMediaBySlot(media as any, 'cover')?.url || getMediaBySlot(media as any, 'p1')?.url;
  const carouselPhotos = PHOTO_SLOTS.map(s => getMediaBySlot(media as any, s)?.url).filter(Boolean) as string[];

  return (
    <div className="date-public-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)', padding: '24px 0' }}>
      <style>{`.date-public-inner{max-width:1200px;margin:0 auto;padding:0 24px}.glass{border-radius:18px;background:linear-gradient(135deg,rgba(40,30,45,.92),rgba(30,20,40,.92));border:1px solid rgba(240,147,251,.18);box-shadow:0 10px 28px rgba(0,0,0,.35);padding:1.25rem}`}</style>
      <div className="date-public-inner">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="glass" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.9)' }}>
              {cover ? (
                <ImageWithFallback src={cover} alt={(academy as any)?.nombre_publico} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 36 }}>🎓</div>
              )}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{(academy as any)?.nombre_publico || 'Academia'}</h1>
              {Array.isArray((academy as any)?.ritmos_seleccionados) && (academy as any).ritmos_seleccionados.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <RitmosChips selected={((academy as any).ritmos_seleccionados || []) as string[]} onChange={() => {}} readOnly />
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="glass" style={{ marginBottom: 16 }}>
          <ClasesLive
            title=""
            cronograma={(academy as any)?.cronograma || []}
            costos={(academy as any)?.costos || []}
            ubicacion={{
              nombre: (academy as any)?.ubicaciones?.[0]?.nombre,
              direccion: (academy as any)?.ubicaciones?.[0]?.direccion,
              ciudad: (academy as any)?.ubicaciones?.[0]?.ciudad,
              referencias: (academy as any)?.ubicaciones?.[0]?.referencias
            }}
            showCalendarButton={true}
          />
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


