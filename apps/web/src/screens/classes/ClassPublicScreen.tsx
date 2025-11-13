import React from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ClasesLive from '@/components/events/ClasesLive';
import TeacherCard from '@/components/explore/cards/TeacherCard';
import AcademyCard from '@/components/explore/cards/AcademyCard';
import AddToCalendarWithStats from '@/components/AddToCalendarWithStats';
import { useTeacherPublic } from '@/hooks/useTeacher';
import { useAcademyPublic } from '@/hooks/useAcademy';
import { urls } from '@/lib/urls';

type SourceType = 'teacher' | 'academy';

export default function ClassPublicScreen() {
  const [sp] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();

  // Permitir /clase?type=teacher&id=123 o /clase/:type/:id
  const sourceType = (params as any)?.type || (sp.get('type') as SourceType) || 'teacher';
  const rawId = (params as any)?.id || sp.get('id') || '';
  const classIdParam = sp.get('classId') || sp.get('claseId') || '';
  const classIndexParam = sp.get('i') || sp.get('index') || '';
  const idNum = Number(rawId);

  const isTeacher = sourceType === 'teacher';
  const teacherQ = useTeacherPublic(isTeacher && !Number.isNaN(idNum) ? idNum : (undefined as any));
  const academyQ = useAcademyPublic(!isTeacher && !Number.isNaN(idNum) ? idNum : (undefined as any));

  const loading = isTeacher ? teacherQ.isLoading : academyQ.isLoading;
  const profile: any = isTeacher ? teacherQ.data : academyQ.data;

  if (!rawId || Number.isNaN(idNum)) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Falta id</div>;
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Cargando…</div>;
  }

  if (!profile) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Clase no encontrada</div>;
  }

  const creatorName = profile?.nombre_publico || profile?.display_name || '—';
  const creatorLink = isTeacher ? urls.teacherLive(profile?.id) : urls.academyLive(profile?.id);
  const creatorTypeLabel = isTeacher ? 'Maestro' : 'Academia';

  const cronograma = profile?.horarios || profile?.cronograma || [];
  const costos = profile?.costos || [];
  const ubicacionBase = Array.isArray(profile?.ubicaciones) && profile.ubicaciones.length > 0
    ? {
        nombre: profile.ubicaciones[0]?.nombre,
        direccion: profile.ubicaciones[0]?.direccion,
        ciudad: profile.ubicaciones[0]?.ciudad,
        referencias: profile.ubicaciones[0]?.referencias,
      }
    : undefined;

  // Seleccionar SOLO una clase del cronograma (por id o índice). Fallback: primera.
  const classesArr = Array.isArray(cronograma) ? (cronograma as any[]) : [];
  let selectedClass: any | undefined = undefined;
  if (classIdParam) {
    selectedClass = classesArr.find((c: any) => String(c?.id) === String(classIdParam));
  }
  if (!selectedClass && classIndexParam !== '') {
    const idx = Number(classIndexParam);
    if (!Number.isNaN(idx)) selectedClass = classesArr[idx];
  }
  if (!selectedClass) {
    selectedClass = classesArr[0];
  }
  const cronogramaSelected = selectedClass ? [selectedClass] : [];

  // Ubicación: priorizar la de la clase si existe, si no usar base
  const ubicacion = selectedClass?.ubicacion
    ? { nombre: selectedClass.ubicacion, direccion: undefined as any, ciudad: ubicacionBase?.ciudad, referencias: undefined as any }
    : ubicacionBase;

  // Título de la clase
  const classTitle = (selectedClass?.nombre)
    || (selectedClass?.titulo)
    || (selectedClass?.clase)
    || (selectedClass?.estilo)
    || 'Clase';

  // Horario, costo y ubicación (para chips del header)
  const scheduleLabel = (() => {
    const ini = (selectedClass as any)?.inicio || (selectedClass as any)?.hora_inicio;
    const fin = (selectedClass as any)?.fin || (selectedClass as any)?.hora_fin;
    if (ini && fin) return `${ini} - ${fin}`;
    if (ini) return `${ini}`;
    return undefined;
  })();

  const costLabel = (() => {
    try {
      if (Array.isArray(costos) && costos.length) {
        if ((selectedClass as any)?.referenciaCosto) {
          const ref = (selectedClass as any).referenciaCosto;
          const match = (costos as any[]).find((c: any) => (c?.nombre || c?.titulo || c?.tipo) === ref);
          const precio = match?.precio;
          if (typeof precio === 'number') {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(precio);
          }
        }
        const nums = (costos as any[]).map((c: any) => (typeof c?.precio === 'number' ? c.precio : null)).filter((n: any) => n !== null);
        if (nums.length) {
          const min = Math.min(...(nums as number[]));
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(min);
        }
      }
      return undefined;
    } catch { return undefined; }
  })();

  const locationLabel = (() => {
    if (!ubicacion) return undefined;
    const parts = [ubicacion.nombre, ubicacion.ciudad].filter(Boolean);
    return parts.length ? parts.join(' · ') : undefined;
  })();

  return (
    <div className="date-public-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)', padding: '24px 0' }}>
      <style>{`
        .date-public-root { padding: 24px 0; }
        .date-public-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; }
        
        /* Hero Banner */
        .class-hero-banner {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, 
            rgba(11,13,16,.98) 0%, 
            rgba(18,22,27,.95) 50%, 
            rgba(30,20,40,.96) 100%);
          padding: 3rem 2.5rem;
          border-radius: 32px;
          margin-bottom: 2rem;
          border: 2px solid rgba(240,147,251,.15);
          box-shadow: 
            0 20px 60px rgba(0,0,0,.6),
            0 0 0 1px rgba(240,147,251,.1) inset,
            0 4px 20px rgba(240,147,251,.15);
          backdrop-filter: blur(20px);
        }
        
        .class-hero-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f093fb, #f5576c, #FFD166, #1E88E5);
          opacity: 0.9;
        }
        
        .class-hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        
        .class-title {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 900;
          margin-bottom: 1.25rem;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: #fff;
        }
        
        @media (max-width: 1024px) {
          .class-hero-content {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
        
        @media (max-width: 768px) {
          .date-public-root { padding: 16px 0 !important; }
          .date-public-inner { padding: 0 16px !important; }
          .class-hero-banner { padding: 2rem 1.5rem !important; }
          .class-hero-content { gap: 1.5rem !important; }
        }
        
        @media (max-width: 480px) {
          .date-public-root { padding: 12px 0 !important; }
          .date-public-inner { padding: 0 12px !important; }
          .class-hero-banner { padding: 1.5rem 1rem !important; }
          .class-hero-content { gap: 1.25rem !important; }
          .class-title { font-size: 2rem !important; }
        }
        
        .chip {
          display:inline-flex;
          align-items:center;
          gap:.45rem;
          padding:.55rem .95rem;
          border-radius:12px;
          font-weight:700;
          font-size:.92rem;
          background:rgba(255,255,255,0.05);
          border:1.5px solid rgba(255,255,255,0.12);
          color:#f4f4f5;
          box-shadow:0 6px 18px rgba(0,0,0,0.18);
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }
        .chip-date { 
          background:linear-gradient(135deg, rgba(240,147,251,.18), rgba(152,71,255,0.16));
          border-color:rgba(240,147,251,.38);
          color:#f5d6ff;
        }
        .chip-time {
          background:linear-gradient(135deg, rgba(255,209,102,.18), rgba(255,159,67,0.14));
          border-color:rgba(255,209,102,.38);
          color:#FFE6A8;
        }
        .chip-cost {
          background:linear-gradient(135deg, rgba(30,136,229,0.14), rgba(0,188,212,0.1));
          border-color:rgba(30,136,229,0.32);
          color:#d4f0ff;
        }
        .chip-location {
          background:linear-gradient(135deg, rgba(30,136,229,0.14), rgba(0,188,212,0.1));
          border-color:rgba(30,136,229,0.32);
          color:#d4f0ff;
        }
        .chip-level {
          background:linear-gradient(135deg, rgba(30,136,229,0.18), rgba(240,147,251,0.16));
          border-color:rgba(30,136,229,0.35);
          color:#e5edff;
        }
        .glass-card-container {
          margin-bottom: 2rem; padding: 2rem;
          background: linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.03));
          border-radius: 22px; border: 1px solid rgba(255,255,255,.15);
          box-shadow: 0 10px 32px rgba(0,0,0,.4); backdrop-filter: blur(10px);
        }
        .ur-col { display:grid; grid-template-columns: 1fr; gap: 1rem; }
        .card{border-radius:14px;padding:1rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)}
        .loc{border-color:rgba(240,147,251,0.22);background:linear-gradient(135deg,rgba(240,147,251,.08),rgba(240,147,251,.04))}
        .loc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1.25rem}
        .loc-item{display:flex;align-items:flex-start;gap:.75rem;padding:1rem;border-radius:18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);box-shadow:0 10px 24px rgba(0,0,0,0.18)}
        .loc-item-icon{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:1.35rem;background:linear-gradient(135deg,rgba(240,147,251,0.22),rgba(240,147,251,0.08));border:1px solid rgba(240,147,251,0.32);color:#f5d6ff}
        .loc-item-content{display:flex;flex-direction:column;gap:.25rem}
        .loc-item-content strong{font-size:.95rem;color:#fff;letter-spacing:.01em}
        .loc-item-content span{font-size:.9rem;color:rgba(255,255,255,.78);line-height:1.45}
        .muted{color:rgba(255,255,255,.72)}
        .divider{height:1px;background:rgba(255,255,255,.12);margin:.75rem 0}
        .actions{display:flex;gap:.75rem;flex-wrap:wrap}
        .btn{display:inline-flex;align-items:center;gap:.55rem;padding:.6rem .95rem;border-radius:999px;font-weight:800;letter-spacing:.01em}
        .btn-maps{border:1px solid rgba(240,147,251,.4);color:#f7d9ff; background:radial-gradient(120% 120% at 0% 0%,rgba(240,147,251,.18),rgba(240,147,251,.08)); box-shadow:0 6px 18px rgba(240,147,251,.20) }
        .btn-copy{border:1px solid rgba(255,255,255,.18);color:#fff;background:rgba(255,255,255,.06)}
      `}</style>
      <div className="date-public-inner">
        {/* Hero Banner */}
        <motion.div
          className="class-hero-banner"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          {/* Efectos decorativos de fondo */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(30,136,229,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(240,147,251,0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          
          <div className="class-hero-content">
            {/* Columna 1: Info de la clase */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(creatorLink)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: 999,
                    border: '2px solid rgba(240,147,251,0.3)',
                    background: 'rgba(240,147,251,0.15)',
                    color: '#f093fb',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: '0 8px 20px rgba(240,147,251,.25)'
                  }}
                >
                  ← Volver
                </motion.button>
              </div>
              
              <h1 className="class-title" style={{ textAlign: 'left' }}>
                {classTitle}
              </h1>

              {/* Chips de fecha/día, horario, costo, ubicación y nivel */}
              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
                {/* Chip de fecha o día */}
                {(() => {
                  if (selectedClass?.fecha) {
                    // Fecha específica
                    const fechaStr = new Date(selectedClass.fecha).toLocaleDateString('es-ES', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    });
                    return (
                      <span className="chip chip-date">
                        📅 {fechaStr}
                      </span>
                    );
                  } else if (selectedClass?.diaSemana !== undefined && selectedClass?.diaSemana !== null) {
                    // Día de la semana
                    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const dayName = dayNames[selectedClass.diaSemana] || 'Día no especificado';
                    return (
                      <span className="chip chip-date">
                        📅 {dayName}
                      </span>
                    );
                  } else if (Array.isArray(selectedClass?.diasSemana) && selectedClass.diasSemana.length > 0) {
                    // Múltiples días
                    return (
                      <span className="chip chip-date">
                        📅 {selectedClass.diasSemana.join(', ')}
                      </span>
                    );
                  }
                  return null;
                })()}
                
                {scheduleLabel && (
                  <span className="chip chip-time">🕒 {scheduleLabel}</span>
                )}
                {typeof costLabel === 'string' && costLabel && (
                  <span className="chip chip-cost">💰 {costLabel}</span>
                )}
                {locationLabel && (
                  <span className="chip chip-location">📍 {locationLabel}</span>
                )}
                {selectedClass?.nivel && (
                  <span className="chip chip-level">
                    🎯 {selectedClass.nivel}
                  </span>
                )}
              </div>

              {/* Botón de Agregar a Calendario */}
              {selectedClass && (
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <AddToCalendarWithStats
                    eventId={idNum}
                    title={classTitle}
                    description={`Clase de ${classTitle} con ${creatorName}`}
                    location={locationLabel}
                    start={(() => {
                      try {
                        if (selectedClass.fecha) {
                          const fechaStr = selectedClass.fecha.includes('T') ? selectedClass.fecha.split('T')[0] : selectedClass.fecha;
                          const hora = (selectedClass.inicio || '20:00').split(':').slice(0, 2).join(':');
                          return new Date(`${fechaStr}T${hora}:00`);
                        }
                        // Si es clase semanal, calcular próxima ocurrencia
                        const now = new Date();
                        const hora = (selectedClass.inicio || '20:00').split(':').slice(0, 2).join(':');
                        now.setHours(parseInt(hora.split(':')[0]), parseInt(hora.split(':')[1]), 0, 0);
                        return now;
                      } catch {
                        return new Date();
                      }
                    })()}
                    end={(() => {
                      try {
                        if (selectedClass.fecha) {
                          const fechaStr = selectedClass.fecha.includes('T') ? selectedClass.fecha.split('T')[0] : selectedClass.fecha;
                          const hora = (selectedClass.fin || selectedClass.inicio || '22:00').split(':').slice(0, 2).join(':');
                          return new Date(`${fechaStr}T${hora}:00`);
                        }
                        const now = new Date();
                        const hora = (selectedClass.fin || selectedClass.inicio || '22:00').split(':').slice(0, 2).join(':');
                        now.setHours(parseInt(hora.split(':')[0]), parseInt(hora.split(':')[1]), 0, 0);
                        return now;
                      } catch {
                        const end = new Date();
                        end.setHours(end.getHours() + 2);
                        return end;
                      }
                    })()}
                    showAsIcon={false}
                  />
                </motion.div>
              )}
            </div>
            
            {/* Columna 2: Creada por + Card del creador */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <div style={{ 
                padding: '1rem 1.25rem',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,.12)',
                background: 'rgba(255,255,255,.05)',
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
                width: '100%',
                maxWidth: '350px'
              }}>
                {/* <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,.7)', marginBottom: '.5rem' }}>
                  Creada por
                </p> */}
                <Link to={creatorLink} style={{ 
                  color: '#FFD166', 
                  fontWeight: 900, 
                  fontSize: '1.1rem',
                  textDecoration: 'none', 
                  borderBottom: '2px solid rgba(255,209,102,0.5)',
                  paddingBottom: '2px',
                  transition: 'all 0.2s',
                  display: 'inline-block'
                }}>
                  {creatorTypeLabel} · {creatorName}
                </Link>
              </div>
              
              <div style={{ width: '100%', maxWidth: '350px' }}>
                {isTeacher ? (
                  <TeacherCard item={profile} />
                ) : (
                  <AcademyCard item={profile} />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ubicación detallada (acciones) */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.25 }} 
          className="glass-card-container"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              display: 'grid', placeItems: 'center',
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              boxShadow: '0 10px 28px rgba(240,147,251,.4)',
              fontSize: '1.25rem',
              border: '2px solid rgba(240,147,251,.3)'
            }}>📍</div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>Ubicación</h3>
          </div>
          <div className="ur-col">
            <div className="card loc" aria-label="Ubicación">
              {ubicacion ? (
                <>
                  <div className="loc-grid">
                    {ubicacion.nombre && (
                      <div className="loc-item">
                        <div className="loc-item-icon">🏷️</div>
                        <div className="loc-item-content">
                          <strong>{ubicacion.nombre}</strong>
                        </div>
                      </div>
                    )}
                    {ubicacion.direccion && (
                      <div className="loc-item">
                        <div className="loc-item-icon">🧭</div>
                        <div className="loc-item-content">
                          <strong>Dirección</strong>
                          <span>{ubicacion.direccion}</span>
                        </div>
                      </div>
                    )}
                    {ubicacion.ciudad && (
                      <div className="loc-item">
                        <div className="loc-item-icon">🏙️</div>
                        <div className="loc-item-content">
                          <strong>Ciudad</strong>
                          <span>{ubicacion.ciudad}</span>
                        </div>
                      </div>
                    )}
                    {ubicacion.referencias && (
                      <div className="loc-item">
                        <div className="loc-item-icon">📌</div>
                        <div className="loc-item-content">
                          <strong>Referencias</strong>
                          <span>{ubicacion.referencias}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="actions">
                    {(ubicacion.direccion || ubicacion.nombre || ubicacion.ciudad) && (
                      <a className="btn btn-maps" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ubicacion.nombre ?? ''} ${ubicacion.direccion ?? ''} ${ubicacion.ciudad ?? ''}`.trim())}`} target="_blank" rel="noopener noreferrer">
                        <span className="pin">📍</span> Ver en Maps <span aria-hidden>↗</span>
                      </a>
                    )}
                    {ubicacion.direccion && (
                      <button type="button" className="btn btn-copy" onClick={() => { const text = `${ubicacion.nombre ?? ''}\n${ubicacion.direccion ?? ''}\n${ubicacion.ciudad ?? ''}`.trim(); navigator.clipboard?.writeText(text).catch(() => {}); }}>
                        📋 Copiar dirección
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="muted">Sin información de ubicación.</div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Clases, horarios, costos y agregar a calendario - COMENTADO */}
        {/* <motion.section 
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.25 }} 
          className="glass-card-container"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              display: 'grid', placeItems: 'center',
              background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
              boxShadow: '0 10px 28px rgba(30,136,229,.4)',
              fontSize: '1.25rem',
              border: '2px solid rgba(30,136,229,.3)'
            }}>📚</div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>Detalles de la Clase</h3>
          </div>
          
          <ClasesLive 
            title="" 
            cronograma={cronogramaSelected} 
            costos={costos} 
            ubicacion={ubicacion as any} 
            showCalendarButton={true}
            sourceType={sourceType}
            sourceId={idNum}
            isClickable={false}
          />
        </motion.section> */}
      </div>
    </div>
  );
}


