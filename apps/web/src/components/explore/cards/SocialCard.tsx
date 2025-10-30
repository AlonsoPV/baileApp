import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";

type SocialItem = {
  id?: number | string;
  nombre?: string;
  descripcion?: string | null;
  portada_url?: string | null;
  avatar_url?: string | null;
  media?: Array<{ url?: string } | string>;
  ubicaciones?: Array<{ nombre?: string; direccion?: string; ciudad?: string; referencias?: string }>;
};

export default function SocialCard({ item }: { item: SocialItem }) {
  const id = item?.id;
  const to = id ? `/social/${id}` : "#";
  const title = item?.nombre || "Social";
  const desc = item?.descripcion || "";

  const cover = (item?.portada_url
    || (Array.isArray(item?.media) && (item!.media![0] as any)?.url)
    || (Array.isArray(item?.media) && typeof item!.media![0] === 'string' && (item!.media![0] as string))
  ) as string | undefined;

  const firstLocation = Array.isArray(item?.ubicaciones) && item!.ubicaciones!.length > 0
    ? item!.ubicaciones![0]
    : undefined;
  const locationLabel = [firstLocation?.nombre, firstLocation?.ciudad || firstLocation?.direccion]
    .filter(Boolean)
    .join(" • ");

  return (
    <LiveLink to={to} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: cover
            ? `linear-gradient(135deg, rgba(30, 20, 40, 0.6), rgba(20, 10, 30, 0.7)), url(${cover})`
            : 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '1.5rem',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(240, 147, 251, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(240, 147, 251, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)', opacity: 0.9 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.80) 100%)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: '1.25rem', fontWeight: 800, letterSpacing: 0.2, marginBottom: 10,
            background: 'linear-gradient(135deg, #f093fb, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.25
          }}>
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
          </div>

          {desc && (
            <div style={{ fontSize: 12, marginBottom: 10, color: 'rgba(255,255,255,0.78)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
              {desc}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {locationLabel && (
              <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: 8, borderRadius: 999, fontSize: 13, color: 'rgba(255,255,255,0.9)', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                📍 {locationLabel}
              </span>
            )}
          </div>

          <div style={{ display: 'inline', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Descubre más del social</div>
            <div style={{
              padding: '8px 12px',
              borderRadius: 12,
              background: 'rgba(240, 147, 251, 0.1)',
              color: '#fff',
              margin: '10px 0',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.08)'
            }}>Ver más →</div>
          </div>
        </div>

        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
    </LiveLink>
  );
}


