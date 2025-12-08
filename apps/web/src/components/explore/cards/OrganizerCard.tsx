import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { normalizeAndOptimizeUrl } from "../../../utils/imageOptimization";
import { getMediaBySlot } from "../../../utils/mediaSlots";

interface OrganizerCardProps {
  item: any;
}

export default function OrganizerCard({ item }: OrganizerCardProps) {
  // Priorizar foto 1 de avatar (slot 'p1'), luego slot 'avatar', luego avatar_url, luego portada, luego cover
  const bannerUrl: string | undefined = (() => {
    const mediaList = Array.isArray(item?.media) ? item.media : [];
    
    // 1. Prioridad: slot 'p1' (foto 1 de avatar)
    const slotP1 = getMediaBySlot(mediaList as any, 'p1');
    if (slotP1?.url) {
      return normalizeAndOptimizeUrl(slotP1.url as string) as string;
    }
    
    // 2. Slot 'avatar'
    const slotAvatar = getMediaBySlot(mediaList as any, 'avatar');
    if (slotAvatar?.url) {
      return normalizeAndOptimizeUrl(slotAvatar.url as string) as string;
    }
    
    // 3. avatar_url directo
    if (item?.avatar_url) {
      return normalizeAndOptimizeUrl(item.avatar_url);
    }
    
    // 4. portada_url
    if (item?.portada_url) {
      return normalizeAndOptimizeUrl(item.portada_url);
    }
    
    // 5. Slot 'cover'
    const slotCover = getMediaBySlot(mediaList as any, 'cover');
    if (slotCover?.url) {
      return normalizeAndOptimizeUrl(slotCover.url as string) as string;
    }
    
    // 6. Fallback: primer media
    if (mediaList.length > 0) {
      const first = mediaList[0];
      return normalizeAndOptimizeUrl(first?.url || first?.path || (typeof first === 'string' ? first : undefined));
    }
    
    return undefined;
  })();

  // Cache-busting para la imagen del organizador
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

  return (
    <>
      <style>{`
        .organizer-card-mobile {
          width: 100%;
        }
        @media (max-width: 768px) {
          .organizer-card-mobile {
            aspect-ratio: 9 / 16 !important;
            height: auto !important;
            min-height: auto !important;
            max-width: calc((9 / 16) * 100vh);
            margin: 0 auto;
          }
        }
      `}</style>
      <LiveLink to={`/organizer/${item.id}`} asCard={false}>
        <motion.div
          className="organizer-card-mobile"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{
            scale: 1.03,
            y: -8,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
          style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: (bannerUrlWithCacheBust || bannerUrl)
            ? `url(${bannerUrlWithCacheBust || bannerUrl})`
            : 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
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
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)',
          opacity: 0.9
        }} />
        {/* Overlay global solo si NO hay banner */}
        {!bannerUrl && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.80) 100%)', zIndex: 0, pointerEvents: 'none' }} />
        )}

        {/* Contenido sobre el fondo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Título con alta legibilidad (igual a EventCard) */}
          <div style={{
            fontSize: '1.375rem', fontWeight: 700, letterSpacing: 0.2, marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.3
          }}>
            <span style={{
              flex: 1,
              color: '#fff',
              textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px',
              wordBreak: 'break-word',
              lineHeight: 1.3
            }}>
              {item.nombre_publico}
            </span>
       {/*      {item?.estado_aprobacion === 'aprobado' && (
              <span style={{
                marginLeft: 8,
                border: '1px solid rgb(255 255 255 / 40%)',
                background: 'rgb(25 25 25 / 70%)',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                color: '#9be7a1',
                whiteSpace: 'nowrap'
              }}>
                ✅ Verificado
              </span>
            )} */}
          </div>

          {/* Chips de ritmos y zonas removidos según requerimiento */}
        </div>
        
        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
      </LiveLink>
    </>
  );
}

