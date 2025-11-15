import React from 'react';
import { useTags } from '../../hooks/useTags';

type Ubicacion = {
  nombre?: string;
  sede?: string; // Formato AcademyLocation
  direccion?: string;
  ciudad?: string; // Formato AcademyLocation
  referencias?: string;
  zonaIds?: number[];
  zona_id?: number | null; // Formato AcademyLocation
};

type Props = {
  ubicaciones?: Ubicacion[];
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  headingSize?: string;
};

export default function UbicacionesLive({
  ubicaciones = [],
  title = 'Ubicaciones',
  style,
  className,
  headingSize = '1.25rem',
}: Props) {
  const { data: allTags } = useTags();
  const getZonaNombre = (id: number) => allTags?.find(t => t.id === id && t.tipo === 'zona')?.nombre;

  if (!ubicaciones || ubicaciones.length === 0) return null;

  return (
    <section className={className} style={{ ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1E88E5,#7C4DFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📍</div>
        <h3
          style={{
            margin: 0,
            fontSize: headingSize,
            fontWeight: 800,
            color: '#fff',
            textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px',
          }}
        >
          {title}
        </h3>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {ubicaciones.map((u, idx) => {
          // Normalizar campos: nombre puede venir como sede o nombre
          const nombreUbicacion = u.nombre || u.sede || '';
          const direccionCompleta = u.direccion || '';
          const ciudadUbicacion = u.ciudad || '';
          const referenciasUbicacion = u.referencias || '';
          
          // Normalizar zonas: puede venir como zonaIds (array) o zona_id (single)
          const zonasArray: number[] = [];
          if (u.zonaIds && Array.isArray(u.zonaIds)) {
            zonasArray.push(...u.zonaIds);
          } else if (u.zona_id !== null && u.zona_id !== undefined) {
            zonasArray.push(u.zona_id);
          }

          // Si no hay información relevante, no mostrar
          if (!nombreUbicacion && !direccionCompleta && !ciudadUbicacion && zonasArray.length === 0) {
            return null;
          }

          return (
            <div key={idx} style={{ padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
              {(nombreUbicacion || direccionCompleta || ciudadUbicacion) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {nombreUbicacion && <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{nombreUbicacion}</div>}
                  {direccionCompleta && (
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                      {direccionCompleta}
                      {ciudadUbicacion && `, ${ciudadUbicacion}`}
                    </div>
                  )}
                  {!direccionCompleta && ciudadUbicacion && (
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{ciudadUbicacion}</div>
                  )}
                </div>
              )}
              {referenciasUbicacion && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>💡 {referenciasUbicacion}</div>}
              {zonasArray.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {zonasArray.map((zid) => (
                    <span key={zid} style={{ fontSize: 12, fontWeight: 600, color: '#fff', border: '1px solid rgba(25,118,210,0.4)', background: 'rgba(25,118,210,0.18)', padding: '2px 8px', borderRadius: 999 }}>
                      {getZonaNombre(zid) || 'Zona'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}


