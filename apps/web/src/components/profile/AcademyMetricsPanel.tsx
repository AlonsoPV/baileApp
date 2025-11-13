import React from "react";
import { motion } from "framer-motion";
import { useAcademyClassMetrics } from "@/hooks/useAcademyClassMetrics";

type PanelProps = { academyId: number };

export function AcademyMetricsPanel({ academyId }: PanelProps) {
  const { global, porClase, loading, error, refetch } = useAcademyClassMetrics(academyId);
  
  console.log("[AcademyMetricsPanel] 🔍 academyId recibido:", academyId);
  console.log("[AcademyMetricsPanel] 📊 Métricas:", { global, porClase, loading, error });
  
  // Refrescar métricas cada vez que se monta el componente
  React.useEffect(() => {
    if (academyId) {
      console.log("[AcademyMetricsPanel] 🔄 Refrescando métricas para academyId:", academyId);
      refetch();
    }
  }, [academyId, refetch]);

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
    <div style={{ display: "grid", gap: "1.5rem", padding: "1.5rem 0" }}>
      {/* Resumen global */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.03))",
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 20,
          padding: "1.5rem",
          boxShadow: "0 8px 32px rgba(0,0,0,.3)",
        }}
      >
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
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

            <div>
              <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.75rem", color: "#fff" }}>
                Por rol
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
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
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.03))",
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 20,
          padding: "1.5rem",
          boxShadow: "0 8px 32px rgba(0,0,0,.3)",
        }}
      >
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
          Métricas por clase
        </h3>
        {porClase.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>
            No hay clases con registros tentativos todavía.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {porClase.map((cl) => (
              <motion.div
                key={cl.class_id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  padding: "1rem",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.25rem", color: "#fff" }}>
                      {cl.nombre}
                    </div>
                    {cl.fecha && (
                      <div style={{ fontSize: "0.875rem", opacity: 0.8, color: "rgba(255,255,255,0.7)" }}>
                        {new Date(cl.fecha).toLocaleDateString("es-MX", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      padding: "0.5rem 0.75rem",
                      background: "rgba(240,147,251,0.15)",
                      borderRadius: 8,
                      border: "1px solid rgba(240,147,251,0.3)",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", opacity: 0.9, marginBottom: "0.25rem", color: "#fff" }}>
                      Total
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f093fb" }}>
                      {cl.totalTentativos}
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
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}

