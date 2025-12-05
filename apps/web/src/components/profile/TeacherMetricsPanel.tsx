import React from "react";
import { motion } from "framer-motion";
import { useTeacherClassMetrics } from "@/hooks/useTeacherClassMetrics";

type PanelProps = { teacherId: number };

export function TeacherMetricsPanel({ teacherId }: PanelProps) {
  const { global, porClase, loading, error, refetch } = useTeacherClassMetrics(teacherId);
  
  // Refrescar métricas cada vez que se monta el componente y cuando cambian los datos
  React.useEffect(() => {
    if (teacherId) {
      refetch();
    }
  }, [teacherId, refetch]);

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
        .metrics-role-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .metrics-class-card {
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .metrics-class-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .metrics-class-info {
          flex: 1;
          min-width: 0;
        }
        .metrics-class-total {
          padding: 0.5rem 0.75rem;
          background: rgba(240,147,251,0.15);
          border-radius: 8px;
          border: 1px solid rgba(240,147,251,0.3);
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
          .metrics-role-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }
          .metrics-class-card {
            padding: 0.875rem;
          }
          .metrics-class-header {
            flex-direction: column;
            gap: 0.75rem;
          }
          .metrics-class-total {
            width: 100%;
            text-align: center;
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
          .metrics-class-card {
            padding: 0.75rem;
          }
        }
      `}</style>
      <div className="metrics-container">
        {/* Resumen global */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="metrics-section"
        >
          <h3>
            Métricas globales
          </h3>
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
                {global.totalTentativos}
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                background: "rgba(76,175,80,0.12)",
                borderRadius: 12,
                border: "1px solid rgba(76,175,80,0.25)",
              }}
            >
              <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem", color: "#fff" }}>
                Compras (pagado)
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "#4CAF50" }}>
                {global.totalPagados ?? 0}
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
                    {global.porRol.leader}
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
                    {global.porRol.follower}
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
                    {global.porRol.ambos}
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
                    {global.porRol.otros}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>Aún no hay datos de asistencias tentativas.</p>
        )}
      </motion.section>

      {/* Detalle por clase */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="metrics-section"
      >
        <h3>
          Métricas por clase
        </h3>
        {porClase.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>
            No hay clases con registros tentativos todavía.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {porClase.map((cl) => {
              // Formatear fecha si existe
              // cl.fecha puede ser una fecha (YYYY-MM-DD) o un día de la semana (ej: "Lunes")
              let fechaFormateada: string | null = null;
              if (cl.fecha) {
                // Verificar si es una fecha válida (formato YYYY-MM-DD)
                const fechaMatch = String(cl.fecha).match(/^\d{4}-\d{2}-\d{2}$/);
                if (fechaMatch) {
                  try {
                    const fechaDate = new Date(cl.fecha + 'T12:00:00'); // Agregar hora para evitar problemas de timezone
                    if (!isNaN(fechaDate.getTime())) {
                      fechaFormateada = fechaDate.toLocaleDateString("es-MX", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                    }
                  } catch (e) {
                    console.error("[TeacherMetricsPanel] Error formateando fecha:", e);
                  }
                } else {
                  // Si no es una fecha, asumir que es un día de la semana y mostrarlo directamente
                  fechaFormateada = String(cl.fecha);
                }
              }
              
              // Formatear precio si existe
              const precioFormateado = cl.precio !== null && cl.precio !== undefined
                ? new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                    minimumFractionDigits: 0,
                  }).format(cl.precio)
                : null;
              
              return (
              <motion.div
                key={cl.class_id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="metrics-class-card"
              >
                <div className="metrics-class-header">
                  <div className="metrics-class-info">
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem", color: "#fff" }}>
                      {cl.nombre}
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                      {fechaFormateada && (
                        <span style={{ fontSize: "0.875rem", opacity: 0.8, color: "rgba(255,255,255,0.7)" }}>
                          📅 {fechaFormateada}
                        </span>
                      )}
                      {precioFormateado && (
                        <span style={{ fontSize: "0.875rem", opacity: 0.9, color: "#4CAF50", fontWeight: 600 }}>
                          💰 {precioFormateado}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="metrics-class-total">
                    <div style={{ fontSize: "0.75rem", opacity: 0.9, marginBottom: "0.25rem", color: "#fff" }}>
                      Tentativos
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f093fb" }}>
                      {cl.totalTentativos}
                    </div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "0.25rem", color: "#A5D6A7" }}>
                      💳 Compras: {cl.totalPagados ?? 0}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      background: "rgba(30,136,229,0.15)",
                      borderRadius: 6,
                      color: "#1E88E5",
                      fontWeight: 700,
                    }}
                  >
                    L: {cl.porRol.leader}
                  </span>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      background: "rgba(255,209,102,0.15)",
                      borderRadius: 6,
                      color: "#FFD166",
                      fontWeight: 700,
                    }}
                  >
                    F: {cl.porRol.follower}
                  </span>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      background: "rgba(76,175,80,0.15)",
                      borderRadius: 6,
                      color: "#4CAF50",
                      fontWeight: 700,
                    }}
                  >
                    A: {cl.porRol.ambos}
                  </span>
                  {cl.porRol.otros > 0 && (
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.75rem",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      O: {cl.porRol.otros}
                    </span>
                  )}
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

