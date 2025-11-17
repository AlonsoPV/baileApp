import React from "react";
import { motion } from "framer-motion";
import { useOrganizerEventMetrics } from "@/hooks/useOrganizerEventMetrics";

type PanelProps = { organizerId: number };

export function OrganizerEventMetricsPanel({ organizerId }: PanelProps) {
  const { global, porFecha, loading, error, refetch } =
    useOrganizerEventMetrics(organizerId);

  React.useEffect(() => {
    if (organizerId) {
      refetch();
    }
  }, [organizerId, refetch]);

  if (loading) {
    return (
      <div style={{ padding: "1.5rem 0", textAlign: "center", color: "#fff" }}>
        Cargando métricas de fechas...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1.5rem 0", textAlign: "center", color: "#ff6b6b" }}>
        Hubo un problema al cargar las métricas de fechas.
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
        .metrics-date-card {
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .metrics-date-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .metrics-date-info {
          flex: 1;
          min-width: 0;
        }
        .metrics-date-rsvp {
          text-align: right;
          min-width: 120px;
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
          .metrics-date-card {
            padding: 0.875rem;
          }
          .metrics-date-header {
            flex-direction: column;
            gap: 0.75rem;
          }
          .metrics-date-rsvp {
            text-align: left;
            min-width: auto;
            width: 100%;
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
          .metrics-date-card {
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
            Métricas globales de fechas
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
              <div
                style={{
                  fontSize: "0.875rem",
                  opacity: 0.9,
                  marginBottom: "0.5rem",
                  color: "#fff",
                }}
              >
                Total RSVPs (interesados)
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  color: "#f093fb",
                }}
              >
                {global.totalRsvps}
              </div>
            </div>

            {/* Por rol */}
            <div>
              <div
                style={{
                  fontSize: "0.875rem",
                  opacity: 0.9,
                  marginBottom: "0.75rem",
                  color: "#fff",
                }}
              >
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
                  <div
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.8,
                      marginBottom: "0.25rem",
                      color: "#fff",
                    }}
                  >
                    Leader
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "#1E88E5",
                    }}
                  >
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
                  <div
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.8,
                      marginBottom: "0.25rem",
                      color: "#fff",
                    }}
                  >
                    Follower
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "#FFD166",
                    }}
                  >
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
                  <div
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.8,
                      marginBottom: "0.25rem",
                      color: "#fff",
                    }}
                  >
                    Ambos
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "#4CAF50",
                    }}
                  >
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
                  <div
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.8,
                      marginBottom: "0.25rem",
                      color: "#fff",
                    }}
                  >
                    Otros
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "#fff",
                    }}
                  >
                    {global.porRol.otros}
                  </div>
                </div>
              </div>
            </div>

            {/* Zonas top */}
            {global.zonas && global.zonas.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.9,
                    marginBottom: "0.5rem",
                    color: "#fff",
                  }}
                >
                  Zonas de origen (top)
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  {global.zonas.slice(0, 8).map((z) => (
                    <span
                      key={`${z.zona_tag_id}-${z.zona_nombre}`}
                      style={{
                        padding: "0.35rem 0.7rem",
                        borderRadius: 999,
                        border: "1px solid rgba(30,136,229,0.35)",
                        background: "rgba(30,136,229,0.12)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      📍 {z.zona_nombre} · {z.count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ritmos top */}
            {global.ritmos && global.ritmos.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.9,
                    marginBottom: "0.5rem",
                    color: "#fff",
                  }}
                >
                  Ritmos favoritos de quienes dan RSVP
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  {global.ritmos.slice(0, 8).map((r) => (
                    <span
                      key={`${r.ritmo_tag_id}-${r.ritmo_nombre}`}
                      style={{
                        padding: "0.35rem 0.7rem",
                        borderRadius: 999,
                        border: "1px solid rgba(255,209,102,0.45)",
                        background: "rgba(255,209,102,0.16)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      🎵 {r.ritmo_nombre} · {r.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>
            Aún no hay datos de RSVPs en tus fechas.
          </p>
        )}
      </motion.section>

      {/* Detalle por fecha */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="metrics-section"
      >
        <h3>
          Métricas por fecha
        </h3>

        {porFecha.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>
            No hay fechas con RSVPs todavía.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {porFecha.map((f) => {
              let fechaFormateada: string | null = null;
              if (f.fecha) {
                const m = String(f.fecha).match(/^\d{4}-\d{2}-\d{2}$/);
                if (m) {
                  const d = new Date(f.fecha + "T12:00:00");
                  if (!Number.isNaN(d.getTime())) {
                    fechaFormateada = d.toLocaleDateString("es-MX", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                  }
                } else {
                  fechaFormateada = String(f.fecha);
                }
              }

              return (
                <motion.div
                  key={f.event_date_id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="metrics-date-card"
                >
                  <div className="metrics-date-header">
                    <div className="metrics-date-info">
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: 800,
                          color: "#fff",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {f.nombre}
                      </div>
                      {fechaFormateada && (
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "rgba(255,255,255,0.85)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span>📅</span>
                          <span>{fechaFormateada}</span>
                        </div>
                      )}
                    </div>
                    <div className="metrics-date-rsvp">
                      <div
                        style={{
                          fontSize: "0.75rem",
                          opacity: 0.8,
                          marginBottom: "0.25rem",
                          color: "#fff",
                        }}
                      >
                        RSVPs
                      </div>
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: 900,
                          color: "#FFD166",
                        }}
                      >
                        {f.totalRsvps}
                      </div>
                    </div>
                  </div>

                  {/* Roles */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      marginTop: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        padding: "0.3rem 0.7rem",
                        borderRadius: 999,
                        border: "1px solid rgba(30,136,229,0.35)",
                        background: "rgba(30,136,229,0.1)",
                        fontSize: "0.8rem",
                        color: "#fff",
                      }}
                    >
                      Leader: {f.porRol.leader}
                    </span>
                    <span
                      style={{
                        padding: "0.3rem 0.7rem",
                        borderRadius: 999,
                        border: "1px solid rgba(255,209,102,0.35)",
                        background: "rgba(255,209,102,0.1)",
                        fontSize: "0.8rem",
                        color: "#fff",
                      }}
                    >
                      Follower: {f.porRol.follower}
                    </span>
                    <span
                      style={{
                        padding: "0.3rem 0.7rem",
                        borderRadius: 999,
                        border: "1px solid rgba(76,175,80,0.35)",
                        background: "rgba(76,175,80,0.1)",
                        fontSize: "0.8rem",
                        color: "#fff",
                      }}
                    >
                      Ambos: {f.porRol.ambos}
                    </span>
                    <span
                      style={{
                        padding: "0.3rem 0.7rem",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.3)",
                        background: "rgba(255,255,255,0.06)",
                        fontSize: "0.8rem",
                        color: "#fff",
                      }}
                    >
                      Otros: {f.porRol.otros}
                    </span>
                  </div>

                  {/* Zonas & Ritmos */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      marginTop: "0.75rem",
                    }}
                  >
                    {f.zonas.slice(0, 6).map((z) => (
                      <span
                        key={`${f.event_date_id}-z-${z.zona_tag_id}-${z.zona_nombre}`}
                        style={{
                          padding: "0.25rem 0.6rem",
                          borderRadius: 999,
                          border: "1px solid rgba(30,136,229,0.35)",
                          background: "rgba(30,136,229,0.12)",
                          fontSize: "0.75rem",
                          color: "#fff",
                        }}
                      >
                        📍 {z.zona_nombre} · {z.count}
                      </span>
                    ))}
                    {f.ritmos.slice(0, 6).map((r) => (
                      <span
                        key={`${f.event_date_id}-r-${r.ritmo_tag_id}-${r.ritmo_nombre}`}
                        style={{
                          padding: "0.25rem 0.6rem",
                          borderRadius: 999,
                          border: "1px solid rgba(255,209,102,0.35)",
                          background: "rgba(255,209,102,0.14)",
                          fontSize: "0.75rem",
                          color: "#fff",
                        }}
                      >
                        🎵 {r.ritmo_nombre} · {r.count}
                      </span>
                    ))}
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


