import React from 'react';
import { useTags } from '../../hooks/useTags';

type Ubicacion = {
  nombre?: string;
  direccion?: string;
  referencias?: string;
  zonaIds?: number[];
};

type Props = {
  ubicaciones?: Ubicacion[];
  title?: string;
  style?: React.CSSProperties;
  className?: string;
};

export default function UbicacionesLive({ ubicaciones = [], title = 'Ubicaciones', style, className }: Props) {
  const { data: allTags } = useTags();
  const getZonaNombre = (id: number) => allTags?.find(t => t.id === id && t.tipo === 'zona')?.nombre;

  if (!ubicaciones || ubicaciones.length === 0) return null;

  return (
    <section className={className} style={{ ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1E88E5,#7C4DFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📍</div>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{title}</h3>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {ubicaciones.map((u, idx) => (
          <div key={idx} style={{ padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            {(u.nombre || u.direccion) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {u.nombre && <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{u.nombre}</div>}
                {u.direccion && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{u.direccion}</div>}
              </div>
            )}
            {u.referencias && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>💡 {u.referencias}</div>}
            {u.zonaIds && u.zonaIds.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {u.zonaIds.map((zid) => (
                  <span key={zid} style={{ fontSize: 12, fontWeight: 600, color: '#fff', border: '1px solid rgba(25,118,210,0.4)', background: 'rgba(25,118,210,0.18)', padding: '2px 8px', borderRadius: 999 }}>
                    {getZonaNombre(zid) || 'Zona'}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}


