import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";

interface AcademyCardProps {
  item: any;
}

export default function AcademyCard({ item }: AcademyCardProps) {
  const id = item.id;
  const nombre = item.nombre_publico || item.nombre || "Academia";
  const bio = item.bio || "";
  const avatar = item.avatar_url || null;

  return (
    <LiveLink to={urls.academyLive(id)} asCard={false}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative',
          borderRadius: 16,
          background: 'rgba(18, 18, 24, 0.96)',
          border: '1px solid rgba(30,136,229,0.25)',
          padding: 16,
          cursor: 'pointer',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(30,136,229,0.35)', background: 'rgba(30,136,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {avatar ? (
              <img src={avatar} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 20 }}>🎓</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#F5F5F5', fontWeight: 700, fontSize: 16, lineHeight: 1.25 }}>{nombre}</div>
            {bio && (
              <div style={{ color: 'rgba(245,245,245,0.7)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bio}</div>
            )}
          </div>
        </div>

        {item.ritmos?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {item.ritmos.slice(0, 3).map((_: any, i: number) => (
              <span key={i} style={{ fontSize: 11, color: '#F5F5F5', background: 'rgba(30,136,229,0.12)', border: '1px solid rgba(30,136,229,0.25)', padding: '4px 8px', borderRadius: 8 }}>🎵 Ritmo</span>
            ))}
            {item.zonas?.slice(0, 2).map((_: any, i: number) => (
              <span key={`z-${i}`} style={{ fontSize: 11, color: '#F5F5F5', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '4px 8px', borderRadius: 8 }}>📍 Zona</span>
            ))}
          </div>
        )}
      </motion.div>
    </LiveLink>
  );
}
