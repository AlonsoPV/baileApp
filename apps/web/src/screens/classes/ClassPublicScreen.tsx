import React from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ClasesLive from '@/components/events/ClasesLive';
import TeacherCard from '@/components/explore/cards/TeacherCard';
import AcademyCard from '@/components/explore/cards/AcademyCard';
import AddToCalendarWithStats from '@/components/AddToCalendarWithStats';
import { useTeacherPublic } from '@/hooks/useTeacher';
import { useAcademyPublic } from '@/hooks/useAcademy';
import { useUserProfile } from '@/hooks/useUserProfile';
import { urls } from '@/lib/urls';
import SeoHead from '@/components/SeoHead';
import { SEO_BASE_URL, SEO_LOGO_URL } from '@/lib/seoConfig';
import { getMediaBySlot } from '@/utils/mediaSlots';
import { calculateNextDateWithTime } from '@/utils/calculateRecurringDates';

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
  const diaParam = sp.get('dia'); // Día específico para clases con múltiples días
  const idNum = Number(rawId);

  const isTeacher = sourceType === 'teacher';
  const teacherQ = useTeacherPublic(isTeacher && !Number.isNaN(idNum) ? idNum : (undefined as any));
  const academyQ = useAcademyPublic(!isTeacher && !Number.isNaN(idNum) ? idNum : (undefined as any));
  const { profile: userProfile } = useUserProfile();

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

  // Usar cronograma como fuente principal, con horarios como fallback para compatibilidad
  const cronograma = profile?.cronograma || profile?.horarios || [];
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
  let selectedClassIndex = 0;
  
  console.log('[ClassPublicScreen] 🔍 Buscando clase:', { classIdParam, classIndexParam, classesArrLength: classesArr.length });
  
  if (classIdParam) {
    const foundIndex = classesArr.findIndex((c: any) => String(c?.id) === String(classIdParam));
    if (foundIndex >= 0) {
      selectedClass = classesArr[foundIndex];
      selectedClassIndex = foundIndex;
      console.log('[ClassPublicScreen] ✅ Clase encontrada por ID:', { foundIndex, class: selectedClass });
    }
  }
  if (!selectedClass && classIndexParam !== '') {
    const idx = Number(classIndexParam);
    if (!Number.isNaN(idx) && idx >= 0 && idx < classesArr.length) {
      selectedClass = classesArr[idx];
      selectedClassIndex = idx;
      console.log('[ClassPublicScreen] ✅ Clase encontrada por índice:', { idx, class: selectedClass });
    } else {
      console.warn('[ClassPublicScreen] ⚠️ Índice inválido:', { idx, classesArrLength: classesArr.length });
    }
  }
  if (!selectedClass) {
    selectedClass = classesArr[0];
    selectedClassIndex = 0;
    console.log('[ClassPublicScreen] ⚠️ Usando primera clase como fallback:', selectedClass);
  }
  
  console.log('[ClassPublicScreen] 📋 Clase seleccionada:', {
    index: selectedClassIndex,
    id: selectedClass?.id,
    titulo: selectedClass?.titulo,
    nombre: selectedClass?.nombre,
    referenciaCosto: selectedClass?.referenciaCosto
  });
  
  // Generar un ID único para la clase basado en el índice (similar a useLiveClasses)
  // Si la clase tiene diasSemana, usar el primer día; si tiene fecha, usar 0
  const classUniqueId = selectedClass 
    ? (selectedClassIndex * 1000 + (selectedClass.diasSemana && Array.isArray(selectedClass.diasSemana) ? 0 : 0))
    : undefined;
  
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
      console.log('[ClassPublicScreen] 💰 Buscando costo:', {
        costosLength: costos?.length || 0,
        selectedClassIndex,
        classId: selectedClass?.id,
        referenciaCosto: selectedClass?.referenciaCosto,
        titulo: selectedClass?.titulo,
        nombre: selectedClass?.nombre,
        tieneCostoEnClase: !!(selectedClass as any)?.costo,
        costos: costos
      });
      
      // PRIORIDAD 1: Buscar costo directamente en el item del cronograma (más rápido y confiable)
      if ((selectedClass as any)?.costo) {
        const costoEnClase = (selectedClass as any).costo;
        const precio = costoEnClase?.precio;
        if (typeof precio === 'number') {
          console.log('[ClassPublicScreen] ✅ Costo encontrado directamente en el item del cronograma:', { costoEnClase });
          if (precio === 0) {
            return 'Gratis';
          }
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(precio);
        }
        // Si precio es null/undefined, retornar undefined para no mostrar nada
        return undefined;
      }
      
      // PRIORIDAD 2: Buscar en el array de costos (fallback para datos antiguos)
      if (Array.isArray(costos) && costos.length) {
        // Buscar costo por múltiples criterios (más robusto)
        // PRIORIDAD: ID de clase > Índice cronograma > Nombre (para evitar problemas al cambiar nombre)
        let match: any = null;
        let matchMethod = '';
        
        // 1. Buscar por ID de clase (MÁS CONFIABLE - no cambia aunque cambie el nombre)
        if ((selectedClass as any)?.id) {
          const classId = String((selectedClass as any).id);
          // Buscar por classId exacto
          match = (costos as any[]).find((c: any) => {
            // Buscar por classId (campo dedicado)
            if (c?.classId && String(c.classId) === classId) return true;
            // Buscar por referenciaCosto que sea el ID (para compatibilidad)
            if (c?.referenciaCosto && String(c.referenciaCosto) === classId) return true;
            // También buscar si el nombre del costo es el ID (para compatibilidad con costos muy antiguos)
            return String(c?.nombre || '').trim() === classId;
          });
          if (match) {
            matchMethod = 'classId';
            console.log('[ClassPublicScreen] ✅ Costo encontrado por ID de clase:', { classId, match });
          }
        }
        
        // 2. Buscar por índice del cronograma (segunda opción más confiable)
        if (!match && selectedClassIndex !== null && selectedClassIndex !== undefined) {
          match = (costos as any[]).find((c: any) => c?.cronogramaIndex === selectedClassIndex);
          if (match) {
            matchMethod = 'cronogramaIndex';
            console.log('[ClassPublicScreen] ✅ Costo encontrado por índice:', { selectedClassIndex, match });
          }
        }
        
        // 3. Buscar por referenciaCosto (nombre de la clase) - case-insensitive
        // Si hay múltiples matches, priorizar el que tenga precio > 0 y que coincida exactamente
        if (!match && (selectedClass as any)?.referenciaCosto) {
          const ref = String((selectedClass as any).referenciaCosto).trim().toLowerCase();
          
          // Primero buscar match exacto por nombre (más confiable)
          const exactMatches = (costos as any[]).filter((c: any) => {
            const nombre = String(c?.nombre || '').trim().toLowerCase();
            return nombre === ref;
          });
          
          if (exactMatches.length > 0) {
            // Priorizar: 1) que tenga classId/cronogramaIndex, 2) precio > 0
            match = exactMatches.find((c: any) => 
              (c?.classId || c?.cronogramaIndex !== undefined) && 
              typeof c?.precio === 'number' && c.precio > 0
            ) || exactMatches.find((c: any) => 
              typeof c?.precio === 'number' && c.precio > 0
            ) || exactMatches[0]; // Último fallback: cualquier match exacto
            if (match) matchMethod = 'referenciaCosto (exacto)';
          }
          
          // Si no hay match exacto, buscar por título o tipo (menos confiable)
          if (!match) {
            const otherMatches = (costos as any[]).filter((c: any) => {
              const titulo = String(c?.titulo || '').trim().toLowerCase();
              const tipo = String(c?.tipo || '').trim().toLowerCase();
              return titulo === ref || tipo === ref;
            });
            
            if (otherMatches.length > 0) {
              match = otherMatches.find((c: any) => 
                (c?.classId || c?.cronogramaIndex !== undefined) && 
                typeof c?.precio === 'number' && c.precio > 0
              ) || otherMatches.find((c: any) => 
                typeof c?.precio === 'number' && c.precio > 0
              ) || otherMatches[0];
              if (match) matchMethod = 'referenciaCosto (título/tipo)';
            }
          }
        }
        
        // 4. Buscar por título de la clase (fallback)
        if (!match && (selectedClass as any)?.titulo) {
          const ref = String((selectedClass as any).titulo).trim().toLowerCase();
          const allMatches = (costos as any[]).filter((c: any) => {
            const nombre = String(c?.nombre || '').trim().toLowerCase();
            return nombre === ref;
          });
          
          if (allMatches.length > 0) {
            // Priorizar: 1) que tenga classId/cronogramaIndex, 2) precio > 0
            match = allMatches.find((c: any) => 
              (c?.classId || c?.cronogramaIndex !== undefined) && 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches.find((c: any) => 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches[0];
            if (match) matchMethod = 'titulo';
          }
        }
        
        // 5. Buscar por nombre de la clase (último fallback)
        if (!match && (selectedClass as any)?.nombre) {
          const ref = String((selectedClass as any).nombre).trim().toLowerCase();
          const allMatches = (costos as any[]).filter((c: any) => {
            const nombre = String(c?.nombre || '').trim().toLowerCase();
            return nombre === ref;
          });
          
          if (allMatches.length > 0) {
            // Priorizar: 1) que tenga classId/cronogramaIndex, 2) precio > 0
            match = allMatches.find((c: any) => 
              (c?.classId || c?.cronogramaIndex !== undefined) && 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches.find((c: any) => 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches[0];
            if (match) matchMethod = 'nombre';
          }
        }
        
        console.log('[ClassPublicScreen] 💰 Resultado de búsqueda de costo:', {
          matchFound: !!match,
          matchMethod,
          match: match ? { nombre: match.nombre, precio: match.precio, classId: match.classId, cronogramaIndex: match.cronogramaIndex } : null
        });
        
        const precio = match?.precio;
        if (typeof precio === 'number') {
          if (precio === 0) {
            return 'Gratis';
          }
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(precio);
        }
        // Si no se encontró un costo específico, buscar el mínimo de todos los costos
        const nums = (costos as any[]).map((c: any) => (typeof c?.precio === 'number' ? c.precio : null)).filter((n: any) => n !== null);
        if (nums.length) {
          const min = Math.min(...(nums as number[]));
          console.log('[ClassPublicScreen] 💰 Usando precio mínimo:', min);
          if (min === 0) {
            return 'Gratis';
          }
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(min);
        }
      }
      return undefined;
    } catch (error) {
      console.error('[ClassPublicScreen] ❌ Error buscando costo:', error);
      return undefined;
    }
  })();

  const locationLabel = (() => {
    if (!ubicacion) return undefined;
    const parts = [ubicacion.nombre, ubicacion.ciudad].filter(Boolean);
    return parts.length ? parts.join(' · ') : undefined;
  })();

  const ritmosRaw =
    (selectedClass?.ritmos && Array.isArray(selectedClass.ritmos) && selectedClass.ritmos) ||
    (selectedClass?.ritmoIds && Array.isArray(selectedClass.ritmoIds) && selectedClass.ritmoIds) ||
    [];
  const ritmosLabel = Array.isArray(ritmosRaw) ? ritmosRaw.slice(0, 3).join(', ') : '';
  const locationName = locationLabel || ubicacion?.ciudad || profile?.ciudad || 'México';
  const classTimes = scheduleLabel ? ` · Horario: ${scheduleLabel}` : '';
  const seoDescription = `${classTitle} con ${creatorName} en ${locationName}${classTimes}${ritmosLabel ? ` · Ritmos: ${ritmosLabel}` : ''}.`;
  const mediaList = (profile as any)?.media || [];
  const seoImage =
    getMediaBySlot(mediaList, 'p1')?.url ||
    getMediaBySlot(mediaList, 'cover')?.url ||
    profile?.avatar_url ||
    profile?.banner_url ||
    SEO_LOGO_URL;
  const classUrl = `${SEO_BASE_URL}/clase/${isTeacher ? 'teacher' : 'academy'}/${idNum}${classIndexParam ? `?i=${classIndexParam}` : classIdParam ? `?classId=${classIdParam}` : ''}`;

  return (
    <>
      <SeoHead
        section="class"
        title={`${classTitle} | ${creatorName}`}
        description={seoDescription}
        image={seoImage}
        url={classUrl}
        keywords={[
          classTitle,
          creatorName,
          locationName,
          ritmosLabel,
          'clases de baile',
          'Dónde Bailar',
        ].filter(Boolean) as string[]}
      />
      <div className="date-public-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)', padding: '24px 0' }}>
      <style>{`
        .date-public-root { padding: 24px 0; }
        .date-public-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; }
        
        /* Hero Banner */
        .class-hero-banner {
          position: relative;
          overflow: hidden;
          min-height: 100vh;
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
          display: flex;
          align-items: center;
          justify-content: center;
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
          align-items: stretch;
          justify-content: center;
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          padding: 2rem 0;
        }
        
        .class-hero-content > div:first-child {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .class-hero-content > div:last-child {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 1rem;
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
          .class-hero-banner { 
            padding: 2rem 1.5rem !important;
            min-height: 100vh !important;
          }
          .class-hero-content { 
            gap: 1.5rem !important;
            padding: 1.5rem 0 !important;
          }
        }
        
        @media (max-width: 480px) {
          .date-public-root { padding: 12px 0 !important; }
          .date-public-inner { padding: 0 12px !important; }
          .class-hero-banner { 
            padding: 1.5rem 1rem !important;
            min-height: 100vh !important;
          }
          .class-hero-content { 
            gap: 1.25rem !important;
            padding: 1rem 0 !important;
          }
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
                    // Fecha específica - parsear como hora local para evitar problemas de zona horaria
                    const fechaDate = (() => {
                      const fechaValue = selectedClass.fecha;
                      // Si la fecha ya incluye hora, extraer solo la parte de fecha
                      const fechaOnly = fechaValue.includes('T') ? fechaValue.split('T')[0] : fechaValue;
                      const [year, month, day] = fechaOnly.split('-').map(Number);
                      // Crear fecha en hora local (no UTC) para evitar mostrar día anterior
                      return new Date(year, month - 1, day);
                    })();
                    const fechaStr = fechaDate.toLocaleDateString('es-ES', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    });
                    return (
                      <span className="chip chip-date">
                        📅 {fechaStr}
                      </span>
                    );
                  } else if (diaParam !== null) {
                    // Si hay un parámetro de día específico en la URL, mostrar solo ese día
                    const diaNum = Number(diaParam);
                    if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const dayName = dayNames[diaNum] || 'Día no especificado';
                      return (
                        <span className="chip chip-date">
                          📅 {dayName}
                        </span>
                      );
                    }
                  } else if (diaParam !== null) {
                    // Si hay un parámetro de día específico en la URL, mostrar solo ese día
                    const diaNum = Number(diaParam);
                    if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const dayName = dayNames[diaNum] || 'Día no especificado';
                      return (
                        <span className="chip chip-date">
                          📅 {dayName}
                        </span>
                      );
                    }
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
                    // Múltiples días - convertir números/strings a nombres de días
                    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const dayNameMap: Record<string, string> = {
                      'domingo': 'Domingo', 'dom': 'Domingo',
                      'lunes': 'Lunes', 'lun': 'Lunes',
                      'martes': 'Martes', 'mar': 'Martes',
                      'miércoles': 'Miércoles', 'miercoles': 'Miércoles', 'mié': 'Miércoles', 'mie': 'Miércoles',
                      'jueves': 'Jueves', 'jue': 'Jueves',
                      'viernes': 'Viernes', 'vie': 'Viernes',
                      'sábado': 'Sábado', 'sabado': 'Sábado', 'sáb': 'Sábado', 'sab': 'Sábado',
                    };
                    const diasLegibles = selectedClass.diasSemana.map((d: string | number) => {
                      if (typeof d === 'number' && d >= 0 && d <= 6) {
                        return dayNames[d];
                      }
                      if (typeof d === 'string') {
                        return dayNameMap[d.toLowerCase()] || d;
                      }
                      return null;
                    }).filter((d: string | null) => d !== null);
                    return (
                      <span className="chip chip-date">
                        📅 {diasLegibles.join(', ')}
                      </span>
                    );
                  }
                  return null;
                })()}
                
                {scheduleLabel && (
                  <span className="chip chip-time">🕒 {scheduleLabel}</span>
                )}
                {costLabel && (
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

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {/* Botón Ver en Maps */}
                {ubicacion && (ubicacion.direccion || ubicacion.nombre || ubicacion.ciudad) && (
                  <motion.a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ubicacion.nombre ?? ''} ${ubicacion.direccion ?? ''} ${ubicacion.ciudad ?? ''}`.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '.55rem',
                      padding: '.6rem 1.1rem',
                      borderRadius: 999,
                      border: '1px solid rgba(240,147,251,.4)',
                      color: '#f7d9ff',
                      background: 'radial-gradient(120% 120% at 0% 0%, rgba(240,147,251,.18), rgba(240,147,251,.08))',
                      boxShadow: '0 6px 18px rgba(240,147,251,.20)',
                      fontWeight: 800,
                      fontSize: '.9rem',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>📍</span>
                    <span>Ver en Maps</span>
                    <span aria-hidden style={{ fontSize: '.85rem' }}>↗</span>
                  </motion.a>
                )}

                {/* Botón de Agregar a Calendario */}
                {selectedClass && (
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <AddToCalendarWithStats
                      eventId={classUniqueId || idNum}
                      classId={classUniqueId || undefined}
                      academyId={!isTeacher ? profile?.id : undefined}
                      teacherId={isTeacher ? profile?.id : undefined}
                      roleBaile={userProfile?.rol_baile || null}
                      zonaTagId={selectedClass?.ubicacionJson?.zona_tag_id || profile?.zonas?.[0] || (userProfile?.zonas?.[0] || null)}
                      title={classTitle}
                      description={`Clase de ${classTitle} con ${creatorName}`}
                      location={locationLabel}
                      fecha={selectedClass?.fecha || null}
                      diaSemana={(() => {
                        // Si hay un parámetro dia en la URL, usar ese día específico
                        if (diaParam !== null) {
                          const diaNum = Number(diaParam);
                          if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                            return diaNum;
                          }
                        }
                        // Si no, usar el diaSemana de la clase
                        return selectedClass?.diaSemana ?? selectedClass?.dia_semana ?? null;
                      })()}
                      diasSemana={(() => {
                        // Si hay un parámetro dia en la URL, no pasar diasSemana (solo ese día específico)
                        if (diaParam !== null) {
                          const diaNum = Number(diaParam);
                          if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                            return null; // No pasar diasSemana, solo diaSemana con el día específico
                          }
                        }
                        // Si no hay parámetro dia, usar la lógica normal
                        if (selectedClass?.diasSemana && Array.isArray(selectedClass.diasSemana)) {
                          const dayMap: Record<string, number> = {
                            'domingo': 0, 'dom': 0,
                            'lunes': 1, 'lun': 1,
                            'martes': 2, 'mar': 2,
                            'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
                            'jueves': 4, 'jue': 4,
                            'viernes': 5, 'vie': 5,
                            'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
                          };
                          const dias = selectedClass.diasSemana
                            .map((d: string) => dayMap[String(d).toLowerCase().trim()])
                            .filter((d: number | undefined) => d !== undefined) as number[];
                          return dias.length > 0 ? dias : null;
                        }
                        return null;
                      })()}
                      start={(() => {
                        try {
                          if (selectedClass.fecha) {
                            const fechaStr = selectedClass.fecha.includes('T') ? selectedClass.fecha.split('T')[0] : selectedClass.fecha;
                            const hora = (selectedClass.inicio || '20:00').split(':').slice(0, 2).join(':');
                            return new Date(`${fechaStr}T${hora}:00`);
                          }
                          // Si es clase semanal, calcular próxima ocurrencia usando el día específico de la URL si está presente
                          const diaParaCalcular = (() => {
                            if (diaParam !== null) {
                              const diaNum = Number(diaParam);
                              if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                                return diaNum;
                              }
                            }
                            return selectedClass?.diaSemana ?? selectedClass?.dia_semana ?? null;
                          })();
                          
                          if (diaParaCalcular !== null && typeof diaParaCalcular === 'number') {
                            const hora = (selectedClass.inicio || '20:00').split(':').slice(0, 2).join(':');
                            return calculateNextDateWithTime(diaParaCalcular, hora);
                          }
                          
                          // Fallback: usar fecha/hora actual
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
                          // Si es clase semanal, calcular próxima ocurrencia usando el día específico de la URL si está presente
                          const diaParaCalcular = (() => {
                            if (diaParam !== null) {
                              const diaNum = Number(diaParam);
                              if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) {
                                return diaNum;
                              }
                            }
                            return selectedClass?.diaSemana ?? selectedClass?.dia_semana ?? null;
                          })();
                          
                          if (diaParaCalcular !== null && typeof diaParaCalcular === 'number') {
                            const hora = (selectedClass.fin || selectedClass.inicio || '22:00').split(':').slice(0, 2).join(':');
                            const startDate = calculateNextDateWithTime(diaParaCalcular, selectedClass.inicio || '20:00');
                            const endDate = new Date(startDate);
                            const [horaFin, minutoFin] = hora.split(':').map(Number);
                            endDate.setHours(horaFin || 22, minutoFin || 0, 0, 0);
                            // Si la hora de fin es menor o igual a la de inicio, agregar 2 horas
                            if (endDate.getTime() <= startDate.getTime()) {
                              endDate.setHours(startDate.getHours() + 2);
                            }
                            return endDate;
                          }
                          
                          // Fallback: usar fecha/hora actual
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
    </>
  );
}


