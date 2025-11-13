import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Clase } from "@/types/classes";
import { groupClassesByWeekday } from "@/utils/classesByWeekday";
import ImageWithFallback from "@/components/ImageWithFallback";

type Props = {
  classes: Clase[];
  title?: string;
  subtitle?: string;
  sourceType?: 'teacher' | 'academy';
  sourceId?: number;
  isClickable?: boolean;
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
  isClickable = false
}: Props) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = React.useState(false);
  console.log("[ClasesLiveTabs] Received classes:", classes);
  const days = React.useMemo(() => {
    const grouped = groupClassesByWeekday(classes || []);
    console.log("[ClasesLiveTabs] Grouped days:", grouped);
    return grouped;
  }, [classes]);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [expandedDays, setExpandedDays] = React.useState<Set<number>>(new Set());
  
  console.log("[ClasesLiveTabs] Days length:", days.length, "Active idx:", activeIdx);

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

  // Inicializar el primer día como expandido cuando hay días disponibles
  React.useEffect(() => {
    if (days.length > 0 && expandedDays.size === 0) {
      setExpandedDays(new Set([days[0].key]));
    }
  }, [days, expandedDays.size]);

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

  const handleClassClick = (clase: Clase, index: number) => {
    if (isClickable && sourceType && sourceId) {
      navigate(`/clase/${sourceType}/${sourceId}?i=${index}`);
    }
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

                  return (
                    <motion.article
                      key={c.id || idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: .25 }}
                      onClick={() => handleClassClick(c, idx)}
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
                          <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, flex: 1 }}>{titulo}</h4>
                          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                            {ritmo && <span style={chipStyle}>🎶 {ritmo}</span>}
                            {nivel && <span style={chipStyle}>🏷️ {nivel}</span>}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", opacity: .95, fontSize: ".9rem" }}>
                          {fecha && <span>📅 {fecha}</span>}
                          {(horaInicio || horaFin) && (
                            <span>🕒 {horaInicio || ""}{horaFin ? ` - ${horaFin}` : ""}</span>
                          )}
                          {ubicacion && <span>📍 {ubicacion}</span>}
                          {typeof costo === "number" && (
                            <span>💰 {new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda }).format(costo)}</span>
                          )}
                        </div>

                        {c.descripcion && (
                          <p style={{ margin: 0, opacity: .9, lineHeight: 1.5, fontSize: ".9rem" }}>
                            {c.descripcion}
                          </p>
                        )}

                        {/* CTA opcionales */}
                        {isClickable && (
                          <div style={{ display: "flex", gap: ".5rem", marginTop: ".25rem", flexWrap: "wrap" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClassClick(c, idx);
                              }}
                              style={{
                                padding: ".5rem .8rem",
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,.2)",
                                background: "linear-gradient(135deg, rgba(30,136,229,.24), rgba(0,188,212,.18))",
                                color: "#fff",
                                fontWeight: 800,
                                cursor: "pointer",
                                fontSize: ".85rem",
                                transition: "all 0.2s ease",
                              }}
                            >
                              Ver detalles
                            </button>
                          </div>
                        )}
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

            return (
              <motion.article
                key={c.id || idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .25 }}
                onClick={() => handleClassClick(c, idx)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
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
                    <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900 }}>{titulo}</h4>
                    <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                      {ritmo && <span style={chipStyle}>🎶 {ritmo}</span>}
                      {nivel && <span style={chipStyle}>🏷️ {nivel}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", opacity: .95 }}>
                    {fecha && <span>📅 {fecha}</span>}
                    {(horaInicio || horaFin) && (
                      <span>🕒 {horaInicio || ""}{horaFin ? ` - ${horaFin}` : ""}</span>
                    )}
                    {ubicacion && <span>📍 {ubicacion}</span>}
                    {typeof costo === "number" && (
                      <span>💰 {new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda }).format(costo)}</span>
                    )}
                  </div>

                  {c.descripcion && (
                    <p style={{ margin: 0, opacity: .9, lineHeight: 1.6 }}>
                      {c.descripcion}
                    </p>
                  )}

                  {/* CTA opcionales */}
                  {isClickable && (
                    <div style={{ display: "flex", gap: ".5rem", marginTop: ".35rem", flexWrap: "wrap" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClassClick(c, idx);
                        }}
                        style={{
                          padding: ".6rem .9rem",
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,.2)",
                          background: "linear-gradient(135deg, rgba(30,136,229,.24), rgba(0,188,212,.18))",
                          color: "#fff",
                          fontWeight: 800,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(30,136,229,.35), rgba(0,188,212,.28))";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(30,136,229,.24), rgba(0,188,212,.18))";
                        }}
                      >
                        Ver detalles
                      </button>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
