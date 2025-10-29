import React from 'react';
import { motion } from 'framer-motion';
import LiveLink from '../../LiveLink';
import { urls } from '../../../lib/urls';

type ClaseItem = {
  titulo?: string;
  fecha?: string; // YYYY-MM-DD si específica
  diasSemana?: string[]; // si semanal
  inicio?: string; // HH:MM
  fin?: string;    // HH:MM
  ubicacion?: string;
  ownerType?: 'academy' | 'teacher';
  ownerId?: number | string;
  ownerName?: string;
};

interface Props {
  item: ClaseItem;
}

const card: React.CSSProperties = {
  position: 'relative',
  borderRadius: 16,
  background: 'linear-gradient(135deg, rgba(19,21,27,0.9), rgba(16,18,24,0.9))',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
  color: '#fff',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minHeight: 160
};

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  color: '#f5f5f5',
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.06)',
  padding: '4px 8px',
  borderRadius: 999
};

const fmtDate = (s?: string) => {
  if (!s) return '';
  try {
    const d = new Date(s);
    return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
  } catch {
    return s;
  }
};

export default function ClassCard({ item }: Props) {
  const isSemanal = Array.isArray(item.diasSemana) && item.diasSemana.length > 0 && !item.fecha;
  const href = item.ownerType === 'academy'
    ? `${urls.academyLive(item.ownerId || '')}#clases`
    : `${urls.teacherLive(item.ownerId || '')}#clases`;

  return (
    <LiveLink to={href} asCard={false}>
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} style={card}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #1E88E5, #7C4DFF, #FF7043)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1E88E5,#7C4DFF)', display: 'grid', placeItems: 'center' }}>📚</div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, lineHeight: 1.2 }}>{item.titulo || 'Clase'}</h3>
      </div>

        {item.ownerName && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>por <strong style={{ color: '#fff' }}>{item.ownerName}</strong></div>
        )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        {isSemanal ? (
          <span style={chip}>🗓️ {item.diasSemana!.join(', ')}</span>
        ) : (
          item.fecha && <span style={chip}>🗓️ {fmtDate(item.fecha)}</span>
        )}
        {(item.inicio || item.fin) && (
          <span style={chip}>🕒 {item.inicio || '—'}{item.fin ? ` - ${item.fin}` : ''}</span>
        )}
      </div>

      {item.ubicacion && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
          <span>📍</span>
          <span>{item.ubicacion}</span>
        </div>
      )}
      </motion.div>
    </LiveLink>
  );
}


