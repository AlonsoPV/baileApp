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
  flexDirection: 'column',
  color: '#fff'
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
    ? `/profile/academy/live#clases`
    : `${urls.teacherLive(item.ownerId || '')}#clases`;

  return (
    <LiveLink to={href} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        style={card}
      >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #f093fb, #f5576c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontWeight: 700, color: '#fff',
          boxShadow: '0 4px 16px rgba(240, 147, 251, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.1)'
        }}>📚</div>
        <h3 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, lineHeight: 1.2, background: 'linear-gradient(135deg, #f093fb, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{item.titulo || 'Clase'}</h3>
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

      {/* CTA subtle */}
      <div style={{ display: 'inline', alignItems: 'center', gap: 8, marginTop: 10 }}>
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
        }}>Ver clase →</div>
      </div>
      </motion.div>
    </LiveLink>
  );
}


