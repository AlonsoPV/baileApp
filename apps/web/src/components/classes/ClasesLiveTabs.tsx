import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Clase } from "@/types/classes";
import { groupClassesByWeekday } from "@/utils/classesByWeekday";
import ImageWithFallback from "@/components/ImageWithFallback";
import AddToCalendarWithStats from "@/components/AddToCalendarWithStats";
import ShareButton from "@/components/events/ShareButton";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { useTags } from "@/hooks/useTags";
import { useUserProfile } from "@/hooks/useUserProfile";
import { FaWhatsapp } from 'react-icons/fa';

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

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: ".4rem",
  padding: ".35rem .7rem",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  fontWeight: 700,
  fontSize: ".85rem",
};

export default function ClasesLiveTabs({ 
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

  // En móvil: mostrar lista vertical de días con sus clases
  if (isMobile) {
    return (
      <div
        style={{
          padding: "1rem",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
          color: "#fff",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 900, fontSize: "1.25rem", marginBottom: ".5rem" }}>{title}</div>
          {subtitle && <div style={{ opacity: 0.8, fontSize: ".95rem" }}>{subtitle}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {days.map((d) => {
            const isExpanded = expandedDays.has(d.key);
            return (
              <div key={d.key} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Encabezado del día - clickeable para colapsar/expandir */}
                <button
                  onClick={() => toggleDay(d.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: ".8rem 1rem",
                    borderRadius: 14,
                    border: `1px solid ${isExpanded ? "rgba(30,136,229,.5)" : "rgba(30,136,229,.3)"}`,
                    background: isExpanded
                      ? "linear-gradient(135deg, rgba(30,136,229,.25), rgba(0,188,212,.15))"
                      : "linear-gradient(135deg, rgba(30,136,229,.15), rgba(0,188,212,.1))",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    color: "#fff",
                    transition: "all 0.2s ease",
                    width: "100%",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(30,136,229,.3), rgba(0,188,212,.2))";
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLButtonElement;
                    target.style.background = isExpanded
                      ? "linear-gradient(135deg, rgba(30,136,229,.25), rgba(0,188,212,.15))"
                      : "linear-gradient(135deg, rgba(30,136,229,.15), rgba(0,188,212,.1))";
                  }}
                >
                  <span>🗓️ {d.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                    <span style={{ ...chipStyle, fontSize: ".75rem" }}>{d.items.length} {d.items.length === 1 ? 'clase' : 'clases'}</span>
                    <span
                      style={{
                        fontSize: "1.2rem",
                        transition: "transform 0.3s ease",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        display: "inline-block",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </button>

                {/* Clases del día - colapsable */}
                <motion.div
                  initial={false}
                  animate={{
                    height: isExpanded ? "auto" : 0,
                    opacity: isExpanded ? 1 : 0,
                    marginBottom: isExpanded ? "0" : 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    paddingLeft: ".5rem",
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

                  // Crear clave única combinando día, índice y ID de clase
                  const uniqueKey = `day-${d.key}-class-${c.id || `idx-${idx}`}-${idx}`;
                  
                  return (
                    <motion.article
                      key={uniqueKey}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: .25 }}
                      onClick={() => handleClassClick(c)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: ".75rem",
                        padding: "1rem",
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.06)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        cursor: isClickable ? "pointer" : "default",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Cover - solo si existe */}
                      {coverUrl && (
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "16/9",
                            borderRadius: 12,
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(0,0,0,.2)",
                          }}
                        >
                          <ImageWithFallback
                            src={coverUrl}
                            alt={titulo}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: ".75rem", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flex: 1, flexWrap: "wrap" }}>
                            <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900 }}>{titulo}</h4>
                            {c.fechaModo === 'por_agendar' ? (
                              <span style={{ 
                                fontSize: "1rem", 
                                opacity: 1, 
                                fontWeight: 800,
                                color: "#fff",
                                padding: ".3rem .6rem",
                                borderRadius: 8,
                                background: "rgba(251, 191, 36, 0.2)",
                                border: "1px solid rgba(251, 191, 36, 0.4)"
                              }}>
                                📅 Por agendar con academia
                              </span>
                            ) : formatDateShort(fecha, c.dia_semana || c.diaSemana) ? (
                              <span style={{ 
                                fontSize: "1rem", 
                                opacity: 1, 
                                fontWeight: 800,
                                color: "#fff",
                                padding: ".3rem .6rem",
                                borderRadius: 8,
                                background: "rgba(30,136,229,0.2)",
                                border: "1px solid rgba(30,136,229,0.4)"
                              }}>
                                📅 {formatDateShort(fecha, c.dia_semana || c.diaSemana)}
                              </span>
                            ) : null}
                          </div>
                          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                            {nivel && <span style={chipStyle}>🏷️ {nivel}</span>}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", opacity: .95, fontSize: ".9rem" }}>
                          {c.fechaModo === 'por_agendar' ? (
                            // Si es por agendar, mostrar duración si está disponible
                            c.duracionHoras ? (
                              <span>⏱️ {c.duracionHoras} {c.duracionHoras === 1 ? 'hora' : 'horas'}</span>
                            ) : null
                          ) : (
                            // Si no es por agendar, mostrar hora según el modo de horario
                            <>
                              {c.horarioModo === 'duracion' && c.duracionHoras ? (
                                <span>⏱️ {c.duracionHoras} {c.duracionHoras === 1 ? 'hora' : 'horas'}</span>
                              ) : (horaInicio || horaFin) ? (
                                <span>🕒 {horaInicio || ""}{horaFin ? ` - ${horaFin}` : ""}</span>
                              ) : null}
                            </>
                          )}
                          {ubicacion && <span>📍 {ubicacion}</span>}
                          {typeof costo === "number" && costo === 0 && (
                            <span>💰 Gratis</span>
                          )}
                          {typeof costo === "number" && costo > 0 && (
                            <span>💰 {new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda }).format(costo)}</span>
                          )}
                        </div>

                        {c.descripcion && (
                          <p style={{ margin: 0, opacity: .9, lineHeight: 1.5, fontSize: ".9rem" }}>
                            {c.descripcion}
                          </p>
                        )}

                        {/* Botones de compartir, calendario y ver detalle */}
                        <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem", flexWrap: "wrap", alignItems: "center" }}>
                          {(() => {
                            // Si la clase es "por agendar", no mostrar botón de calendario
                            if (c.fechaModo === 'por_agendar') {
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
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <ShareButton
                                      url={shareUrl}
                                      title={titulo}
                                      text={`${titulo}${ubicacion ? ` - ${ubicacion}` : ''}`}
                                      style={{ 
                                        padding: ".5rem .8rem",
                                        borderRadius: 999,
                                        border: "1px solid rgba(255,255,255,.2)",
                                        background: "rgba(255,255,255,0.08)",
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: ".85rem",
                                      }}
                                    >
                                      📤 Compartir
                                    </ShareButton>
                                  </div>
                                  {isClickable && sourceType && sourceId && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClassClick(c);
                                      }}
                                      style={{
                                        padding: ".6rem 1rem",
                                        borderRadius: 999,
                                        border: "1px solid rgba(30,136,229,.5)",
                                        background: "linear-gradient(135deg, rgba(30,136,229,.35), rgba(0,188,212,.25))",
                                        color: "#fff",
                                        fontWeight: 800,
                                        fontSize: ".9rem",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        boxShadow: "0 2px 8px rgba(30,136,229,0.3)",
                                      }}
                                      onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(30,136,229,.5), rgba(0,188,212,.4))";
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(30,136,229,0.4)";
                                        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                                      }}
                                      onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(30,136,229,.35), rgba(0,188,212,.25))";
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(30,136,229,0.3)";
                                        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                                      }}
                                    >
                                      👁️ Ver detalle
                                    </button>
                                  )}
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
                                {calendarStart && calendarEnd && (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    {(() => {
                                      // Generar classId único basado en el índice (similar a useLiveClasses)
                                      // Si la clase tiene id, usarlo; si no, generar uno basado en el índice
                                      // Usar ?? en lugar de || para permitir classId = 0
                                      const classIdForMetrics = (c.id !== null && c.id !== undefined) ? c.id : (idx * 1000);
                                      console.log("[ClasesLiveTabs] 🔍 DEBUG - Agregando a calendario:", {
                                        idx,
                                        classId: c.id,
                                        classIdForMetrics,
                                        titulo,
                                        sourceType,
                                        sourceId,
                                        academyId: sourceType === 'academy' && sourceId ? Number(sourceId) : undefined,
                                        teacherId: sourceType === 'teacher' && sourceId ? Number(sourceId) : undefined,
                                        roleBaile: userProfile?.rol_baile || null,
                                      });
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
                                            // Si tiene diasSemana como array de strings, convertir a números
                                            if (c.diasSemana && Array.isArray(c.diasSemana)) {
                                              const dayMap: Record<string, number> = {
                                                'domingo': 0, 'dom': 0,
                                                'lunes': 1, 'lun': 1,
                                                'martes': 2, 'mar': 2,
                                                'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
                                                'jueves': 4, 'jue': 4,
                                                'viernes': 5, 'vie': 5,
                                                'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
                                              };
                                              const dias = c.diasSemana
                                                .map((d: string) => dayMap[String(d).toLowerCase().trim()])
                                                .filter((d: number | undefined) => d !== undefined) as number[];
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
                                    text={`${titulo}${ubicacion ? ` - ${ubicacion}` : ''}`}
                                    style={{ 
                                      padding: ".5rem .8rem",
                                      borderRadius: 999,
                                      border: "1px solid rgba(255,255,255,.2)",
                                      background: "rgba(255,255,255,0.08)",
                                      color: "#fff",
                                      fontWeight: 700,
                                      fontSize: ".85rem",
                                    }}
                                  >
                                    📤 Compartir
                                  </ShareButton>
                                </div>
                                {isClickable && sourceType && sourceId && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleClassClick(c);
                                    }}
                                    style={{
                                      padding: ".6rem 1rem",
                                      borderRadius: 999,
                                      border: "1px solid rgba(30,136,229,.5)",
                                      background: "linear-gradient(135deg, rgba(30,136,229,.35), rgba(0,188,212,.25))",
                                      color: "#fff",
                                      fontWeight: 800,
                                      fontSize: ".9rem",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                      boxShadow: "0 2px 8px rgba(30,136,229,0.3)",
                                    }}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(30,136,229,.5), rgba(0,188,212,.4))";
                                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(30,136,229,0.4)";
                                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(30,136,229,.35), rgba(0,188,212,.25))";
                                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(30,136,229,0.3)";
                                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                                    }}
                                  >
                                    👁️ Ver detalle
                                  </button>
                                )}
                              </>
                            );
                          })()}

                          {/* Botón WhatsApp */}
                          {whatsappNumber && titulo && (
                            <a
                              href={buildClassWhatsAppUrl(whatsappNumber, whatsappMessageTemplate, titulo) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 1rem',
                                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                                color: '#fff',
                                borderRadius: '999px',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';
                              }}
                            >
                              <FaWhatsapp size={18} />
                              <span>WhatsApp</span>
                            </a>
                          )}
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        gap: "1.25rem",
        alignItems: "start",
        padding: "1.25rem",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
        color: "#fff",
      }}
    >
      <div style={{ display: "contents" }}>
        {/* Sidebar / Tabs verticales */}
        <nav
          aria-label="Días de la semana con clases"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: ".5rem",
            padding: ".25rem",
          }}
        >
          <div style={{ marginBottom: ".5rem" }}>
            <div style={{ fontWeight: 900, fontSize: "1.25rem" }}>{title}</div>
            {subtitle && <div style={{ opacity: 0.8, fontSize: ".95rem" }}>{subtitle}</div>}
          </div>

          {days.map((d, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={d.key}
                onClick={() => setActiveIdx(i)}
                aria-pressed={isActive}
                style={{
                  textAlign: "left",
                  width: "100%",
                  padding: ".8rem 1rem",
                  borderRadius: 14,
                  border: `1px solid ${isActive ? "rgba(30,136,229,.5)" : "rgba(255,255,255,.12)"}`,
                  background: isActive
                    ? "linear-gradient(135deg, rgba(30,136,229,.22), rgba(0,188,212,.16))"
                    : "rgba(255,255,255,0.04)",
                  cursor: "pointer",
                  color: "#fff",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                  }
                }}
              >
                <span>🗓️ {d.label}</span>
                <span style={{ ...chipStyle, fontSize: ".75rem" }}>{d.items.length}</span>
              </button>
            );
          })}
        </nav>

        {/* Panel de contenido */}
        <section
          role="tabpanel"
          aria-label={`Clases del día ${days[activeIdx]?.label}`}
          style={{ display: "grid", gap: "1rem" }}
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

            // Crear clave única combinando día activo, índice y ID de clase
            const uniqueKey = `desktop-day-${activeIdx}-class-${c.id || `idx-${idx}`}-${idx}`;

            return (
              <motion.article
                key={uniqueKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .25 }}
                onClick={() => handleClassClick(c)}
                style={{
                  display: "grid",
                  /* gridTemplateColumns: "140px 1fr", */
                  gap: "1rem",
                  padding: "1rem",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
                  cursor: isClickable ? "pointer" : "default",
                  transition: "all 0.2s ease",
                }}
                whileHover={isClickable ? { scale: 1.02, boxShadow: "0 12px 32px rgba(0,0,0,0.35)" } : {}}
              >
                {/* Cover */}
               {/*  <div
                  style={{
                    width: "100%",
                    aspectRatio: "4/3",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,.2)",
                  }}
                >
                  {coverUrl && (
                    <ImageWithFallback
                      src={coverUrl}
                      alt={titulo}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )}
                </div> */}

                {/* Info */}
                <div style={{ display: "grid", gap: ".5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: ".75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flex: 1, flexWrap: "wrap" }}>
                      <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900 }}>{titulo}</h4>
                      {c.fechaModo === 'por_agendar' ? (
                        <span style={{ 
                          fontSize: "1.05rem", 
                          opacity: 1, 
                          fontWeight: 800,
                          color: "#fff",
                          padding: ".35rem .7rem",
                          borderRadius: 8,
                          background: "rgba(251, 191, 36, 0.2)",
                          border: "1px solid rgba(251, 191, 36, 0.4)"
                        }}>
                          📅 Por agendar con academia
                        </span>
                      ) : formatDateShort(fecha, c.dia_semana || c.diaSemana) ? (
                        <span style={{ 
                          fontSize: "1.05rem", 
                          opacity: 1, 
                          fontWeight: 800,
                          color: "#fff",
                          padding: ".35rem .7rem",
                          borderRadius: 8,
                          background: "rgba(30,136,229,0.2)",
                          border: "1px solid rgba(30,136,229,0.4)"
                        }}>
                          📅 {formatDateShort(fecha, c.dia_semana || c.diaSemana)}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                      {nivel && <span style={chipStyle}>🏷️ {nivel}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", opacity: .95 }}>
                    {c.fechaModo === 'por_agendar' ? (
                      // Si es por agendar, mostrar duración si está disponible
                      c.duracionHoras ? (
                        <span>⏱️ {c.duracionHoras} {c.duracionHoras === 1 ? 'hora' : 'horas'}</span>
                      ) : null
                    ) : (
                      // Si no es por agendar, mostrar hora según el modo de horario
                      <>
                        {c.horarioModo === 'duracion' && c.duracionHoras ? (
                          <span>⏱️ {c.duracionHoras} {c.duracionHoras === 1 ? 'hora' : 'horas'}</span>
                        ) : (horaInicio || horaFin) ? (
                          <span>🕒 {horaInicio || ""}{horaFin ? ` - ${horaFin}` : ""}</span>
                        ) : null}
                      </>
                    )}
                    {ubicacion && <span>📍 {ubicacion}</span>}
                    {typeof costo === "number" && costo === 0 && (
                      <span>💰 Gratis</span>
                    )}
                    {typeof costo === "number" && costo > 0 && (
                      <span>💰 {new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda }).format(costo)}</span>
                    )}
                  </div>

                  {c.descripcion && (
                    <p style={{ margin: 0, opacity: .9, lineHeight: 1.6 }}>
                      {c.descripcion}
                    </p>
                  )}

                  {/* Botones de compartir, calendario y ver detalle */}
                  <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem", flexWrap: "wrap", alignItems: "center" }}>
                    {(() => {
                      // Si la clase es "por agendar", no mostrar botón de calendario
                      if (c.fechaModo === 'por_agendar') {
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
                            <div onClick={(e) => e.stopPropagation()}>
                              <ShareButton
                                url={shareUrl}
                                title={titulo}
                                text={`${titulo}${ubicacion ? ` - ${ubicacion}` : ''}`}
                                style={{ 
                                  padding: ".6rem .9rem",
                                  borderRadius: 999,
                                  border: "1px solid rgba(255,255,255,.2)",
                                  background: "rgba(255,255,255,0.08)",
                                  color: "#fff",
                                  fontWeight: 700,
                                  fontSize: ".9rem",
                                }}
                              >
                                📤 Compartir
                              </ShareButton>
                            </div>
                            {isClickable && sourceType && sourceId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClassClick(c);
                                }}
                                style={{
                                  padding: ".7rem 1.1rem",
                                  borderRadius: 999,
                                  border: "1px solid rgba(30,136,229,.5)",
                                  background: "linear-gradient(135deg, rgba(30,136,229,.35), rgba(0,188,212,.25))",
                                  color: "#fff",
                                  fontWeight: 800,
                                  fontSize: ".95rem",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  boxShadow: "0 2px 8px rgba(30,136,229,0.3)",
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(30,136,229,.5), rgba(0,188,212,.4))";
                                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(30,136,229,0.4)";
                                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(30,136,229,.35), rgba(0,188,212,.25))";
                                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(30,136,229,0.3)";
                                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                                }}
                              >
                                👁️ Ver detalle
                              </button>
                            )}

                            {/* Botón WhatsApp (desktop - primera ubicación) */}
                            {whatsappNumber && titulo && (
                              <a
                                href={buildClassWhatsAppUrl(whatsappNumber, whatsappMessageTemplate, titulo) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem',
                                  padding: '0.7rem 1.1rem',
                                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                                  color: '#fff',
                                  borderRadius: '999px',
                                  textDecoration: 'none',
                                  fontWeight: 700,
                                  fontSize: '0.95rem',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = '';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';
                                }}
                              >
                                <FaWhatsapp size={18} />
                                <span>WhatsApp</span>
                              </a>
                            )}
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
                        ? `${window.location.origin}/clase/${sourceType}/${sourceId}?i=${cronogramaIndex}`
                        : (sourceType && sourceId 
                          ? `${window.location.origin}/clase/${sourceType}/${sourceId}`
                          : window.location.href);

                      return (
                        <>
                          {calendarStart && calendarEnd && (
                            <div onClick={(e) => e.stopPropagation()}>
                              {(() => {
                                // Generar classId único basado en el índice (similar a useLiveClasses)
                                // Si la clase tiene id, usarlo; si no, generar uno basado en el índice
                                // Usar ?? en lugar de || para permitir classId = 0
                                const classIdForMetrics = (c.id !== null && c.id !== undefined) ? c.id : (idx * 1000);
                                console.log("[ClasesLiveTabs] 🔍 DEBUG - Agregando a calendario (desktop):", {
                                  idx,
                                  classId: c.id,
                                  classIdForMetrics,
                                  titulo,
                                  sourceType,
                                  sourceId,
                                  academyId: sourceType === 'academy' && sourceId ? Number(sourceId) : undefined,
                                  roleBaile: userProfile?.rol_baile || null,
                                });
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
                                  />
                                );
                              })()}
                            </div>
                          )}
                          <div onClick={(e) => e.stopPropagation()}>
                            <ShareButton
                              url={shareUrl}
                              title={titulo}
                              text={`${titulo}${ubicacion ? ` - ${ubicacion}` : ''}`}
                              style={{ 
                                padding: ".6rem .9rem",
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,.2)",
                                background: "rgba(255,255,255,0.08)",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: ".9rem",
                              }}
                            >
                              📤 Compartir
                            </ShareButton>
                          </div>
                          {isClickable && sourceType && sourceId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClassClick(c);
                              }}
                              style={{
                                padding: ".7rem 1.1rem",
                                borderRadius: 999,
                                border: "1px solid rgba(30,136,229,.5)",
                                background: "linear-gradient(135deg, rgba(30,136,229,.35), rgba(0,188,212,.25))",
                                color: "#fff",
                                fontWeight: 800,
                                fontSize: ".95rem",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: "0 2px 8px rgba(30,136,229,0.3)",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(30,136,229,.5), rgba(0,188,212,.4))";
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(30,136,229,0.4)";
                                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(30,136,229,.35), rgba(0,188,212,.25))";
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(30,136,229,0.3)";
                                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                              }}
                            >
                              👁️ Ver detalle
                            </button>
                          )}

                          {/* Botón WhatsApp (desktop - segunda ubicación) */}
                          {whatsappNumber && titulo && (
                            <a
                              href={buildClassWhatsAppUrl(whatsappNumber, whatsappMessageTemplate, titulo) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.7rem 1.1rem',
                                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                                color: '#fff',
                                borderRadius: '999px',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';
                              }}
                            >
                              <FaWhatsapp size={18} />
                              <span>WhatsApp</span>
                            </a>
                          )}
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
}
