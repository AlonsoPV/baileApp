import React from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ClasesLive from '@/components/events/ClasesLive';
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

  const cronograma = profile?.cronograma || [];
  const costos = profile?.costos || [];
  const ubicacion = Array.isArray(profile?.ubicaciones) && profile.ubicaciones.length > 0
    ? {
        nombre: profile.ubicaciones[0]?.nombre,
        direccion: profile.ubicaciones[0]?.direccion,
        ciudad: profile.ubicaciones[0]?.ciudad,
        referencias: profile.ubicaciones[0]?.referencias,
      }
    : undefined;

  // Intentar obtener un "nombre" de clase de la primera entrada del cronograma
  const firstClass = Array.isArray(cronograma) && cronograma.length > 0 ? cronograma[0] as any : undefined;
  const classTitle = (firstClass?.nombre)
    || (firstClass?.titulo)
    || (firstClass?.clase)
    || (firstClass?.estilo)
    || 'Clase';

  return (
    <div className="date-public-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)', padding: '24px 0' }}>
      <style>{`
        .date-public-root { padding: 24px 0; }
        .date-public-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        @media (max-width: 768px) { .date-public-root { padding: 16px 0 !important; } .date-public-inner { padding: 0 16px !important; } .two-col-grid { grid-template-columns: 1fr !important; gap: 1rem !important; } }
        @media (max-width: 480px) { .date-public-root { padding: 12px 0 !important; } .date-public-inner { padding: 0 12px !important; } }
        .social-header-card { position: relative; border-radius: 18px; background: linear-gradient(135deg, rgba(40,30,45,0.92), rgba(30,20,40,0.92)); border: 1px solid rgba(240,147,251,0.18); box-shadow: 0 10px 28px rgba(0,0,0,0.35); padding: 1.25rem 1.25rem 1rem; }
        .social-header-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        @media (min-width: 768px) { .social-header-grid { grid-template-columns: 1.3fr 1fr; } }
        .chip { display:inline-flex;align-items:center;gap:.5rem; padding:.5rem .85rem;border-radius:999px;font-weight:700;font-size:.9rem }
        .chip-date { background:rgba(240,147,251,.12);border:1px solid rgba(240,147,251,.25);color:#f093fb }
        .mini-card { border-radius:14px; padding:1rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08) }
        .list-compact { display:grid; gap:.6rem }
        .list-compact li { display:flex; justify-content:space-between; gap:.75rem; font-size:.95rem }
        .ur-col { display:grid; grid-template-columns: 1fr; gap: 1rem; }
        .card{border-radius:14px;padding:1rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)}
        .loc{border-color:rgba(240,147,251,0.22);background:linear-gradient(135deg,rgba(240,147,251,.08),rgba(240,147,251,.04))}
        .loc-inline{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
        .loc-chip{display:inline-flex;align-items:center;gap:.4rem;padding:.45rem .75rem;border-radius:999px;font-weight:800; background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#fff}
        .muted{color:rgba(255,255,255,.72)}
        .divider{height:1px;background:rgba(255,255,255,.12);margin:.75rem 0}
        .actions{display:flex;gap:.5rem;flex-wrap:wrap}
        .btn{display:inline-flex;align-items:center;gap:.55rem;padding:.6rem .95rem;border-radius:999px;font-weight:800;letter-spacing:.01em}
        .btn-maps{border:1px solid rgba(240,147,251,.4);color:#f7d9ff; background:radial-gradient(120% 120% at 0% 0%,rgba(240,147,251,.18),rgba(240,147,251,.08)); box-shadow:0 6px 18px rgba(240,147,251,.20) }
        .btn-copy{border:1px solid rgba(255,255,255,.18);color:#fff;background:rgba(255,255,255,.06)}
      `}</style>
      <div className="date-public-inner">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="social-header" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="social-header-card">
            <div className="social-header-grid">
              {/* Columna izquierda */}
              <div style={{ display: 'grid', gap: '.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => navigate(creatorLink)} style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(240,147,251,0.28)', background: 'rgba(240,147,251,0.10)', color: '#f093fb', fontWeight: 700, cursor: 'pointer' }}>← Volver</button>
                </div>
                {/* Nombre de la clase */}
                <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.2, fontWeight: 800, background: 'linear-gradient(135deg,#f093fb,#FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {classTitle}
                </h1>
                {/* Propiedad y tipo (Maestro/Academia) */}
                <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="chip chip-date">{isTeacher ? '👤 Maestro' : '🏫 Academia'}</span>
                  <Link to={creatorLink} style={{ color: '#FFD166', fontWeight: 800, textDecoration: 'none', borderBottom: '1px dashed rgba(255,209,102,0.5)' }}>
                    Creada por {creatorTypeLabel} · {creatorName}
                  </Link>
                  <span className="chip chip-date">📚 {cronograma?.length || 0} clase(s)</span>
                  {Array.isArray(costos) && costos.length > 0 && (
                    <span className="chip" style={{ background: 'rgba(255,209,102,.12)', border: '1px solid rgba(255,209,102,.25)', color: '#FFD166' }}>💰 {costos.length} costo(s)</span>
                  )}
                </div>
              </div>
              {/* Columna derecha: datos rápidos de ubicación */}
              <div style={{ display: 'grid', gap: '.85rem', alignContent: 'start' }}>
                <div className="mini-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                    <strong>📍 Ubicación</strong>
                    <span style={{ opacity: .7, fontSize: '.9rem' }}>{ubicacion?.ciudad || '—'}</span>
                  </div>
                  {ubicacion ? (
                    <ul className="list-compact" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {ubicacion?.nombre && <li><span style={{ opacity: .9 }}>Nombre</span><span style={{ opacity: .7 }}>{ubicacion.nombre}</span></li>}
                      {ubicacion?.direccion && <li><span style={{ opacity: .9 }}>Dirección</span><span style={{ opacity: .7 }}>{ubicacion.direccion}</span></li>}
                      {ubicacion?.referencias && <li><span style={{ opacity: .9 }}>Referencias</span><span style={{ opacity: .7 }}>{ubicacion.referencias}</span></li>}
                    </ul>
                  ) : (
                    <div className="muted">Sin información</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Ubicación detallada (acciones) */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ padding: '1.25rem', marginBottom: '1.25rem', borderRadius: 18, border: '1px solid rgba(255,255,255,0.10)', background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', boxShadow: '0 8px 24px rgba(0,0,0,0.28)', backdropFilter: 'blur(12px)' }}>
          <h3 style={{ margin: 0, marginBottom: '.9rem', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff' }}>📍 Ubicación</h3>
          <div className="ur-col">
            <div className="card loc" aria-label="Ubicación">
              {ubicacion ? (
                <>
                  <div className="loc-inline">
                    {ubicacion.nombre && (<span className="loc-chip">🏷️ <b>Lugar:</b> <span className="muted">{ubicacion.nombre}</span></span>)}
                    {ubicacion.direccion && (<span className="loc-chip">🧭 <b>Dirección:</b> <span className="muted">{ubicacion.direccion}</span></span>)}
                    {ubicacion.ciudad && (<span className="loc-chip">🏙️ <b>Ciudad:</b> <span className="muted">{ubicacion.ciudad}</span></span>)}
                    {ubicacion.referencias && (<span className="loc-chip">📌 <b>Referencias:</b> <span className="muted">{ubicacion.referencias}</span></span>)}
                  </div>
                  {(ubicacion.direccion || ubicacion.nombre || ubicacion.ciudad) && <div className="divider" />}
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

        {/* Clases, horarios, costos y agregar a calendario */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ padding: '1.25rem', borderRadius: 18, border: '1px solid rgba(255,255,255,0.10)', background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', boxShadow: '0 8px 24px rgba(0,0,0,0.28)', backdropFilter: 'blur(12px)' }}>
          <ClasesLive title="" cronograma={cronograma} costos={costos} ubicacion={ubicacion as any} showCalendarButton={true} />
        </motion.section>
      </div>
    </div>
  );
}


