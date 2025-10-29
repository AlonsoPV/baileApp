import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

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
};

const iconFor = (tipo?: string) => {
  if (tipo === 'clase') return '📚';
  if (tipo === 'paquete') return '🧾';
  if (tipo === 'coreografia') return '🎬';
  if (tipo === 'show') return '🎭';
  return '🗂️';
};

export default function ClasesLive({ cronograma = [], costos = [], ubicacion, title = 'Clases & Tarifas' }: Props) {
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
      {hasUbicacion && (
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
      )}

      {/* Lista de clases */}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((it, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)'
            }}
          >
            <div style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{iconFor(it.tipo)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{it.titulo || 'Clase'}</h4>
                {it.nivel && (
                  <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)' }}>{it.nivel}</span>
                )}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, opacity: 0.9 }}>🕒 {it.inicio || '—'} – {it.fin || '—'}</div>
              {it.costos && it.costos.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {it.costos.map((c, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, padding: '4px 8px', background: 'rgba(255,255,255,0.05)' }}>
                      <strong>{c.precio !== undefined && c.precio !== null ? `$${c.precio.toLocaleString()}` : 'Gratis'}</strong>
                      {c.nombre && <span style={{ opacity: 0.75 }}>· {c.nombre}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {it.costos && it.costos.length === 1 && (
              <div style={{ textAlign: 'right', minWidth: 90 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{it.costos[0].tipo ?? ''}</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>
                  {it.costos[0].precio !== undefined && it.costos[0].precio !== null ? `$${it.costos[0].precio!.toLocaleString()}` : 'Gratis'}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

    </div>
  );
}


