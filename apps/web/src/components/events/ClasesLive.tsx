import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  sourceType?: 'teacher' | 'academy';
  sourceId?: number;
  isClickable?: boolean;
};

const iconFor = (tipo?: string) => {
  if (tipo === 'clase') return '📚';
  if (tipo === 'paquete') return '🧾';
  if (tipo === 'coreografia') return '🎬';
  if (tipo === 'show') return '🎭';
  return '🗂️';
};

export default function ClasesLive({ 
  cronograma = [], 
  costos = [], 
  ubicacion, 
  title = 'Clases & Tarifas', 
  showCalendarButton = false,
  sourceType,
  sourceId,
  isClickable = false
}: Props) {
  const navigate = useNavigate();
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
        {items.map((it, idx) => {
          const handleClick = () => {
            if (isClickable && sourceType && sourceId) {
              navigate(`/clase/${sourceType}/${sourceId}?i=${idx}`);
            }
          };

          return (
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
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: '1.25rem 1.5rem',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Fila 1: Nombre (en chip) + Botón Calendario */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div
                onClick={handleClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(229, 57, 53, 0.2), rgba(251, 140, 0, 0.2))',
                  border: '2px solid rgba(229, 57, 53, 0.4)',
                  boxShadow: '0 4px 12px rgba(229, 57, 53, 0.25)',
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>📚</span>
                <h4 style={{
                  margin: 0,
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.3px'
                }}>
                  {it.titulo || 'Clase'}
                </h4>
              </div>
              
              {/* Botón de calendario (no clickeable para navegación) */}
              {showCalendarButton && (
                <div
                  style={{ position: 'relative', zIndex: 5, pointerEvents: 'auto' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    const buildTimeDate = (time?: string, fecha?: string) => {
                      // Si hay fecha específica, usarla; si no, usar fecha actual
                      const base = fecha ? new Date(fecha) : new Date();
                      const hhmm = (time || '').split(':').slice(0, 2).join(':');
                      const [hh, mm] = hhmm && hhmm.includes(':') ? hhmm.split(':').map(n => parseInt(n, 10)) : [20, 0];
                      base.setHours(isNaN(hh) ? 20 : hh, isNaN(mm) ? 0 : mm, 0, 0);
                      return base;
                    };
                    
                    const classDate = (it as any)?.fecha;
                    const start = buildTimeDate((it as any).inicio, classDate);
                    const end = (() => {
                      const e = buildTimeDate((it as any).fin, classDate);
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
                          showAsIcon={false}
                        />
                      </RequireLogin>
                    );
                  })()}
                </div>
              )}
            </div>
            
            {/* Contenido */}
            <div style={{ minWidth: 0 }}>
              
              {/* Fila: Fecha/Día + Hora */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 12
              }}>
                {/* Fecha o Día de la semana */}
                {((it as any)?.fecha || (it as any)?.diaSemana) && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(240, 147, 251, 0.3)',
                    background: 'rgba(240, 147, 251, 0.12)',
                    color: '#f093fb'
                  }}>
                    📅
                    {(it as any)?.fecha ? (() => {
                      try {
                        const d = new Date((it as any).fecha);
                        const day = d.getDate();
                        const month = d.toLocaleDateString('es-MX', { month: 'short' });
                        return `${day} ${month}`;
                      } catch {
                        return (it as any).fecha;
                      }
                    })() : (() => {
                      // Mapear ID de día a nombre
                      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const diaId = Number((it as any)?.diaSemana);
                      if (!isNaN(diaId) && diaId >= 0 && diaId <= 6) {
                        return dias[diaId];
                      }
                      return (it as any)?.diaSemana;
                    })()}
                  </span>
                )}
                
                {/* Hora de inicio */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 12,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  🕒 {it.inicio || '—'}
                </span>
              </div>
              
              {/* Fila: Chips de Costo y Ubicación */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {/* Chip de Costo */}
                {it.costos && it.costos.length > 0 && it.costos[0] && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    border: '1px solid rgba(255, 209, 102, 0.4)',
                    borderRadius: 12,
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, rgba(255, 209, 102, 0.15), rgba(255, 140, 66, 0.15))',
                    color: '#FFD166',
                    boxShadow: '0 2px 8px rgba(255, 209, 102, 0.2)'
                  }}>
                    💰 {it.costos[0].precio !== undefined && it.costos[0].precio !== null ? `$${it.costos[0].precio.toLocaleString()}` : 'Gratis'}
                  </span>
                )}
                
                {/* Chip de Ubicación */}
                {((it as any)?.ubicacion || ubicacion?.nombre) && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(30, 136, 229, 0.3)',
                    background: 'rgba(30, 136, 229, 0.12)',
                    color: '#90CAF9'
                  }}>
                    📍 {(it as any)?.ubicacion || ubicacion?.nombre}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
          );
        })}
      </div>

    </div>
  );
}


