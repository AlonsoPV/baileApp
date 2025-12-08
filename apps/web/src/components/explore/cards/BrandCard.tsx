import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { normalizeAndOptimizeUrl } from "../../../utils/imageOptimization";

type Props = { item: any };

export default function BrandCard({ item }: Props) {
  const { data: allTags } = useTags() as any;
  const id = item.id;
  const nombre = item.nombre_publico || item.nombre || "Marca";
  const bio = item.bio || "";
  const cover = normalizeAndOptimizeUrl((item.portada_url)
    || (Array.isArray(item.media) ? ((item.media[0] as any)?.url || (item.media[0] as any)?.path || (item.media[0] as any)) : undefined)
    || item.avatar_url || undefined) as string | undefined;
  const ritmoNombres: string[] = (item.ritmos || [])
    .map((rid: number) => allTags?.find((t: any) => t.id === rid && t.tipo === 'ritmo')?.nombre)
    .filter(Boolean);
  const zonaNombres: string[] = (item.zonas || [])
    .map((zid: number) => allTags?.find((t: any) => t.id === zid && t.tipo === 'zona')?.nombre)
    .filter(Boolean);

  // Cache-busting para la portada de la marca
  const coverCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.id as string | number | undefined) ||
    (item.nombre_publico as string | undefined) ||
    '';

  const coverWithCacheBust = React.useMemo(() => {
    if (!cover) return undefined;
    const separator = String(cover).includes('?') ? '&' : '?';
    const key = encodeURIComponent(String(coverCacheKey ?? ''));
    return `${cover}${separator}_t=${key}`;
  }, [cover, coverCacheKey]);

  return (
    <>
      <style>{`
        .brand-card-mobile {
          width: 100%;
        }
        @media (max-width: 768px) {
          .brand-card-mobile {
            aspect-ratio: 9 / 16 !important;
            height: auto !important;
            min-height: auto !important;
            max-width: calc((9 / 16) * 100vh);
            margin: 0 auto;
          }
          .brand-card-mobile[style*="background"] {
            background-size: contain !important;
            background-position: center center !important;
            background-repeat: no-repeat !important;
          }
        }
      `}</style>
      <LiveLink to={urls.brandLive(id)} asCard={false}>
        <motion.div
          className="brand-card-mobile"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
          style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: (coverWithCacheBust || cover)
            ? `url(${coverWithCacheBust || cover})`
            : 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)', opacity: 0.9 }} />
        {/* Overlay solo si NO hay imagen */}
        {!cover && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.80) 100%)', zIndex: 0, pointerEvents: 'none' }} />
        )}
        {/* Título y meta, alineado con EventCard */}
        <div style={{ position: 'relative', zIndex: 1 }}>
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
              {nombre}
            </span>
          </div>
          {bio && (
            <div style={{ fontSize: 12, marginBottom: 10, color: 'rgba(255,255,255,0.78)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
              {bio}
            </div>
          )}
        </div>

        {(ritmoNombres.length > 0 || zonaNombres.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {ritmoNombres.slice(0,3).map((name: string, i: number) => (
              <span key={`r-${i}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.92)', background: 'rgb(25 25 25 / 89%)', border: '1px solid rgb(255 255 255 / 48%)', padding: 8, borderRadius: 999 }}>🎵 {name}</span>
            ))}
            {zonaNombres.slice(0,2).map((name: string, i: number) => (
              <span key={`z-${i}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.92)', background: 'rgb(25 25 25 / 89%)', border: '1px solid rgb(255 255 255 / 48%)', padding: 8, borderRadius: 999 }}>📍 {name}</span>
            ))}
          </div>
        )}

        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
      </LiveLink>
    </>
  );
}


