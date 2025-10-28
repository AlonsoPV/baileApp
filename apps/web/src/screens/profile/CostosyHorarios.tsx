import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

type CronoItem = {
  tipo?: 'clase' | 'show' | 'otro';
  titulo?: string;
  inicio?: string;
  fin?: string;
  nivel?: string;
  referenciaCosto?: string;
};

type CostoItem = {
  nombre?: string;
  tipo?: 'preventa' | 'taquilla' | 'promo' | string;
  precio?: number | null;
  regla?: string;
};

type Ubicacion = {
  nombre?: string;
  lugar?: string;
  direccion?: string;
  ciudad?: string;
  zona?: string;
  referencias?: string;
};

interface Props {
  title?: string;
  date: {
    cronograma?: CronoItem[];
    costos?: CostoItem[];
  };
  ubicacion?: Ubicacion;
}

const iconFor = (tipo?: string) => {
  if (tipo === 'clase') return '📚';
  if (tipo === 'show') return '🎭';
  return '🗂️';
};

const priceIcon = (tipo?: string) => {
  if (tipo === 'preventa') return '🎫';
  if (tipo === 'taquilla') return '💰';
  return '🎁';
};

const fmtHora = (h?: string) => (h ? h : '—');

export default function CostosyHorarios({ title = 'Horarios & Costos', date, ubicacion }: Props) {
  const items = date?.cronograma ?? [];
  const costos = date?.costos ?? [];

  const costoIndex = useMemo(() => {
    const map = new Map<string, CostoItem[]>();
    for (const c of costos) {
      const key = (c.nombre || '').trim().toLowerCase();
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [costos]);

  const enriched = useMemo(() => {
    return items
      .filter(i => i)
      .map(i => {
        const refKey = (i.referenciaCosto || i.titulo || '').trim().toLowerCase();
        const match = refKey ? (costoIndex.get(refKey) ?? []) : [];
        return { ...i, costos: match } as CronoItem & { costos?: CostoItem[] };
      });
  }, [items, costoIndex]);

  const hasUbicacion = Boolean(
    ubicacion?.nombre || ubicacion?.lugar || ubicacion?.direccion || ubicacion?.ciudad || ubicacion?.referencias
  );
  const hasContenido = hasUbicacion || enriched.length > 0 || costos.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: 20,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>🗓️</span>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: 0.2 }}>
          {title}
        </h2>
      </div>

      {!hasContenido && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
          Aún no hay información de ubicación, horarios o costos.
        </div>
      )}

      {hasUbicacion && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>📍</span>
            <strong style={{ color: 'rgba(255,255,255,0.95)' }}>Ubicación</strong>
          </div>
          {ubicacion?.nombre || ubicacion?.lugar ? (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>{ubicacion?.nombre || ubicacion?.lugar}</div>
          ) : null}
          {ubicacion?.direccion ? (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{ubicacion.direccion}</div>
          ) : null}
          {ubicacion?.ciudad ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{ubicacion.ciudad}</div>
          ) : null}
          {ubicacion?.referencias ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>💡 {ubicacion.referencias}</div>
          ) : null}
        </div>
      )}

      {enriched.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enriched.map((item, idx) => (
            <motion.div
              key={`${item.titulo}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{iconFor(item.tipo)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
                    {item.titulo || 'Clase'}
                  </h3>
                  {item.nivel && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.85)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '2px 8px',
                        borderRadius: 999
                      }}
                    >
                      {item.nivel}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  🕒 {fmtHora(item.inicio)} – {fmtHora(item.fin)}
                </div>
                {item.costos && item.costos.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {item.costos.map((c, i) => (
                      <span
                        key={i}
                        title={c.regla || ''}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.9)',
                          border: '1px solid rgba(255,255,255,0.14)',
                          borderRadius: 10,
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.04)'
                        }}
                      >
                        <span>{priceIcon(c.tipo)}</span>
                        <strong style={{ fontWeight: 700 }}>
                          {c.precio !== undefined && c.precio !== null ? `$${c.precio.toLocaleString()}` : 'Gratis'}
                        </strong>
                        {c.nombre && <span style={{ opacity: 0.75 }}>· {c.nombre}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {item.costos && item.costos.length === 1 && (
                <div style={{ textAlign: 'right', minWidth: 90 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{item.costos[0].tipo ?? ''}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.95)' }}>
                    {item.costos[0].precio !== undefined && item.costos[0].precio !== null
                      ? `$${item.costos[0].precio!.toLocaleString()}`
                      : 'Gratis'}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {costos.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Otras opciones / pases:</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {costos.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{priceIcon(c.tipo)}</span>
                    <strong style={{ color: 'rgba(255,255,255,0.95)' }}>{c.nombre || 'Opción'}</strong>
                  </div>
                  {c.regla && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{c.regla}</span>}
                </div>
                <div style={{ fontWeight: 800, color: 'rgba(255,255,255,0.95)', fontSize: 16 }}>
                  {c.precio !== undefined && c.precio !== null ? `$${c.precio.toLocaleString()}` : 'Gratis'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}
