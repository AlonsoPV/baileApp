import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";

type Props = { item: any };

export default function BrandCard({ item }: Props) {
  const { data: allTags } = useTags() as any;
  const id = item.id;
  const nombre = item.nombre_publico || item.nombre || "Marca";
  const bio = item.bio || "";
  const avatar = (item.portada_url)
    || (Array.isArray(item.media) ? (item.media[0]?.url || item.media[0]) : undefined)
    || item.avatar_url || null;
  const ritmoNombres: string[] = (item.ritmos || [])
    .map((rid: number) => allTags?.find((t: any) => t.id === rid && t.tipo === 'ritmo')?.nombre)
    .filter(Boolean);
  const zonaNombres: string[] = (item.zonas || [])
    .map((zid: number) => allTags?.find((t: any) => t.id === zid && t.tipo === 'zona')?.nombre)
    .filter(Boolean);

  return (
    <LiveLink to={urls.brandLive(id)} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
          padding: '1.5rem',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(240, 147, 251, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(240, 147, 251, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)', opacity: 0.9 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {avatar ? (
              <img src={avatar} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 20 }}>🏷️</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.25, background: 'linear-gradient(135deg, #f093fb, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{nombre}</div>
            {bio && (
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bio}</div>
            )}
          </div>
        </div>

        {(ritmoNombres.length > 0 || zonaNombres.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {ritmoNombres.slice(0,3).map((name: string, i: number) => (
              <span key={`r-${i}`} style={{ fontSize: 11, color: '#F5F5F5', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', padding: '4px 8px', borderRadius: 8 }}>🎵 {name}</span>
            ))}
            {zonaNombres.slice(0,2).map((name: string, i: number) => (
              <span key={`z-${i}`} style={{ fontSize: 11, color: '#F5F5F5', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '4px 8px', borderRadius: 8 }}>📍 {name}</span>
            ))}
          </div>
        )}
      </motion.div>
    </LiveLink>
  );
}


