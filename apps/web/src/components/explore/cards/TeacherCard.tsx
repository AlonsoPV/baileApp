import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";

export default function TeacherCard({ item }: { item: any }) {
  const { data: allTags } = useTags() as any;
  const normalizeUrl = (u?: string) => {
    if (!u) return u;
    const v = String(u).trim();
    if (/^https?:\/\//i.test(v) || v.startsWith('/')) return v;
    if (/^\d+x\d+(\/.*)?$/i.test(v)) return `https://via.placeholder.com/${v}`;
    if (/^[0-9A-Fa-f]{6}(\/|\?).*/.test(v)) return `https://via.placeholder.com/800x400/${v}`;
    return v;
  };
  // Resolver una URL de imagen robusta (avatar/banner/primer media o por slot)
  const bannerUrl: string | undefined = (() => {
    // Intentar múltiples claves comunes
    const direct = item?.avatar_url || item?.banner_url || item?.portada_url || item?.avatar || item?.portada || item?.banner;
    if (direct) return normalizeUrl(direct as string) as string;
    const media = Array.isArray(item?.media) ? item.media : [];
    if (media.length) {
      // Buscar por slot común
      const bySlot = media.find((m: any) => m?.slot === 'cover' || m?.slot === 'p1' || m?.slot === 'avatar');
      if (bySlot?.url) return normalizeUrl(bySlot.url as string) as string;
      if (bySlot?.path) return normalizeUrl(bySlot.path as string) as string;
      const first = media[0];
      return normalizeUrl(first?.url || first?.path || (typeof first === 'string' ? first : undefined)) as string | undefined;
    }
    return undefined;
  })();
  const ritmoNombres: string[] = (item.ritmos || [])
    .map((rid: number) => allTags?.find((t: any) => t.id === rid && t.tipo === 'ritmo')?.nombre)
    .filter(Boolean);
  const zonaNombres: string[] = (item.zonas || [])
    .map((zid: number) => allTags?.find((t: any) => t.id === zid && t.tipo === 'zona')?.nombre)
    .filter(Boolean);
  return (
    <LiveLink to={urls.teacherLive(item.id)} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: bannerUrl
            ? `url(${bannerUrl})`
            : 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '1.5rem',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(240, 147, 251, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(240, 147, 251, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '280px',
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
      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: '1.375rem', fontWeight: 700, letterSpacing: 0.2, marginBottom: 10,
          background: 'linear-gradient(135deg, #f093fb, #FFD166)', WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.3
        }}>
          <span style={{
            flex: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            🎓 {item.nombre_publico || "Maestr@"}
          </span>
        </div>
      </div>
      
      <div style={{
        fontSize: '0.875rem',
        opacity: 0.8,
        marginBottom: '0.25rem'
      }}>
        {(item.ritmos || []).length} ritmos
      </div>
      
      {item.bio && (
        <div style={{
          fontSize: '0.875rem',
          marginTop: '0.5rem',
          color: 'rgba(255, 255, 255, 0.7)',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.6,
          flex: 1
        }}>
          {item.bio}
        </div>
      )}

      {(ritmoNombres.length > 0 || zonaNombres.length > 0) && (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {ritmoNombres.slice(0,3).map((name: string, i: number) => (
            <span key={`r-${i}`} style={{ fontSize: 11, color: 'rgba(255,255,255,0.92)', background: 'rgb(25 25 25 / 89%)', border: '1px solid rgb(255 255 255 / 48%)', padding: 8, borderRadius: 999 }}>🎵 {name}</span>
          ))}
          {zonaNombres.slice(0,2).map((name: string, i: number) => (
            <span key={`z-${i}`} style={{ fontSize: 11, color: 'rgba(255,255,255,0.92)', background: 'rgb(25 25 25 / 89%)', border: '1px solid rgb(255 255 255 / 48%)', padding: 8, borderRadius: 999 }}>📍 {name}</span>
          ))}
        </div>
      )}
      <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
    </LiveLink>
  );
}

