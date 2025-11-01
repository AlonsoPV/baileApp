import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import AddToCalendarWithStats from '../../components/AddToCalendarWithStats';
import RequireLogin from '@/components/auth/RequireLogin';

type CronoItem = {
  tipo?: 'clase' | 'paquete' | 'coreografia' | 'show' | 'otro' | string;
  titulo?: string;
  inicio?: string;
  fin?: string;
  nivel?: string;
  referenciaCosto?: string;
};

type CostoItem = {
  nombre?: string;
  tipo?: string;
  precio?: number | null;
  regla?: string;
};

type Ubicacion = {
  nombre?: string;
  lugar?: string;
  direccion?: string;
  ciudad?: string;
  referencias?: string;
};

type Props = {
  cronograma?: CronoItem[];
  costos?: CostoItem[];
  ubicacion?: Ubicacion;
  title?: string;
  showCalendarButton?: boolean;
};

const iconFor = (tipo?: string) => {
  if (tipo === 'clase') return '📚';
  if (tipo === 'paquete') return '🧾';
  if (tipo === 'coreografia') return '🎬';
  if (tipo === 'show') return '🎭';
  return '🗂️';
};

export default function ClasesLive({ cronograma = [], costos = [], ubicacion, title = 'Clases & Tarifas', showCalendarButton = false }: Props) {
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

  const items = useMemo(() => {
    return (cronograma || []).map(i => {
      const ref = (i.referenciaCosto || i.titulo || '').trim().toLowerCase();
      const match = ref ? (costoIndex.get(ref) ?? []) : [];
      return { ...i, costos: match } as CronoItem & { costos?: CostoItem[] };
    });
  }, [cronograma, costoIndex]);

  const hasUbicacion = Boolean(
    ubicacion?.nombre || ubicacion?.lugar || ubicacion?.direccion || ubicacion?.ciudad || ubicacion?.referencias
  );

  return (
    <div>
      

      {/* Ubicación */}
    {/*   {hasUbicacion && (
        <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span>📍</span>
            <strong>Ubicación</strong>
          </div>
          {ubicacion?.nombre || ubicacion?.lugar ? <div style={{ fontSize: 14 }}>{ubicacion?.nombre || ubicacion?.lugar}</div> : null}
          {ubicacion?.direccion ? <div style={{ fontSize: 13, opacity: 0.85 }}>{ubicacion.direccion}</div> : null}
          {ubicacion?.ciudad ? <div style={{ fontSize: 12, opacity: 0.7 }}>{ubicacion.ciudad}</div> : null}
          {ubicacion?.referencias ? <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>💡 {ubicacion.referencias}</div> : null}
        </div>
      )} */}

      {/* Lista de clases */}
      <div style={{ display: 'grid', gap: 16 }}>
        {items.map((it, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 8px 24px rgba(229, 57, 53, 0.2)'
            }}
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 16,
              padding: '1.25rem 1.5rem',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Icono destacado */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(229, 57, 53, 0.2), rgba(251, 140, 0, 0.2))',
              border: '2px solid rgba(229, 57, 53, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(229, 57, 53, 0.25)'
            }}>
              {iconFor(it.tipo)}
            </div>
            
            {/* Contenido */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <h4 style={{
                  margin: 0,
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.95)',
                  letterSpacing: '0.3px'
                }}>
                  {it.titulo || 'Clase'}
                </h4>
                {it.nivel && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {it.nivel}
                  </span>
                )}
              </div>
              
              <div style={{
                marginBottom: 10,
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.85)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ fontSize: 16 }}>🕒</span>
                <span style={{ fontWeight: 500 }}>
                  {it.inicio || '—'} – {it.fin || '—'}
                </span>
              </div>
              
              {it.costos && it.costos.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  {it.costos.map((c, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.03 + i * 0.05 }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        border: '1px solid rgba(255, 209, 102, 0.4)',
                        borderRadius: 12,
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, rgba(255, 209, 102, 0.15), rgba(255, 140, 66, 0.15))',
                        color: '#FFD166',
                        boxShadow: '0 2px 8px rgba(255, 209, 102, 0.2)'
                      }}
                    >
                      <span style={{ fontSize: 14 }}>💰</span>
                      <strong>{c.precio !== undefined && c.precio !== null ? `$${c.precio.toLocaleString()}` : 'Gratis'}</strong>
                    </motion.span>
                  ))}
                </div>
              )}
            </div>
            {showCalendarButton && (
              <div
                style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative', zIndex: 5, pointerEvents: 'auto' }}
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const buildTimeDate = (time?: string) => {
                    const base = new Date();
                    const hhmm = (time || '').split(':').slice(0, 2).join(':');
                    const [hh, mm] = hhmm && hhmm.includes(':') ? hhmm.split(':').map(n => parseInt(n, 10)) : [20, 0];
                    base.setHours(isNaN(hh) ? 20 : hh, isNaN(mm) ? 0 : mm, 0, 0);
                    return base;
                  };
                  const start = buildTimeDate((it as any).inicio);
                  const end = (() => {
                    const e = buildTimeDate((it as any).fin);
                    if (e.getTime() <= start.getTime()) {
                      const plus = new Date(start);
                      plus.setHours(plus.getHours() + 2);
                      return plus;
                    }
                    return e;
                  })();
                  const location = ubicacion?.nombre || ubicacion?.lugar || ubicacion?.direccion || ubicacion?.ciudad;
                  return (
                    <RequireLogin>
                      <AddToCalendarWithStats
                        eventId={`class-${idx}`}
                        title={(it as any).titulo || 'Clase'}
                        description={(it as any).nivel || ''}
                        location={location}
                        start={start}
                        end={end}
                        showAsIcon={true}
                      />
                    </RequireLogin>
                  );
                })()}
              </div>
            )}
          {/*   {it.costos && it.costos.length === 1 && (
              <div style={{ textAlign: 'right', minWidth: 90 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{it.costos[0].tipo ?? ''}</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>
                  {it.costos[0].precio !== undefined && it.costos[0].precio !== null ? `$${it.costos[0].precio!.toLocaleString()}` : 'Gratis'}
                </div>
              </div>
            )} */}
          </motion.div>
        ))}
      </div>

    </div>
  );
}


