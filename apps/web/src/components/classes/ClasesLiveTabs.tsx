import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Eye, MapPin, Share2, Tag } from "lucide-react";
import type { Clase } from "@/types/classes";
import { groupClassesByWeekday } from "@/utils/classesByWeekday";
import ImageWithFallback from "@/components/ImageWithFallback";
import AddToCalendarWithStats from "@/components/AddToCalendarWithStats";
import ShareButton from "@/components/events/ShareButton";
import { buildShareUrl } from "@/utils/shareUrls";
import RequireLogin from "@/components/auth/RequireLogin";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { useTags } from "@/hooks/useTags";
import { useUserProfile } from "@/hooks/useUserProfile";
import { FaWhatsapp } from 'react-icons/fa';
import { ClasesLiveDayHeader } from "@/components/classes/ClasesLiveDayHeader";
import "./ClasesLiveTabs.css";

// Helper para construir URL de WhatsApp con mensaje personalizado para clases
function buildClassWhatsAppUrl(
  phone?: string | null,
  messageTemplate?: string | null,
  className?: string
): string | undefined {
  if (!phone) return undefined;
  
  const cleanedPhone = phone.replace(/[^\d]/g, '');
  if (!cleanedPhone) return undefined;

  let message = '';
  if (messageTemplate && className) {
    // Reemplazar {nombre} o {clase} con el nombre de la clase
    message = messageTemplate
      .replace(/\{nombre\}/g, className)
      .replace(/\{clase\}/g, className);
  } else if (className) {
    // Mensaje por defecto si no hay template
    message = `me interesa la clase: ${className}`;
  }

  // Prepend "Hola vengo de Donde Bailar MX, " al mensaje
  const fullMessage = message.trim() 
    ? `Hola vengo de Donde Bailar MX, ${message.trim()}`
    : 'Hola vengo de Donde Bailar MX';

  const encoded = encodeURIComponent(fullMessage);
  return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encoded}`;
}

type Props = {
  classes: Clase[];
  title?: string;
  subtitle?: string;
  sourceType?: 'teacher' | 'academy';
  sourceId?: number;
  isClickable?: boolean;
  whatsappNumber?: string | null;
  whatsappMessageTemplate?: string | null;
  stripeAccountId?: string | null;
  stripeChargesEnabled?: boolean | null;
  creatorName?: string | null;
};

const ClasesLiveTabs = React.memo(function ClasesLiveTabs({ 
  classes, 
  title = "Clases", 
  subtitle,
  sourceType,
  sourceId,
  isClickable = false,
  whatsappNumber,
  whatsappMessageTemplate,
  stripeAccountId,
  stripeChargesEnabled,
  creatorName
}: Props) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = React.useState(false);
  const { data: allTags } = useTags() as any;
  const { profile: userProfile } = useUserProfile();
  console.log("[ClasesLiveTabs] Received classes:", classes);
  console.log("[ClasesLiveTabs] 🔍 Clases con cronogramaIndex:", classes.map((c: Clase) => ({
    id: c.id,
    titulo: c.titulo,
    cronogramaIndex: c.cronogramaIndex,
    calculatedIndex: Math.floor(c.id / 1000)
  })));
  const days = React.useMemo(() => {
    const grouped = groupClassesByWeekday(classes || []);
    console.log("[ClasesLiveTabs] Grouped days:", grouped);
    // Log para verificar que el cronogramaIndex se preserve después de agrupar
    grouped.forEach((d, dayIdx) => {
      console.log(`[ClasesLiveTabs] 🔍 Día ${d.label} (${d.key}):`, d.items.map((c: Clase) => ({
        id: c.id,
        titulo: c.titulo,
        cronogramaIndex: c.cronogramaIndex,
        calculatedIndex: Math.floor(c.id / 1000)
      })));
    });
    return grouped;
  }, [classes]);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [expandedDays, setExpandedDays] = React.useState<Set<number>>(new Set());
  
  console.log("[ClasesLiveTabs] Days length:", days.length, "Active idx:", activeIdx);

  // Función para convertir ritmo (ID numérico, slug, o nombre) al nombre legible
  const getRitmoName = React.useCallback((ritmo: string | number | null | undefined, ritmosSeleccionados?: string[] | number[] | null): string | null => {
    if (!ritmo && (!ritmosSeleccionados || ritmosSeleccionados.length === 0)) return null;
    
    // 1. Priorizar ritmos_seleccionados (slugs del catálogo)
    if (Array.isArray(ritmosSeleccionados) && ritmosSeleccionados.length > 0) {
      const labelById = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelById.set(i.id, i.label)));
      const firstSlug = String(ritmosSeleccionados[0]);
      const name = labelById.get(firstSlug);
      if (name) return name;
    }
    
    // 2. Si ritmo es un slug del catálogo
    if (typeof ritmo === 'string') {
      const labelById = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelById.set(i.id, i.label)));
      const name = labelById.get(ritmo);
      if (name) return name;
      
      // Si ya es un nombre legible, devolverlo
      if (labelById.has(ritmo) || RITMOS_CATALOG.some(g => g.items.some(i => i.label === ritmo))) {
        return ritmo;
      }
    }
    
    // 3. Si ritmo es un ID numérico, buscar en tags
    if (typeof ritmo === 'number' || (typeof ritmo === 'string' && /^\d+$/.test(ritmo))) {
      const ritmoId = typeof ritmo === 'number' ? ritmo : parseInt(ritmo, 10);
      if (allTags && Array.isArray(allTags)) {
        const tag = allTags.find((t: any) => t.id === ritmoId && t.tipo === 'ritmo');
        if (tag?.nombre) return tag.nombre;
      }
    }
    
    // 4. Si no se encontró, devolver el valor original como string
    return ritmo ? String(ritmo) : null;
  }, [allTags]);

  // Detectar si es móvil
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (activeIdx >= days.length) setActiveIdx(0);
  }, [days.length, activeIdx]);

  React.useEffect(() => {
    if (days.length === 0) return;
    setExpandedDays((prev) => {
      if (prev.size > 0) return prev;
      return new Set([days[0].key]);
    });
  }, [days.length, days[0]?.key]);

  const handleTabClick = (index: number) => {
    if (isMobile) {
      // En móvil: si ya está activa, colapsar; si no, expandir
      setActiveIdx(activeIdx === index ? -1 : index);
    } else {
      // En desktop: siempre mostrar el contenido
      setActiveIdx(index);
    }
  };

  const toggleDay = (dayKey: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayKey)) {
        next.delete(dayKey);
      } else {
        next.add(dayKey);
      }
      return next;
    });
  };

  const handleClassClick = (clase: Clase) => {
    if (isClickable && sourceType && sourceId) {
      // Usar cronogramaIndex si está disponible, si no usar el índice calculado desde el id
      // El id se calcula como: cronogramaIndex * 1000 + diaIdx
      // Entonces: cronogramaIndex = Math.floor(id / 1000)
      const cronogramaIndex = clase.cronogramaIndex !== null && clase.cronogramaIndex !== undefined 
        ? clase.cronogramaIndex 
        : Math.floor(clase.id / 1000);
      
      // Asegurar que sourceId sea un string válido
      const sourceIdStr = String(sourceId);
      const route = `/clase/${sourceType}/${sourceIdStr}?i=${cronogramaIndex}`;
      console.log("[ClasesLiveTabs] 🔍 Navegando a:", route, { 
        sourceType, 
        sourceId, 
        sourceIdStr, 
        claseId: clase.id,
        cronogramaIndex,
        claseCronogramaIndex: clase.cronogramaIndex,
        titulo: clase.titulo
      });
      navigate(route);
    } else {
      console.warn("[ClasesLiveTabs] ⚠️ No se puede navegar - faltan datos:", { isClickable, sourceType, sourceId });
    }
  };

  // Formatear fecha: día número + mes abreviado (ej: "15 Nov")
  const formatDateShort = (fecha?: string | null, diaSemana?: number | null): string | null => {
    if (fecha) {
      try {
        const plain = String(fecha).split('T')[0];
        const [year, month, day] = plain.split('-').map((part) => parseInt(part, 10));
        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
          // Crear fecha en hora local para evitar problemas de zona horaria
          const safe = new Date(year, month - 1, day);
          return safe.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short'
          });
        }
      } catch (e) {
        console.error('[ClasesLiveTabs] Error formatting date:', e);
      }
    }
    // Si es clase recurrente (dia_semana), calcular próxima fecha
    if (typeof diaSemana === 'number' && diaSemana >= 0 && diaSemana <= 6) {
      const today = new Date();
      const currentDay = today.getDay();
      let daysUntil = diaSemana - currentDay;
      if (daysUntil < 0) daysUntil += 7; // Si ya pasó este día, ir a la próxima semana
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntil);
      return nextDate.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        timeZone: 'America/Mexico_City'
      });
    }
    return null;
  };

  /** Subtítulo opcional bajo el nombre del día (ej. «13 abr» o próxima ocurrencia semanal). */
  const getDayDateSubline = (d: { key: number; items: Clase[] }): string | null => {
    const sortedFechas = d.items
      .map((c) => c.fecha)
      .filter(Boolean)
      .sort() as string[];
    if (sortedFechas.length > 0) {
      return formatDateShort(sortedFechas[0], null);
    }
    return formatDateShort(undefined, d.key);
  };

  // Calcular fecha completa para el calendario (necesita fecha completa, no solo día)
  const getFullDateForCalendar = (fecha?: string | null, diaSemana?: number | null, horaInicio?: string | null): string | null => {
    if (fecha) {
      return fecha;
    }
    if (typeof diaSemana === 'number' && diaSemana >= 0 && diaSemana <= 6) {
      const hoy = new Date();
      const hoyDia = hoy.getDay();
      let diasHasta = diaSemana - hoyDia;
      
      // Si tenemos hora de inicio, considerar si la hora ya pasó hoy
      if (horaInicio && typeof horaInicio === 'string') {
        const [hora, minutos] = horaInicio.split(':').map(Number);
        const horaClase = (hora || 20) * 60 + (minutos || 0);
        const horaActual = hoy.getHours() * 60 + hoy.getMinutes();
        
        // Si el día ya pasó esta semana, o si es el mismo día pero la hora ya pasó, ir a la próxima semana
        if (diasHasta < 0 || (diasHasta === 0 && horaActual >= horaClase)) {
          diasHasta += 7;
        }
      } else {
        // Si no hay hora, solo considerar si el día ya pasó
        if (diasHasta < 0) diasHasta += 7;
      }
      
      const nextDate = new Date(hoy);
      nextDate.setDate(hoy.getDate() + diasHasta);
      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextDate.getDate()).padStart(2, '0');
      
      console.log('[ClasesLiveTabs] 📅 Fecha calculada:', {
        diaSemana,
        horaInicio,
        hoyDia,
        diasHasta,
        fechaCalculada: `${year}-${month}-${day}`
      });
      
      return `${year}-${month}-${day}`;
    }
    return null;
  };

  if (!days.length) {
    return (
      <div
        style={{
          padding: "2rem",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
          color: "#fff",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: "1.25rem", marginBottom: ".25rem" }}>{title}</div>
        {subtitle && <div style={{ opacity: 0.8, marginBottom: "1rem" }}>{subtitle}</div>}
        <div style={{ opacity: 0.8 }}>No hay clases programadas por ahora.</div>
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: "1rem", padding: "0.5rem", background: "rgba(255,0,0,0.1)", borderRadius: 8, fontSize: "0.75rem" }}>
            Debug: {classes?.length || 0} clases recibidas. 
            {classes?.length > 0 && (
              <div style={{ marginTop: "0.5rem" }}>
                Clases sin dia_semana/fecha: {classes.filter(c => !c.dia_semana && !c.diaSemana && !c.fecha).length}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const clasesLiveCardStyles = `
    .clases-live-card {
      width: 100%;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      padding: clamp(0.75rem, 2.5vw, 1.25rem) !important;
      border-radius: clamp(12px, 2.5vw, 18px) !important;
      gap: clamp(0.5rem, 1.5vw, 1rem) !important;
    }
    .clases-live-card h4 {
      word-wrap: break-word;
      overflow-wrap: break-word;
      min-width: 0;
      font-size: clamp(0.95rem, 2.2vw, 1.15rem) !important;
      line-height: 1.25;
      margin: 0;
    }
    .clases-live-card-meta {
      overflow-wrap: break-word;
      word-break: break-word;
      min-width: 0;
      font-size: clamp(0.78rem, 1.8vw, 0.95rem) !important;
      gap: clamp(0.4rem, 1vw, 0.75rem) !important;
      line-height: 1.4;
    }
    /* Móvil muy pequeño */
    @media (max-width: 360px) {
      .clases-live-card { padding: 0.6rem !important; border-radius: 10px !important; }
      .clases-live-card h4 { font-size: 0.9rem !important; }
      .clases-live-card-meta { font-size: 0.72rem !important; }
    }
    /* Móvil estándar */
    @media (max-width: 480px) {
      .clases-live-card { padding: 0.75rem !important; border-radius: 12px !important; }
      .clases-live-card h4 { font-size: 1rem !important; }
      .clases-live-card-meta { font-size: 0.8rem !important; }
    }
    /* Móvil grande / phablet */
    @media (min-width: 481px) and (max-width: 600px) {
      .clases-live-card { padding: 0.85rem !important; border-radius: 14px !important; }
      .clases-live-card h4 { font-size: 1.05rem !important; }
      .clases-live-card-meta { font-size: 0.85rem !important; }
    }
    /* Tablet */
    @media (min-width: 601px) and (max-width: 900px) {
      .clases-live-card { padding: clamp(0.9rem, 1.5vw, 1.1rem) !important; border-radius: 16px !important; }
      .clases-live-card h4 { font-size: 1.08rem !important; }
      .clases-live-card-meta { font-size: 0.9rem !important; }
    }
    /* Desktop */
    @media (min-width: 901px) {
      .clases-live-card { padding: 1rem 1.25rem !important; border-radius: 18px !important; }
      .clases-live-card h4 { font-size: 1.15rem !important; }
      .clases-live-card-meta { font-size: 0.95rem !important; }
    }
    /* Evitar desborde en contenedores flex/grid */
    .clases-live-card > * { min-width: 0; }
    /* Responsivo: header (nombre, nivel, fecha) en una columna y dos filas */
    @media (max-width: 768px) {
      .clases-live-card-header {
        display: grid !important;
        grid-template-columns: 1fr !important;
        grid-template-rows: auto auto !important;
        gap: 0.5rem !important;
      }
      .clases-live-card-header > div:first-child { grid-column: 1; grid-row: 1; }
      .clases-live-card-header > div:last-child { grid-column: 1; grid-row: 2; }
    }
  `;

  // En móvil: mostrar lista vertical de días con sus clases
  if (isMobile) {
    return (
      <div className="clt-root clt-mobile-shell">
        <style>{clasesLiveCardStyles}</style>
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: "6px", letterSpacing: "-0.02em" }}>{title}</div>
          {subtitle && <div style={{ opacity: 0.78, fontSize: ".9rem", lineHeight: 1.4 }}>{subtitle}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {days.map((d) => {
            const isExpanded = expandedDays.has(d.key);
            const countLabel = `${d.items.length} ${d.items.length === 1 ? "clase" : "clases"}`;
            return (
              <div key={d.key} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <ClasesLiveDayHeader
                  dayLabel={d.label}
                  dateSubline={getDayDateSubline(d)}
                  countLabel={countLabel}
                  expanded={isExpanded}
                  onToggle={() => toggleDay(d.key)}
                />

                <motion.div
                  className="clt-day-collapsible"
                  initial={false}
                  animate={{
                    height: isExpanded ? "auto" : 0,
                    opacity: isExpanded ? 1 : 0,
                    marginBottom: isExpanded ? "0" : 0,
                  }}
                  transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {isExpanded && d.items.map((c, idx) => {
                  const titulo = c.titulo || c.nombre || 'Clase';
                  const horaInicio = c.hora_inicio || c.inicio || '';
                  const horaFin = c.hora_fin || c.fin || '';
                  const ubicacion = c.ubicacion || (c.ubicacionJson?.nombre || c.ubicacionJson?.direccion || c.ubicacionJson?.lugar || '');
                  const costo = c.costo;
                  const moneda = c.moneda || 'MXN';
                  const coverUrl = c.cover_url;
                  const nivel = c.nivel;
                  const ritmo = c.ritmo;
                  const fecha = c.fecha;
                  const ritmoNombre = getRitmoName(ritmo, c.ritmos_seleccionados ?? null);
                  const placeShort = (() => {
                    if (!ubicacion) return "";
                    const u = String(ubicacion).trim();
                    for (const sep of [",", "·", "-", "|"]) {
                      if (u.includes(sep)) return u.split(sep)[0]!.trim();
                    }
                    return u;
                  })();

                  // Crear clave única combinando día, índice y ID de clase
                  const uniqueKey = `day-${d.key}-class-${c.id || `idx-${idx}`}-${idx}`;
                  
                  return (
                    <motion.article
                      key={uniqueKey}
                      className={`clases-live-card clt-card${isClickable ? " clt-card--clickable" : ""}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                      onClick={() => handleClassClick(c)}
                      whileHover={isClickable ? { y: -2 } : {}}
                    >
                      {coverUrl && (
                        <div className="clt-card__media">
                          <ImageWithFallback
                            src={coverUrl}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                      )}

                      <div className="clt-card__body">
                        <h4 className="clt-card__title">{titulo}</h4>

                        <div className="clt-chips">
                          {c.fechaModo === "por_agendar" ? (
                            <span className="clt-chip clt-chip--warn">
                              <Calendar size={12} strokeWidth={2.25} aria-hidden />
                              Por agendar
                            </span>
                          ) : formatDateShort(fecha, c.dia_semana || c.diaSemana) ? (
                            <span className="clt-chip clt-chip--accent">
                              <Calendar size={12} strokeWidth={2.25} aria-hidden />
                              {formatDateShort(fecha, c.dia_semana || c.diaSemana)}
                            </span>
                          ) : null}
                          {nivel ? (
                            <span className="clt-chip clt-chip--muted">
                              <Tag size={12} strokeWidth={2.25} aria-hidden />
                              {nivel}
                            </span>
                          ) : null}
                          {ritmoNombre ? (
                            <span className="clt-chip clt-chip--muted">{ritmoNombre}</span>
                          ) : null}
                          {typeof costo === "number" && costo === 0 && (
                            <span className="clt-chip">Gratis</span>
                          )}
                          {typeof costo === "number" && costo > 0 && (
                            <span className="clt-chip">
                              {new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda }).format(costo)}
                            </span>
                          )}
                        </div>

                        <div className="clt-info">
                          {c.fechaModo === "por_agendar" ? (
                            c.duracionHoras ? (
                              <span className="clt-info__item">
                                <Clock size={14} strokeWidth={2} aria-hidden />
                                {c.duracionHoras} {c.duracionHoras === 1 ? "hora" : "horas"}
                              </span>
                            ) : null
                          ) : c.horarioModo === "duracion" && c.duracionHoras ? (
                            <span className="clt-info__item">
                              <Clock size={14} strokeWidth={2} aria-hidden />
                              {c.duracionHoras} {c.duracionHoras === 1 ? "hora" : "horas"}
                            </span>
                          ) : horaInicio || horaFin ? (
                            <span className="clt-info__item">
                              <Clock size={14} strokeWidth={2} aria-hidden />
                              {horaInicio && horaFin ? `${horaInicio}–${horaFin}` : horaInicio || horaFin}
                            </span>
                          ) : null}
                          {placeShort ? (
                            <>
                              <span className="clt-info__sep" aria-hidden />
                              <span className="clt-info__item clt-info__place" title={ubicacion}>
                                <MapPin size={14} strokeWidth={2} aria-hidden />
                                {placeShort}
                              </span>
                            </>
                          ) : null}
                        </div>

                        {c.descripcion && <p className="clt-card__desc">{c.descripcion}</p>}

                        <div className="clt-actions">
                          {(() => {
                            // Si la clase es "por agendar", no mostrar botón de calendario
                            if (c.fechaModo === 'por_agendar') {
                              const cronogramaIndex = c.cronogramaIndex !== null && c.cronogramaIndex !== undefined 
                                ? c.cronogramaIndex 
                                : Math.floor((c.id || 0) / 1000);
                              const shareUrl = isClickable && sourceType && sourceId
                                ? buildShareUrl("clase", String(sourceId), { type: sourceType, index: cronogramaIndex })
                                : (sourceType && sourceId
                                  ? buildShareUrl("clase", String(sourceId), { type: sourceType })
                                  : window.location.href);
                              
                              return (
                                <>
                                  {isClickable && sourceType && sourceId && (
                                    <button
                                      type="button"
                                      className="clt-btn-detail"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClassClick(c);
                                      }}
                                    >
                                      <Eye size={18} strokeWidth={2.25} aria-hidden />
                                      Ver detalle
                                    </button>
                                  )}
                                  <div className="clt-actions__toolbar">
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <ShareButton
                                        url={shareUrl}
                                        title={titulo}
                                        text={`${titulo}${ubicacion ? ` - ${ubicacion}` : ""}`}
                                        className="clt-share-btn"
                                        style={{
                                          padding: 0,
                                          minWidth: 44,
                                          minHeight: 44,
                                          width: 44,
                                          height: 44,
                                          borderRadius: 12,
                                        }}
                                      >
                                        <Share2 size={18} strokeWidth={2.25} aria-hidden />
                                      </ShareButton>
                                    </div>
                                    {whatsappNumber && titulo && (
                                      <a
                                        className="clt-wa-icon"
                                        href={buildClassWhatsAppUrl(whatsappNumber, whatsappMessageTemplate, titulo) || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label="WhatsApp"
                                        title="WhatsApp"
                                      >
                                        <FaWhatsapp size={20} />
                                      </a>
                                    )}
                                  </div>
                                </>
                              );
                            }
                            
                            // Calcular el día para usar en el calendario
                            // Priorizar diaSemana/dia_semana (día específico de esta clase expandida)
                            // Si no existe, usar el primer día de diasSemana
                            const diaParaCalcular = (() => {
                              // Primero, intentar usar diaSemana o dia_semana (día específico de esta clase)
                              if (c.diaSemana !== null && c.diaSemana !== undefined && typeof c.diaSemana === 'number' && c.diaSemana >= 0 && c.diaSemana <= 6) {
                                return c.diaSemana;
                              }
                              if (c.dia_semana !== null && c.dia_semana !== undefined && typeof c.dia_semana === 'number' && c.dia_semana >= 0 && c.dia_semana <= 6) {
                                return c.dia_semana;
                              }
                              
                              // Si no tiene diaSemana específico, usar el primer día de diasSemana
                              if (c.diasSemana && Array.isArray(c.diasSemana) && c.diasSemana.length > 0) {
                                const dayMap: Record<string, number> = {
                                  'domingo': 0, 'dom': 0,
                                  'lunes': 1, 'lun': 1,
                                  'martes': 2, 'mar': 2,
                                  'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
                                  'jueves': 4, 'jue': 4,
                                  'viernes': 5, 'vie': 5,
                                  'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
                                };
                                const firstDay = c.diasSemana[0];
                                if (typeof firstDay === 'number' && firstDay >= 0 && firstDay <= 6) {
                                  return firstDay;
                                }
                                if (typeof firstDay === 'string') {
                                  const dayNum = dayMap[firstDay.toLowerCase().trim()];
                                  if (dayNum !== undefined) return dayNum;
                                }
                              }
                              
                              return null;
                            })();
                            
                            console.log('[ClasesLiveTabs] 🔍 Día calculado para calendario:', {
                              titulo: c.titulo,
                              diaSemana: c.diaSemana,
                              dia_semana: c.dia_semana,
                              diasSemana: c.diasSemana,
                              diaParaCalcular
                            });
                            
                      // Validar y normalizar horas
                      const normalizeTime = (timeStr: string | null | undefined, defaultTime: string): string => {
                        if (!timeStr || typeof timeStr !== 'string') return defaultTime;
                        // Asegurar formato HH:MM
                        const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);
                        if (timeMatch) {
                          const hours = parseInt(timeMatch[1], 10);
                          const minutes = parseInt(timeMatch[2], 10);
                          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                          }
                        }
                        console.warn('[ClasesLiveTabs] ⚠️ Hora inválida, usando default:', { received: timeStr, default: defaultTime });
                        return defaultTime;
                      };
                      
                      const startTime = normalizeTime(horaInicio, '10:00');
                      const endTime = normalizeTime(horaFin, '12:00');
                      
                      // Pasar la hora de inicio para que getFullDateForCalendar considere si la hora ya pasó
                      const fullDate = getFullDateForCalendar(fecha, diaParaCalcular, startTime);
                      
                      // Construir fecha/hora completa para el calendario
                      let calendarStart: string | null = null;
                      let calendarEnd: string | null = null;
                      
                      if (fullDate) {
                        const [year, month, day] = fullDate.split('-').map(Number);
                        const [startHour, startMin] = startTime.split(':').map(Number);
                        const [endHour, endMin] = endTime.split(':').map(Number);
                        
                        // Validar que los valores sean números válidos
                        if (!isNaN(year) && !isNaN(month) && !isNaN(day) && 
                            !isNaN(startHour) && !isNaN(startMin) && 
                            !isNaN(endHour) && !isNaN(endMin)) {
                          // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
                          const startDate = new Date(year, month - 1, day, startHour, startMin, 0, 0);
                          const endDate = new Date(year, month - 1, day, endHour, endMin, 0, 0);
                          
                          // Validar que las fechas sean válidas
                          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                            calendarStart = startDate.toISOString();
                            calendarEnd = endDate.toISOString();
                            
                            // Log para depuración
                            console.log('[ClasesLiveTabs] ✅ Fechas construidas (desktop):', {
                              titulo: c.titulo,
                              fullDate,
                              startTime,
                              endTime,
                              calendarStart,
                              calendarEnd,
                              diasSemana: c.diasSemana,
                              diaParaCalcular
                            });
                          } else {
                            console.warn('[ClasesLiveTabs] ⚠️ Fechas inválidas (desktop):', { startDate, endDate, fullDate, startTime, endTime });
                          }
                        } else {
                          console.warn('[ClasesLiveTabs] ⚠️ Valores numéricos inválidos (desktop):', { year, month, day, startHour, startMin, endHour, endMin });
                        }
                      } else {
                        console.warn('[ClasesLiveTabs] ⚠️ No se pudo calcular fullDate (desktop):', { fecha, diaParaCalcular, diasSemana: c.diasSemana });
                      }

                            // Calcular cronogramaIndex desde el id de la clase
                            const cronogramaIndex = c.cronogramaIndex !== null && c.cronogramaIndex !== undefined 
                              ? c.cronogramaIndex 
                              : Math.floor((c.id || 0) / 1000);
                            
                            const shareUrl = isClickable && sourceType && sourceId 
                              ? `${window.location.origin}/clase/${sourceType}/${sourceId}?i=${cronogramaIndex}`
                              : (sourceType && sourceId 
                                ? `${window.location.origin}/clase/${sourceType}/${sourceId}`
                                : window.location.href);

                            return (
                              <>
                                {isClickable && sourceType && sourceId && (
                                  <button
                                    type="button"
                                    className="clt-btn-detail"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleClassClick(c);
                                    }}
                                  >
                                    <Eye size={18} strokeWidth={2.25} aria-hidden />
                                    Ver detalle
                                  </button>
                                )}
                                <div className="clt-actions__toolbar">
                                  {calendarStart && calendarEnd && (
                                    <div className="clt-actions__cal-wrap" onClick={(e) => e.stopPropagation()}>
                                      {(() => {
                                        const classIdForMetrics = (c.id !== null && c.id !== undefined) ? c.id : (idx * 1000);
                                        return (
                                          <AddToCalendarWithStats
                                            eventId={c.id || idx}
                                            classId={classIdForMetrics}
                                            academyId={sourceType === 'academy' && sourceId ? Number(sourceId) : undefined}
                                            teacherId={sourceType === 'teacher' && sourceId ? Number(sourceId) : undefined}
                                            roleBaile={userProfile?.rol_baile || null}
                                            zonaTagId={c.ubicacionJson?.zona_tag_id || (userProfile?.zonas?.[0] || null)}
                                            title={titulo}
                                            description={c.descripcion || undefined}
                                            location={ubicacion || undefined}
                                            start={calendarStart}
                                            end={calendarEnd}
                                            showAsIcon={true}
                                            fecha={c.fecha || null}
                                            diaSemana={c.diaSemana ?? c.dia_semana ?? null}
                                            diasSemana={(() => {
                                              if (c.diasSemana && Array.isArray(c.diasSemana)) {
                                                const dayMap: Record<string, number> = {
                                                  domingo: 0,
                                                  dom: 0,
                                                  lunes: 1,
                                                  lun: 1,
                                                  martes: 2,
                                                  mar: 2,
                                                  miércoles: 3,
                                                  miercoles: 3,
                                                  mié: 3,
                                                  mie: 3,
                                                  jueves: 4,
                                                  jue: 4,
                                                  viernes: 5,
                                                  vie: 5,
                                                  sábado: 6,
                                                  sabado: 6,
                                                  sáb: 6,
                                                  sab: 6,
                                                };
                                                const dias = c.diasSemana
                                                  .map((dd: string) => dayMap[String(dd).toLowerCase().trim()])
                                                  .filter((dd: number | undefined) => dd !== undefined) as number[];
                                                return dias.length > 0 ? dias : null;
                                              }
                                              return null;
                                            })()}
                                          />
                                        );
                                      })()}
                                    </div>
                                  )}
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <ShareButton
                                      url={shareUrl}
                                      title={titulo}
                                      text={`${titulo}${ubicacion ? ` - ${ubicacion}` : ""}`}
                                      className="clt-share-btn"
                                      style={{
                                        padding: 0,
                                        minWidth: 44,
                                        minHeight: 44,
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                      }}
                                    >
                                      <Share2 size={18} strokeWidth={2.25} aria-hidden />
                                    </ShareButton>
                                  </div>
                                  {whatsappNumber && titulo && (
                                    <a
                                      className="clt-wa-icon"
                                      href={buildClassWhatsAppUrl(whatsappNumber, whatsappMessageTemplate, titulo) || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      aria-label="WhatsApp"
                                      title="WhatsApp"
                                    >
                                      <FaWhatsapp size={20} />
                                    </a>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.article>
                  );
                  })}
                  </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: diseño con tabs verticales
  return (
    <div className="clt-root clt-desktop">
      <style>{clasesLiveCardStyles}</style>
      <div style={{ display: "contents" }}>
        {/* Sidebar / Tabs verticales */}
        <nav className="clt-nav" aria-label="Días de la semana con clases">
          <div>
            <div className="clt-nav-title">{title}</div>
            {subtitle && <div className="clt-nav-sub">{subtitle}</div>}
          </div>

          {days.map((d, i) => {
            const isActive = i === activeIdx;
            const countLabel = `${d.items.length}`;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveIdx(i)}
                aria-pressed={isActive}
                className={`clt-nav-btn${isActive ? " clt-nav-btn--active" : ""}`}
              >
                <span>{d.label}</span>
                <span className="clt-nav-btn__badge">{countLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Panel de contenido */}
        <section
          className="clt-tabpanel"
          role="tabpanel"
          aria-label={`Clases del día ${days[activeIdx]?.label}`}
          style={{ display: "grid", gap: "1rem", minWidth: 0 }}
        >
          {days[activeIdx]?.items.map((c, idx) => {
            const titulo = c.titulo || c.nombre || 'Clase';
            const horaInicio = c.hora_inicio || c.inicio || '';
            const horaFin = c.hora_fin || c.fin || '';
            const ubicacion = c.ubicacion || (c.ubicacionJson?.nombre || c.ubicacionJson?.direccion || c.ubicacionJson?.lugar || '');
            const costo = c.costo;
            const moneda = c.moneda || 'MXN';
            const coverUrl = c.cover_url;
            const nivel = c.nivel;
            const ritmo = c.ritmo;
            const fecha = c.fecha;
            const ritmoNombre = getRitmoName(ritmo, c.ritmos_seleccionados ?? null);
            const placeShort = (() => {
              if (!ubicacion) return "";
              const u = String(ubicacion).trim();
              for (const sep of [",", "·", "-", "|"]) {
                if (u.includes(sep)) return u.split(sep)[0]!.trim();
              }
              return u;
            })();

            // Crear clave única combinando día activo, índice y ID de clase
            const uniqueKey = `desktop-day-${activeIdx}-class-${c.id || `idx-${idx}`}-${idx}`;

            return (
              <motion.article
                key={uniqueKey}
                className={`clases-live-card clt-card${isClickable ? " clt-card--clickable" : ""}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                onClick={() => handleClassClick(c)}
                whileHover={isClickable ? { y: -2 } : {}}
              >
                {coverUrl && (
                  <div className="clt-card__media">
                    <ImageWithFallback
                      src={coverUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                )}

                <div className="clt-card__body">
                  <h4 className="clt-card__title">{titulo}</h4>

                  <div className="clt-chips">
                    {c.fechaModo === "por_agendar" ? (
                      <span className="clt-chip clt-chip--warn">
                        <Calendar size={12} strokeWidth={2.25} aria-hidden />
                        Por agendar
                      </span>
                    ) : formatDateShort(fecha, c.dia_semana || c.diaSemana) ? (
                      <span className="clt-chip clt-chip--accent">
                        <Calendar size={12} strokeWidth={2.25} aria-hidden />
                        {formatDateShort(fecha, c.dia_semana || c.diaSemana)}
                      </span>
                    ) : null}
                    {nivel ? (
                      <span className="clt-chip clt-chip--muted">
                        <Tag size={12} strokeWidth={2.25} aria-hidden />
                        {nivel}
                      </span>
                    ) : null}
                    {ritmoNombre ? <span className="clt-chip clt-chip--muted">{ritmoNombre}</span> : null}
                    {typeof costo === "number" && costo === 0 && <span className="clt-chip">Gratis</span>}
                    {typeof costo === "number" && costo > 0 && (
                      <span className="clt-chip">
                        {new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda }).format(costo)}
                      </span>
                    )}
                  </div>

                  <div className="clt-info">
                    {c.fechaModo === "por_agendar" ? (
                      c.duracionHoras ? (
                        <span className="clt-info__item">
                          <Clock size={14} strokeWidth={2} aria-hidden />
                          {c.duracionHoras} {c.duracionHoras === 1 ? "hora" : "horas"}
                        </span>
                      ) : null
                    ) : c.horarioModo === "duracion" && c.duracionHoras ? (
                      <span className="clt-info__item">
                        <Clock size={14} strokeWidth={2} aria-hidden />
                        {c.duracionHoras} {c.duracionHoras === 1 ? "hora" : "horas"}
                      </span>
                    ) : horaInicio || horaFin ? (
                      <span className="clt-info__item">
                        <Clock size={14} strokeWidth={2} aria-hidden />
                        {horaInicio && horaFin ? `${horaInicio}–${horaFin}` : horaInicio || horaFin}
                      </span>
                    ) : null}
                    {placeShort ? (
                      <>
                        <span className="clt-info__sep" aria-hidden />
                        <span className="clt-info__item clt-info__place" title={ubicacion}>
                          <MapPin size={14} strokeWidth={2} aria-hidden />
                          {placeShort}
                        </span>
                      </>
                    ) : null}
                  </div>

                  {c.descripcion && <p className="clt-card__desc">{c.descripcion}</p>}

                  <div className="clt-actions">
                    {(() => {
                      // Si la clase es "por agendar", no mostrar botón de calendario
                      if (c.fechaModo === 'por_agendar') {
                        const cronogramaIndex = c.cronogramaIndex !== null && c.cronogramaIndex !== undefined 
                          ? c.cronogramaIndex 
                          : Math.floor((c.id || 0) / 1000);
                        const shareUrl = isClickable && sourceType && sourceId
                          ? buildShareUrl("clase", String(sourceId), { type: sourceType, index: cronogramaIndex })
                          : (sourceType && sourceId
                            ? buildShareUrl("clase", String(sourceId), { type: sourceType })
                            : window.location.href);
                        
                        return (
                          <>
                            {isClickable && sourceType && sourceId && (
                              <button
                                type="button"
                                className="clt-btn-detail"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClassClick(c);
                                }}
                              >
                                <Eye size={18} strokeWidth={2.25} aria-hidden />
                                Ver detalle
                              </button>
                            )}
                            <div className="clt-actions__toolbar">
                              <div onClick={(e) => e.stopPropagation()}>
                                <ShareButton
                                  url={shareUrl}
                                  title={titulo}
                                  text={`${titulo}${ubicacion ? ` - ${ubicacion}` : ""}`}
                                  className="clt-share-btn"
                                  style={{
                                    padding: 0,
                                    minWidth: 44,
                                    minHeight: 44,
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                  }}
                                >
                                  <Share2 size={18} strokeWidth={2.25} aria-hidden />
                                </ShareButton>
                              </div>
                              {whatsappNumber && titulo && (
                                <RequireLogin fallback={null}>
                                  <a
                                    className="clt-wa-icon"
                                    href={buildClassWhatsAppUrl(whatsappNumber, whatsappMessageTemplate, titulo) || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label="WhatsApp"
                                    title="WhatsApp"
                                  >
                                    <FaWhatsapp size={20} />
                                  </a>
                                </RequireLogin>
                              )}
                            </div>
                          </>
                        );
                      }
                      
                      // Calcular el día para usar en el calendario
                      // Priorizar diaSemana/dia_semana (día específico de esta clase expandida)
                      // Si no existe, usar el primer día de diasSemana
                      const diaParaCalcular = (() => {
                        // Primero, intentar usar diaSemana o dia_semana (día específico de esta clase)
                        if (c.diaSemana !== null && c.diaSemana !== undefined && typeof c.diaSemana === 'number' && c.diaSemana >= 0 && c.diaSemana <= 6) {
                          return c.diaSemana;
                        }
                        if (c.dia_semana !== null && c.dia_semana !== undefined && typeof c.dia_semana === 'number' && c.dia_semana >= 0 && c.dia_semana <= 6) {
                          return c.dia_semana;
                        }
                        
                        // Si no tiene diaSemana específico, usar el primer día de diasSemana
                        if (c.diasSemana && Array.isArray(c.diasSemana) && c.diasSemana.length > 0) {
                          const dayMap: Record<string, number> = {
                            'domingo': 0, 'dom': 0,
                            'lunes': 1, 'lun': 1,
                            'martes': 2, 'mar': 2,
                            'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
                            'jueves': 4, 'jue': 4,
                            'viernes': 5, 'vie': 5,
                            'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
                          };
                          const firstDay = c.diasSemana[0];
                          if (typeof firstDay === 'number' && firstDay >= 0 && firstDay <= 6) {
                            return firstDay;
                          }
                          if (typeof firstDay === 'string') {
                            const dayNum = dayMap[firstDay.toLowerCase().trim()];
                            if (dayNum !== undefined) return dayNum;
                          }
                        }
                        
                        return null;
                      })();
                      
                      console.log('[ClasesLiveTabs] 🔍 Día calculado para calendario (desktop):', {
                        titulo: c.titulo,
                        diaSemana: c.diaSemana,
                        dia_semana: c.dia_semana,
                        diasSemana: c.diasSemana,
                        diaParaCalcular
                      });
                      
                      // Validar y normalizar horas
                      const normalizeTime = (timeStr: string | null | undefined, defaultTime: string): string => {
                        if (!timeStr || typeof timeStr !== 'string') return defaultTime;
                        // Asegurar formato HH:MM
                        const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);
                        if (timeMatch) {
                          const hours = parseInt(timeMatch[1], 10);
                          const minutes = parseInt(timeMatch[2], 10);
                          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                          }
                        }
                        console.warn('[ClasesLiveTabs] ⚠️ Hora inválida, usando default:', { received: timeStr, default: defaultTime });
                        return defaultTime;
                      };
                      
                      const startTime = normalizeTime(horaInicio, '10:00');
                      const endTime = normalizeTime(horaFin, '12:00');
                      
                      // Pasar la hora de inicio para que getFullDateForCalendar considere si la hora ya pasó
                      const fullDate = getFullDateForCalendar(fecha, diaParaCalcular, startTime);
                      
                      // Construir fecha/hora completa para el calendario
                      let calendarStart: string | null = null;
                      let calendarEnd: string | null = null;
                      
                      if (fullDate) {
                        const [year, month, day] = fullDate.split('-').map(Number);
                        const [startHour, startMin] = startTime.split(':').map(Number);
                        const [endHour, endMin] = endTime.split(':').map(Number);
                        
                        // Validar que los valores sean números válidos
                        if (!isNaN(year) && !isNaN(month) && !isNaN(day) && 
                            !isNaN(startHour) && !isNaN(startMin) && 
                            !isNaN(endHour) && !isNaN(endMin)) {
                          // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
                          const startDate = new Date(year, month - 1, day, startHour, startMin, 0, 0);
                          const endDate = new Date(year, month - 1, day, endHour, endMin, 0, 0);
                          
                          // Validar que las fechas sean válidas
                          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                            calendarStart = startDate.toISOString();
                            calendarEnd = endDate.toISOString();
                            
                            // Log para depuración
                            console.log('[ClasesLiveTabs] ✅ Fechas construidas:', {
                              titulo: c.titulo,
                              fullDate,
                              startTime,
                              endTime,
                              calendarStart,
                              calendarEnd,
                              diasSemana: c.diasSemana,
                              diaParaCalcular
                            });
                          } else {
                            console.warn('[ClasesLiveTabs] ⚠️ Fechas inválidas:', { startDate, endDate, fullDate, startTime, endTime });
                          }
                        } else {
                          console.warn('[ClasesLiveTabs] ⚠️ Valores numéricos inválidos:', { year, month, day, startHour, startMin, endHour, endMin });
                        }
                      } else {
                        console.warn('[ClasesLiveTabs] ⚠️ No se pudo calcular fullDate:', { fecha, diaParaCalcular, diasSemana: c.diasSemana });
                      }

                      // Calcular cronogramaIndex desde el id de la clase
                      const cronogramaIndex = c.cronogramaIndex !== null && c.cronogramaIndex !== undefined 
                        ? c.cronogramaIndex 
                        : Math.floor((c.id || 0) / 1000);
                      
                      const shareUrl = isClickable && sourceType && sourceId
                        ? buildShareUrl("clase", String(sourceId), { type: sourceType, index: cronogramaIndex })
                        : (sourceType && sourceId
                          ? buildShareUrl("clase", String(sourceId), { type: sourceType })
                          : window.location.href);

                      return (
                        <>
                          {isClickable && sourceType && sourceId && (
                            <button
                              type="button"
                              className="clt-btn-detail"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClassClick(c);
                              }}
                            >
                              <Eye size={18} strokeWidth={2.25} aria-hidden />
                              Ver detalle
                            </button>
                          )}
                          <div className="clt-actions__toolbar">
                            {calendarStart && calendarEnd && (
                              <div className="clt-actions__cal-wrap" onClick={(e) => e.stopPropagation()}>
                                {(() => {
                                  const classIdForMetrics = (c.id !== null && c.id !== undefined) ? c.id : (idx * 1000);
                                  return (
                                    <AddToCalendarWithStats
                                      eventId={c.id || idx}
                                      classId={classIdForMetrics}
                                      academyId={sourceType === 'academy' && sourceId ? Number(sourceId) : undefined}
                                      teacherId={sourceType === 'teacher' && sourceId ? Number(sourceId) : undefined}
                                      roleBaile={userProfile?.rol_baile || null}
                                      zonaTagId={c.ubicacionJson?.zona_tag_id || (userProfile?.zonas?.[0] || null)}
                                      title={titulo}
                                      description={c.descripcion || undefined}
                                      location={ubicacion || undefined}
                                      start={calendarStart}
                                      end={calendarEnd}
                                      showAsIcon={true}
                                      fecha={c.fecha || null}
                                      diaSemana={c.diaSemana ?? c.dia_semana ?? null}
                                      diasSemana={(() => {
                                        if (c.diasSemana && Array.isArray(c.diasSemana)) {
                                          const dayMap: Record<string, number> = {
                                            domingo: 0,
                                            dom: 0,
                                            lunes: 1,
                                            lun: 1,
                                            martes: 2,
                                            mar: 2,
                                            miércoles: 3,
                                            miercoles: 3,
                                            mié: 3,
                                            mie: 3,
                                            jueves: 4,
                                            jue: 4,
                                            viernes: 5,
                                            vie: 5,
                                            sábado: 6,
                                            sabado: 6,
                                            sáb: 6,
                                            sab: 6,
                                          };
                                          const dias = c.diasSemana
                                            .map((dd: string) => dayMap[String(dd).toLowerCase().trim()])
                                            .filter((dd: number | undefined) => dd !== undefined) as number[];
                                          return dias.length > 0 ? dias : null;
                                        }
                                        return null;
                                      })()}
                                    />
                                  );
                                })()}
                              </div>
                            )}
                            <div onClick={(e) => e.stopPropagation()}>
                              <ShareButton
                                url={shareUrl}
                                title={titulo}
                                text={`${titulo}${ubicacion ? ` - ${ubicacion}` : ""}`}
                                className="clt-share-btn"
                                style={{
                                  padding: 0,
                                  minWidth: 44,
                                  minHeight: 44,
                                  width: 44,
                                  height: 44,
                                  borderRadius: 12,
                                }}
                              >
                                <Share2 size={18} strokeWidth={2.25} aria-hidden />
                              </ShareButton>
                            </div>
                            {whatsappNumber && titulo && (
                              <RequireLogin fallback={null}>
                                <a
                                  className="clt-wa-icon"
                                  href={buildClassWhatsAppUrl(whatsappNumber, whatsappMessageTemplate, titulo) || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="WhatsApp"
                                  title="WhatsApp"
                                >
                                  <FaWhatsapp size={20} />
                                </a>
                              </RequireLogin>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>
      </div>
    </div>
  );
});

export default ClasesLiveTabs;
