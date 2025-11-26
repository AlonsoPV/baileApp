import React from "react";
import { motion } from "framer-motion";
import { useAcademyMetrics, type DateFilter, type MetricsFilters } from "@/hooks/useAcademyMetrics";

type PanelProps = { academyId: number };

export function AcademyMetricsPanel({ academyId }: PanelProps) {
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");
  const [customFrom, setCustomFrom] = React.useState<string>("");
  const [customTo, setCustomTo] = React.useState<string>("");
  
  const filters: MetricsFilters = {
    dateFilter,
    from: dateFilter === "custom" ? customFrom : undefined,
    to: dateFilter === "custom" ? customTo : undefined,
  };
  
  const { global, perClass, byClass, loading, error, refetch } = useAcademyMetrics(academyId, filters);
  
  // Refrescar métricas cada vez que se monta el componente y cuando cambian los datos
  React.useEffect(() => {
    if (academyId) {
      refetch();
    }
  }, [academyId, refetch, filters]);
  
  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#fff" }}>
        <p>Cargando métricas...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#ff6b6b" }}>
        <p>Hubo un problema al cargar métricas.</p>
        <p style={{ fontSize: "0.875rem", opacity: 0.8, marginTop: "0.5rem" }}>
          {error?.message || "Error desconocido"}
        </p>
      </div>
    );
  }
  
  return (
    <>
      <style>{`
        .metrics-container {
          display: grid;
          gap: 1.5rem;
          padding: 1.5rem 0;
        }
        .metrics-section {
          background: linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0,0,0,.3);
        }
        .metrics-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
        }
        .metrics-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .metrics-filter-button {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .metrics-filter-button:hover {
          background: rgba(255,255,255,0.1);
        }
        .metrics-filter-button.active {
          background: linear-gradient(135deg, rgba(240,147,251,0.3), rgba(245,87,108,0.3));
          border-color: rgba(240,147,251,0.5);
        }
        .metrics-custom-dates {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .metrics-custom-dates input {
          padding: 0.5rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1);
          color: #fff;
          font-size: 0.875rem;
        }
        .metrics-role-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .metrics-zone-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .metrics-zone-item {
          padding: 0.75rem;
          background: rgba(30,136,229,0.1);
          border-radius: 10;
          border: 1px solid rgba(30,136,229,0.2);
        }
        .metrics-reservation-item {
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 0.75rem;
        }
        .metrics-reservation-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .metrics-reservation-info {
          flex: 1;
          min-width: 0;
        }
        .metrics-reservation-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }
        @media (max-width: 768px) {
          .metrics-container {
            gap: 1rem;
            padding: 1rem 0;
          }
          .metrics-section {
            padding: 1rem;
            border-radius: 16px;
          }
          .metrics-section h3 {
            font-size: 1.25rem;
            margin-bottom: 0.75rem;
          }
          .metrics-filters {
            gap: 0.4rem;
          }
          .metrics-filter-button {
            padding: 0.4rem 0.75rem;
            font-size: 0.8rem;
          }
          .metrics-role-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }
          .metrics-zone-grid {
            grid-template-columns: 1fr;
          }
          .metrics-reservation-item {
            padding: 0.875rem;
          }
          .metrics-reservation-header {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
        @media (max-width: 480px) {
          .metrics-container {
            gap: 0.75rem;
            padding: 0.75rem 0;
          }
          .metrics-section {
            padding: 0.875rem;
            border-radius: 12px;
          }
          .metrics-section h3 {
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
          }
          .metrics-role-grid {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          .metrics-reservation-item {
            padding: 0.75rem;
          }
        }
      `}</style>
      <div className="metrics-container">
        {/* Filtros de fecha */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="metrics-section"
        >
          <h3>📅 Filtros de fecha</h3>
          <div className="metrics-filters">
            {(['today', 'this_week', 'this_month', 'all'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                className={`metrics-filter-button ${dateFilter === filter ? 'active' : ''}`}
                onClick={() => setDateFilter(filter)}
              >
                {filter === 'today' && '📅 Hoy'}
                {filter === 'this_week' && '📆 Esta semana'}
                {filter === 'this_month' && '📅 Este mes'}
                {filter === 'all' && '🌐 Todas'}
              </button>
            ))}
            <button
              className={`metrics-filter-button ${dateFilter === 'custom' ? 'active' : ''}`}
              onClick={() => setDateFilter('custom')}
            >
              🗓️ Personalizado
            </button>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="metrics-custom-dates" style={{ marginTop: '1rem' }}>
              <label style={{ color: '#fff', fontSize: '0.875rem' }}>Desde:</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <label style={{ color: '#fff', fontSize: '0.875rem' }}>Hasta:</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}
        </motion.section>

        {/* Resumen global */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="metrics-section"
        >
          <h3>📊 Métricas globales</h3>
          {global ? (
            <div style={{ display: "grid", gap: "1.5rem" }}>
              <div
                style={{
                  padding: "1rem",
                  background: "rgba(240,147,251,0.1)",
                  borderRadius: 12,
                  border: "1px solid rgba(240,147,251,0.2)",
                }}
              >
                <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem", color: "#fff" }}>
                  Total tentativos
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#f093fb" }}>
                  {global.totalTentative}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.75rem", color: "#fff" }}>
                  Por rol
                </div>
                <div className="metrics-role-grid">
                  <div
                    style={{
                      padding: "0.75rem",
                      background: "rgba(30,136,229,0.1)",
                      borderRadius: 10,
                      border: "1px solid rgba(30,136,229,0.2)",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.25rem", color: "#fff" }}>
                      Leader
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1E88E5" }}>
                      {global.byRole.leader || 0}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      background: "rgba(255,209,102,0.1)",
                      borderRadius: 10,
                      border: "1px solid rgba(255,209,102,0.2)",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.25rem", color: "#fff" }}>
                      Follower
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#FFD166" }}>
                      {global.byRole.follower || 0}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      background: "rgba(76,175,80,0.1)",
                      borderRadius: 10,
                      border: "1px solid rgba(76,175,80,0.2)",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.25rem", color: "#fff" }}>
                      Ambos
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#4CAF50" }}>
                      {global.byRole.ambos || 0}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.25rem", color: "#fff" }}>
                      Otros
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>
                      {global.byRole.otro || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas por zona */}
              {Object.keys(global.byZone).length > 0 && (
                <div>
                  <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.75rem", color: "#fff" }}>
                    Por zona
                  </div>
                  <div className="metrics-zone-grid">
                    {Object.entries(global.byZone)
                      .sort(([, a], [, b]) => b - a)
                      .map(([zona, count]) => (
                        <div key={zona} className="metrics-zone-item">
                          <div style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.25rem", color: "#fff" }}>
                            {zona}
                          </div>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1E88E5" }}>
                            {count}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.7)" }}>Aún no hay datos de asistencias tentativas.</p>
          )}
        </motion.section>

        {/* Métricas por clase */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="metrics-section"
        >
          <h3>📚 Métricas por clase</h3>
          {byClass.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.7)" }}>
              No hay clases con reservas tentativas en el período seleccionado.
            </p>
          ) : (
            <div>
              {byClass.map((classSummary) => {
                // Formatear fecha de la clase
                let fechaFormateada: string | null = null;
                if (classSummary.classDate) {
                  const fechaMatch = String(classSummary.classDate).match(/^\d{4}-\d{2}-\d{2}$/);
                  if (fechaMatch) {
                    try {
                      const fechaDate = new Date(classSummary.classDate + 'T12:00:00');
                      if (!isNaN(fechaDate.getTime())) {
                        fechaFormateada = fechaDate.toLocaleDateString("es-MX", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        });
                      }
                    } catch (e) {
                      console.error("[AcademyMetricsPanel] Error formateando fecha:", e);
                    }
                  } else {
                    fechaFormateada = String(classSummary.classDate);
                  }
                }
                
                return (
                  <motion.div
                    key={classSummary.classId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="metrics-class-card"
                    style={{ marginBottom: '1.5rem' }}
                  >
                    <div className="metrics-class-header">
                      <div className="metrics-class-info">
                        <div style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "0.75rem", color: "#fff" }}>
                          {classSummary.className}
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.75rem" }}>
                          {fechaFormateada && (
                            <span style={{ fontSize: "0.875rem", opacity: 0.8, color: "rgba(255,255,255,0.7)" }}>
                              📅 {fechaFormateada}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                              background: "rgba(30,136,229,0.15)",
                              borderRadius: 6,
                              color: "#1E88E5",
                              fontWeight: 700,
                              border: "1px solid rgba(30,136,229,0.3)",
                            }}
                          >
                            👨‍💼 Leader: {classSummary.byRole.leader || 0}
                          </span>
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                              background: "rgba(255,209,102,0.15)",
                              borderRadius: 6,
                              color: "#FFD166",
                              fontWeight: 700,
                              border: "1px solid rgba(255,209,102,0.3)",
                            }}
                          >
                            👩‍💼 Follower: {classSummary.byRole.follower || 0}
                          </span>
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                              background: "rgba(76,175,80,0.15)",
                              borderRadius: 6,
                              color: "#4CAF50",
                              fontWeight: 700,
                              border: "1px solid rgba(76,175,80,0.3)",
                            }}
                          >
                            👥 Ambos: {classSummary.byRole.ambos || 0}
                          </span>
                          {(classSummary.byRole.otro || 0) > 0 && (
                            <span
                              style={{
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.75rem",
                                background: "rgba(255,255,255,0.1)",
                                borderRadius: 6,
                                color: "#fff",
                                fontWeight: 700,
                                border: "1px solid rgba(255,255,255,0.2)",
                              }}
                            >
                              ❓ Otros: {classSummary.byRole.otro || 0}
                            </span>
                          )}
                        </div>
                        
                        {/* Lista de usuarios por clase */}
                        <div style={{ marginTop: "1rem" }}>
                          <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem", color: "#fff", fontWeight: 600 }}>
                            👥 Asistentes ({classSummary.totalAsistentes}):
                          </div>
                          <div style={{ display: "grid", gap: "0.5rem" }}>
                            {classSummary.reservations.map((reservation) => {
                              // Formatear fecha de registro
                              const fechaRegistro = new Date(reservation.createdAt).toLocaleDateString("es-MX", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                              
                              // Color según rol
                              const roleColors: Record<string, { bg: string; border: string; text: string }> = {
                                leader: { bg: "rgba(30,136,229,0.15)", border: "rgba(30,136,229,0.3)", text: "#1E88E5" },
                                follower: { bg: "rgba(255,209,102,0.15)", border: "rgba(255,209,102,0.3)", text: "#FFD166" },
                                ambos: { bg: "rgba(76,175,80,0.15)", border: "rgba(76,175,80,0.3)", text: "#4CAF50" },
                                otro: { bg: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.2)", text: "#fff" },
                              };
                              const roleColor = roleColors[reservation.roleType || 'otro'] || roleColors.otro;
                              
                              return (
                                <div
                                  key={reservation.id}
                                  style={{
                                    padding: "0.75rem",
                                    background: "rgba(255,255,255,0.03)",
                                    borderRadius: 8,
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "0.5rem",
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", marginBottom: "0.25rem" }}>
                                      👤 {reservation.userName}
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                      <span
                                        style={{
                                          padding: "0.2rem 0.4rem",
                                          fontSize: "0.7rem",
                                          background: roleColor.bg,
                                          borderRadius: 4,
                                          color: roleColor.text,
                                          fontWeight: 600,
                                          border: `1px solid ${roleColor.border}`,
                                        }}
                                      >
                                        {reservation.roleType === 'leader' ? '👨‍💼 Leader' :
                                         reservation.roleType === 'follower' ? '👩‍💼 Follower' :
                                         reservation.roleType === 'ambos' ? '👥 Ambos' : '❓ Otro'}
                                      </span>
                                      {reservation.zone && (
                                        <span
                                          style={{
                                            padding: "0.2rem 0.4rem",
                                            fontSize: "0.7rem",
                                            background: "rgba(30,136,229,0.15)",
                                            borderRadius: 4,
                                            color: "#1E88E5",
                                            fontWeight: 600,
                                            border: "1px solid rgba(30,136,229,0.3)",
                                          }}
                                        >
                                          📍 {reservation.zone}
                                        </span>
                                      )}
                                      <span
                                        style={{
                                          padding: "0.2rem 0.4rem",
                                          fontSize: "0.7rem",
                                          background: "rgba(255,255,255,0.08)",
                                          borderRadius: 4,
                                          color: "rgba(255,255,255,0.6)",
                                          fontWeight: 500,
                                        }}
                                      >
                                        🕐 {fechaRegistro}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="metrics-class-total">
                        <div style={{ fontSize: "0.75rem", opacity: 0.9, marginBottom: "0.25rem", color: "#fff" }}>
                          Total
                        </div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f093fb" }}>
                          {classSummary.totalAsistentes}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Lista detallada de reservas (opcional, para referencia) */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="metrics-section"
        >
          <h3>📋 Todas las reservas (detalle)</h3>
          {perClass.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.7)" }}>
              No hay reservas tentativas en el período seleccionado.
            </p>
          ) : (
            <div>
              {perClass.map((reservation) => {
                // Formatear fecha de la clase
                let fechaFormateada: string | null = null;
                if (reservation.classDate) {
                  const fechaMatch = String(reservation.classDate).match(/^\d{4}-\d{2}-\d{2}$/);
                  if (fechaMatch) {
                    try {
                      const fechaDate = new Date(reservation.classDate + 'T12:00:00');
                      if (!isNaN(fechaDate.getTime())) {
                        fechaFormateada = fechaDate.toLocaleDateString("es-MX", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        });
                      }
                    } catch (e) {
                      console.error("[AcademyMetricsPanel] Error formateando fecha:", e);
                    }
                  } else {
                    fechaFormateada = String(reservation.classDate);
                  }
                }
                
                // Formatear fecha de registro
                const fechaRegistro = new Date(reservation.createdAt).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                
                // Color según rol
                const roleColors: Record<string, { bg: string; border: string; text: string }> = {
                  leader: { bg: "rgba(30,136,229,0.15)", border: "rgba(30,136,229,0.3)", text: "#1E88E5" },
                  follower: { bg: "rgba(255,209,102,0.15)", border: "rgba(255,209,102,0.3)", text: "#FFD166" },
                  ambos: { bg: "rgba(76,175,80,0.15)", border: "rgba(76,175,80,0.3)", text: "#4CAF50" },
                  otro: { bg: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.2)", text: "#fff" },
                };
                const roleColor = roleColors[reservation.roleType || 'otro'] || roleColors.otro;
                
                return (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="metrics-reservation-item"
                  >
                    <div className="metrics-reservation-header">
                      <div className="metrics-reservation-info">
                        <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem", color: "#fff" }}>
                          {reservation.className}
                        </div>
                        <div style={{ fontSize: "0.875rem", opacity: 0.8, color: "rgba(255,255,255,0.7)", marginBottom: "0.25rem" }}>
                          👤 {reservation.userName}
                        </div>
                        <div className="metrics-reservation-badges">
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                              background: roleColor.bg,
                              borderRadius: 6,
                              color: roleColor.text,
                              fontWeight: 700,
                              border: `1px solid ${roleColor.border}`,
                            }}
                          >
                            {reservation.roleType === 'leader' ? '👨‍💼 Leader' :
                             reservation.roleType === 'follower' ? '👩‍💼 Follower' :
                             reservation.roleType === 'ambos' ? '👥 Ambos' : '❓ Otro'}
                          </span>
                          {reservation.zone && (
                            <span
                              style={{
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.75rem",
                                background: "rgba(30,136,229,0.15)",
                                borderRadius: 6,
                                color: "#1E88E5",
                                fontWeight: 700,
                                border: "1px solid rgba(30,136,229,0.3)",
                              }}
                            >
                              📍 {reservation.zone}
                            </span>
                          )}
                          {fechaFormateada && (
                            <span
                              style={{
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.75rem",
                                background: "rgba(240,147,251,0.15)",
                                borderRadius: 6,
                                color: "#f093fb",
                                fontWeight: 700,
                                border: "1px solid rgba(240,147,251,0.3)",
                              }}
                            >
                              📅 {fechaFormateada}
                            </span>
                          )}
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                              background: "rgba(255,255,255,0.1)",
                              borderRadius: 6,
                              color: "rgba(255,255,255,0.7)",
                              fontWeight: 600,
                            }}
                          >
                            🕐 {fechaRegistro}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>
    </>
  );
}
