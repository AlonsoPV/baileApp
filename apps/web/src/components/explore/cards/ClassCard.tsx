import React from 'react';
import { motion } from 'framer-motion';
import LiveLink from '../../LiveLink';
import { urls } from '../../../lib/urls';
import { useTags } from '../../../hooks/useTags';
import { RITMOS_CATALOG } from '../../../lib/ritmosCatalog';

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
  ownerCoverUrl?: string;
  ritmos?: number[];
  ritmosSeleccionados?: string[];
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
  minHeight: '280px',
  height: '350px',
  justifyContent: 'flex-end',
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
  color: 'rgba(255,255,255,0.92)',
  border: '1px solid rgb(255 255 255 / 48%)',
  background: 'rgb(25 25 25 / 89%)',
  padding: 8,
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
    ? (item.ownerId ? `/clase/academy/${item.ownerId}` : '/clase?type=academy')
    : (item.ownerId ? `/clase/teacher/${item.ownerId}` : '/clase?type=teacher');
  const normalizeUrl = (u?: string) => {
    if (!u) return u;
    const v = String(u).trim();
    if (/^https?:\/\//i.test(v) || v.startsWith('/')) return v;
    if (/^\d+x\d+(\/.*)?$/i.test(v)) return `https://via.placeholder.com/${v}`;
    if (/^[0-9A-Fa-f]{6}(\/|\?).*/.test(v)) return `https://via.placeholder.com/800x400/${v}`;
    return v;
  };
  const bg = normalizeUrl(item.ownerCoverUrl as any);
  const { data: allTags } = useTags() as any;

  const ritmoNames: string[] = React.useMemo(() => {
    try {
      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
      const catalogIds = (item.ritmosSeleccionados || []) as string[];
      if (Array.isArray(catalogIds) && catalogIds.length > 0) {
        return catalogIds.map(id => labelByCatalogId.get(id)!).filter(Boolean) as string[];
      }
      const nums = (item.ritmos || []) as number[];
      if (Array.isArray(allTags) && nums.length > 0) {
        return nums
          .map((id: number) => allTags.find((t: any) => t.id === id && t.tipo === 'ritmo'))
          .filter(Boolean)
          .map((t: any) => t.nombre as string);
      }
    } catch {}
    return [] as string[];
  }, [item, allTags]);

  return (
    <LiveLink to={href} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        style={{
          ...card,
          backgroundImage: bg ? `url(${bg})` : undefined,
          backgroundSize: bg ? 'cover' : undefined,
          backgroundPosition: bg ? 'center' : undefined,
          backgroundRepeat: bg ? 'no-repeat' : undefined
        }}
      >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)', opacity: 0.9 }} />
      {/* Overlay como en EventCard: solo si no hay background */}
      {!bg && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.80) 100%)', zIndex: 0, pointerEvents: 'none' }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
      {/*   <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #f093fb, #f5576c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontWeight: 700, color: '#fff',
          boxShadow: '0 4px 16px rgba(240, 147, 251, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.1)'
        }}>📚</div> */}
        <h3 style={{
          margin: 0,
          fontSize: '1.375rem',
          fontWeight: 700,
          lineHeight: 1.2
        }}>
          <span style={{
            display: 'inline-block',
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#fff',
            textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px'
          }}>
            {item.titulo || 'Clase'}
          </span>
        </h3>
      </div>

        {item.ownerName && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', position: 'relative', zIndex: 1 }}>por <strong style={{ color: '#fff' }}>{item.ownerName}</strong></div>
        )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, position: 'relative', zIndex: 1 }}>
        {ritmoNames.length > 0 && (
          <>
            {ritmoNames.slice(0, 3).map((name, i) => (
              <span key={`r-${i}`} style={chip}>🎵 {name}</span>
            ))}
          </>
        )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
          <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: 8, borderRadius: 999, fontSize: 13, color: 'rgba(255,255,255,0.9)', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            📍 {item.ubicacion}
          </span>
        </div>
      )}

      {/* CTA subtle */}
     {/*  <div style={{ display: 'inline', alignItems: 'center', gap: 8, marginTop: 10, position: 'relative', zIndex: 1 }}>
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
        }}>Más Información →</div>
      </div> */}
      <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
    </LiveLink>
  );
}


