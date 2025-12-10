import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { getMediaBySlot } from "../../../utils/mediaSlots";
import { normalizeAndOptimizeUrl } from "../../../utils/imageOptimization";

export default function TeacherCard({ item }: { item: any }) {
  const { data: allTags } = useTags() as any;

  // Nombre robusto: aceptar múltiples campos antes de caer en el fallback
  const displayName =
    item.nombre_publico ||
    item.teacher_name ||
    item.nombre ||
    item.name ||
    "Maestr@";

  // Resolver una URL de imagen robusta (avatar/banner/primer media o por slot)
  const bannerUrl: string | undefined = (() => {
    
    const mediaList = Array.isArray(item?.media) ? item.media : [];
    const slotP1 = getMediaBySlot(mediaList as any, 'p1');
    if (slotP1?.url) {
      return normalizeAndOptimizeUrl(slotP1.url as string) as string;
    }
    // Intentar múltiples claves comunes
    const direct = item?.avatar_url || item?.banner_url || item?.portada_url || item?.avatar || item?.portada || item?.banner;
    
    if (direct) {
      return normalizeAndOptimizeUrl(direct as string) as string;
    }
   
    if (mediaList.length) {
      // Buscar por slot común
      const bySlot = mediaList.find((m: any) => m?.slot === 'cover' || m?.slot === 'avatar');
      
      if (bySlot?.url) {
        return normalizeAndOptimizeUrl(bySlot.url as string) as string;
      }
      if (bySlot?.path) {
        return normalizeAndOptimizeUrl(bySlot.path as string) as string;
      }
      const first = mediaList[0];
      return normalizeAndOptimizeUrl(first?.url || first?.path || (typeof first === 'string' ? first : undefined)) as string | undefined;
    }
    
    return undefined;
  })();

  // Cache-busting para la portada del maestro
  const bannerCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.id as string | number | undefined) ||
    (item.nombre_publico as string | undefined) ||
    '';

  const bannerUrlWithCacheBust = React.useMemo(() => {
    if (!bannerUrl) return undefined;
    const separator = String(bannerUrl).includes('?') ? '&' : '?';
    const key = encodeURIComponent(String(bannerCacheKey ?? ''));
    return `${bannerUrl}${separator}_t=${key}`;
  }, [bannerUrl, bannerCacheKey]);
  const ritmoNombres: string[] = (item.ritmos || [])
    .map((rid: number) => allTags?.find((t: any) => t.id === rid && t.tipo === 'ritmo')?.nombre)
    .filter(Boolean);
  const zonaNombres: string[] = (item.zonas || [])
    .map((zid: number) => allTags?.find((t: any) => t.id === zid && t.tipo === 'zona')?.nombre)
    .filter(Boolean);
  return (
    <>
      <style>{`
        .teacher-card-mobile {
          width: 100%;
        }
        @media (max-width: 768px) {
          .teacher-card-mobile {
            aspect-ratio: 9 / 16 !important;
            height: auto !important;
            min-height: auto !important;
            max-width: calc((9 / 16) * 100vh);
            margin: 0 auto;
          }
        }
      `}</style>
      <LiveLink to={urls.teacherLive(item.id)} asCard={false}>
        <motion.div
          className="teacher-card-mobile"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
          style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: (bannerUrlWithCacheBust || bannerUrl)
            ? `url(${bannerUrlWithCacheBust || bannerUrl})`
            : 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          padding: '1.5rem',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(240, 147, 251, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(240, 147, 251, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '350px',
          height: '350px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}
      >
        {/* Top gradient bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)', opacity: 0.9 }} />
        {/* Overlay global solo si NO hay banner */}
        {!bannerUrl && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.80) 100%)', zIndex: 0, pointerEvents: 'none' }} />
        )}
        {/* Overlay para mejorar legibilidad del nombre cuando hay imagen */}
        {bannerUrl && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.7) 100%)', zIndex: 0, pointerEvents: 'none' }} />
        )}
        {/* Contenido principal: nombre/bio arriba de las chips */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            lineHeight: 1.3,
            color: '#fff',
            textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px',    
            marginBottom: 2,
            wordBreak: 'break-word',
            padding: '6px 10px',
            borderRadius: 10
          }}>
            {displayName}
          </div>
          {item.bio && (
            <div style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.82)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4
            }}>
              {item.bio}
            </div>
          )}
        </div>

        {(ritmoNombres.length > 0 || zonaNombres.length > 0) && (
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {ritmoNombres.slice(0, 3).map((name: string, i: number) => (
              <span key={`r-${i}`} style={{ fontSize: 11, color: 'rgba(255,255,255,0.92)', background: 'rgb(25 25 25 / 89%)', border: '1px solid rgb(255 255 255 / 48%)', padding: 8, borderRadius: 999 }}>🎵 {name}</span>
            ))}
            {zonaNombres.slice(0, 2).map((name: string, i: number) => (
              <span key={`z-${i}`} style={{ fontSize: 11, color: 'rgba(255,255,255,0.92)', background: 'rgb(25 25 25 / 89%)', border: '1px solid rgb(255 255 255 / 48%)', padding: 8, borderRadius: 999 }}>📍 {name}</span>
            ))}
          </div>
        )}
        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
      </LiveLink>
    </>
  );
}

