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
              // Asegurar que sourceId sea un string válido
              const sourceIdStr = String(sourceId);
              const route = `/clase/${sourceType}/${sourceIdStr}${idx !== undefined && idx !== null ? `?i=${idx}` : ''}`;
              console.log("[ClasesLive] 🔍 Navegando a:", route, { sourceType, sourceId, sourceIdStr, idx });
              navigate(route);
            } else {
              console.warn("[ClasesLive] ⚠️ No se puede navegar - faltan datos:", { isClickable, sourceType, sourceId });
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
                    // Función auxiliar para convertir día (string o número) a número
                    const dayToNumber = (day: string | number | null | undefined): number | null => {
                      if (day === null || day === undefined) return null;
                      if (typeof day === 'number' && day >= 0 && day <= 6) return day;
                      if (typeof day === 'string') {
                        const dayMap: Record<string, number> = {
                          'domingo': 0, 'dom': 0,
                          'lunes': 1, 'lun': 1,
                          'martes': 2, 'mar': 2,
                          'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
                          'jueves': 4, 'jue': 4,
                          'viernes': 5, 'vie': 5,
                          'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
                        };
                        return dayMap[day.toLowerCase().trim()] ?? null;
                      }
                      return null;
                    };

                    const buildTimeDate = (time?: string, fecha?: string, diaSemana?: number | null, diasSemana?: (string | number)[] | null) => {
                      let base: Date;
                      
                      // Si hay fecha específica, usarla
                      if (fecha) {
                        base = new Date(fecha);
                      } 
                      // Si es clase semanal, calcular próxima ocurrencia
                      else {
                        // Si tiene múltiples días, usar el primer día
                        let diaParaCalcular: number | null = null;
                        if (diasSemana && Array.isArray(diasSemana) && diasSemana.length > 0) {
                          diaParaCalcular = dayToNumber(diasSemana[0]);
                        }
                        // Si no, usar diaSemana
                        if (diaParaCalcular === null) {
                          diaParaCalcular = diaSemana !== null && diaSemana !== undefined ? Number(diaSemana) : null;
                        }
                        
                        if (diaParaCalcular !== null && diaParaCalcular >= 0 && diaParaCalcular <= 6) {
                          base = new Date();
                          const today = base.getDay();  // 0=Domingo, 1=Lunes, ..., 6=Sábado
                          const targetDay = diaParaCalcular;
                          
                          // Calcular días hasta el próximo targetDay
                          let daysUntilTarget = targetDay - today;
                          
                          // Si el día ya pasó esta semana, ir a la próxima semana
                          if (daysUntilTarget <= 0) {
                            daysUntilTarget += 7;
                          }
                          
                          // Agregar los días
                          base.setDate(base.getDate() + daysUntilTarget);
                        } 
                        // Si no hay fecha ni día, usar fecha actual
                        else {
                          base = new Date();
                        }
                      }
                      
                      // Establecer hora
                      const hhmm = (time || '').split(':').slice(0, 2).join(':');
                      const [hh, mm] = hhmm && hhmm.includes(':') ? hhmm.split(':').map(n => parseInt(n, 10)) : [20, 0];
                      base.setHours(isNaN(hh) ? 20 : hh, isNaN(mm) ? 0 : mm, 0, 0);
                      return base;
                    };
                    
                    const classDate = (it as any)?.fecha;
                    const classDiaSemana = (it as any)?.diaSemana;
                    const classDiasSemana = (it as any)?.diasSemana;
                    
                    // Convertir diasSemana a números si es necesario
                    const diasSemanaNumeros = (() => {
                      if (!classDiasSemana || !Array.isArray(classDiasSemana)) return null;
                      const dayMap: Record<string, number> = {
                        'domingo': 0, 'dom': 0,
                        'lunes': 1, 'lun': 1,
                        'martes': 2, 'mar': 2,
                        'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
                        'jueves': 4, 'jue': 4,
                        'viernes': 5, 'vie': 5,
                        'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
                      };
                      const dias = classDiasSemana
                        .map((d: string | number) => {
                          if (typeof d === 'number' && d >= 0 && d <= 6) return d;
                          if (typeof d === 'string') {
                            const dayNum = dayMap[d.toLowerCase().trim()];
                            return dayNum !== undefined ? dayNum : null;
                          }
                          return null;
                        })
                        .filter((d: number | null) => d !== null) as number[];
                      return dias.length > 0 ? dias : null;
                    })();
                    
                    const start = buildTimeDate((it as any).inicio, classDate, classDiaSemana, classDiasSemana);
                    const end = (() => {
                      const e = buildTimeDate((it as any).fin, classDate, classDiaSemana, classDiasSemana);
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
                          fecha={classDate || null}
                          diaSemana={classDiaSemana ?? null}
                          diasSemana={diasSemanaNumeros}
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
                    📅 {' '}
                    {(it as any)?.fecha ? (() => {
                      try {
                        // Parsear fecha como hora local para evitar problemas de zona horaria
                        const fechaValue = (it as any).fecha;
                        const fechaOnly = fechaValue.includes('T') ? fechaValue.split('T')[0] : fechaValue;
                        const [year, month, day] = fechaOnly.split('-').map(Number);
                        const d = new Date(year, month - 1, day);
                        const dayNum = d.getDate();
                        const monthStr = d.toLocaleDateString('es-MX', { month: 'short' });
                        return `${dayNum} ${monthStr}`;
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
                      return (it as any)?.diaSemana || 'Día no especificado';
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
                {it.costos && it.costos.length > 0 && it.costos[0] && (() => {
                  const precio = it.costos[0].precio;
                  // Si precio es null/undefined, no mostrar nada
                  if (precio === null || precio === undefined) return null;
                  // Si precio es 0, mostrar "Gratis"
                  if (precio === 0) {
                    return (
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
                        💰 Gratis
                      </span>
                    );
                  }
                  // Si precio > 0, mostrar el precio formateado
                  return (
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
                      💰 ${precio.toLocaleString()}
                    </span>
                  );
                })()}
                
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


