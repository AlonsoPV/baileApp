import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEventFullByDateId } from "../../hooks/useEventFull";
import { useTags } from "../../hooks/useTags";

export default function EventPublicScreen() {
  const { id } = useParams();
  const dateId = Number(id);
  const nav = useNavigate();
  const { data, isLoading } = useEventFullByDateId(dateId);
  const { ritmos } = useTags("ritmo");

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        background: '#121212'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            borderTop: '3px solid #FF3D57',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div>Cargando evento...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        background: '#121212',
        padding: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
            Evento no encontrado
          </h2>
          <button
            onClick={() => nav('/')}
            style={{
              padding: '12px 24px',
              borderRadius: '25px',
              border: 'none',
              background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(236, 72, 153))',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const { parent, date, schedules, prices } = data;
  const styleNames = (parent.estilos || [])
    .map(eid => ritmos.find(r => r.id === eid)?.nombre)
    .filter(Boolean) as string[];

  return (
    <div style={{ color: 'white', background: '#121212', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        position: 'relative',
        minHeight: '280px',
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(59, 130, 246, 0.3))'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(2px)'
        }} />
        <div style={{
          position: 'relative',
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '2.5rem 1.5rem'
        }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '800',
            textShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            marginBottom: '0.5rem'
          }}>
            {parent.nombre}
          </h1>

          {parent.descripcion && (
            <p style={{
              marginTop: '0.5rem',
              opacity: 0.9,
              maxWidth: '42rem',
              lineHeight: '1.6'
            }}>
              {parent.descripcion}
            </p>
          )}

          <div style={{
            marginTop: '0.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            {styleNames.map(n => (
              <span
                key={n}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.875rem'
                }}
              >
                {n}
              </span>
            ))}
          </div>

          <div style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            opacity: 0.9,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <span>📅 {date.fecha}</span>
            {date.hora_inicio && (
              <span>
                🕒 {date.hora_inicio}{date.hora_fin ? `–${date.hora_fin}` : ""}
              </span>
            )}
            {(date.ciudad || date.lugar) && (
              <span>📍 {date.lugar || date.ciudad}</span>
            )}
          </div>

          {parent.sede_general && (
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              opacity: 0.8
            }}>
              🏢 {parent.sede_general}
            </div>
          )}

          {date.direccion && (
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              opacity: 0.8
            }}>
              🗺️ {date.direccion}
            </div>
          )}

          {date.requisitos && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.875rem'
            }}>
              <strong>👔 Requisitos:</strong> {date.requisitos}
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Columna izquierda: Cronograma */}
        <section style={{ gridColumn: 'span 2' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '0.75rem'
          }}>
            📅 Cronograma
          </h2>

          {schedules.length === 0 ? (
            <div style={{
              fontSize: '0.875rem',
              color: 'rgba(163, 163, 163, 1)',
              padding: '2rem',
              textAlign: 'center',
              background: 'rgba(38, 38, 38, 0.6)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              Aún no hay actividades programadas.
            </div>
          ) : (
            <ol style={{
              position: 'relative',
              borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
              marginLeft: '0.75rem',
              paddingLeft: 0,
              listStyle: 'none'
            }}>
              {schedules.map((s) => (
                <li key={s.id} style={{ marginBottom: '1.5rem', marginLeft: '1.5rem' }}>
                  <span style={{
                    position: 'absolute',
                    left: '-0.75rem',
                    display: 'flex',
                    height: '1.5rem',
                    width: '1.5rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '9999px',
                    background: 'rgba(236, 72, 153, 0.7)',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    {s.tipo === "clase" ? "🎓" : s.tipo === "show" ? "🎭" : s.tipo === "social" ? "💃" : "•"}
                  </span>

                  <div style={{
                    borderRadius: '0.75rem',
                    background: 'rgba(23, 23, 23, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.75rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div style={{ fontWeight: '500' }}>{s.titulo}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                        {s.hora_inicio}{s.hora_fin ? ` – ${s.hora_fin}` : ""}
                      </div>
                    </div>
                    {s.descripcion && (
                      <p style={{
                        fontSize: '0.875rem',
                        opacity: 0.9,
                        marginTop: '0.25rem',
                        margin: 0
                      }}>
                        {s.descripcion}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Columna derecha: Precios */}
        <aside>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '0.75rem'
          }}>
            💰 Costos y Promociones
          </h2>

          {prices.length === 0 ? (
            <div style={{
              fontSize: '0.875rem',
              color: 'rgba(163, 163, 163, 1)',
              padding: '2rem',
              textAlign: 'center',
              background: 'rgba(38, 38, 38, 0.6)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              Aún no hay precios configurados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {prices.map((p) => (
                <div
                  key={p.id}
                  style={{
                    borderRadius: '0.75rem',
                    background: 'rgba(23, 23, 23, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.75rem'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontWeight: '500' }}>
                      {iconFor(p.tipo)} {p.nombre}
                    </div>
                    {typeof p.monto === "number" && (
                      <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                        ${p.monto}
                      </div>
                    )}
                  </div>

                  {(p.hora_inicio || p.hora_fin) && (
                    <div style={{
                      fontSize: '0.75rem',
                      opacity: 0.8,
                      marginTop: '0.25rem'
                    }}>
                      {p.hora_inicio || "--:--"} – {p.hora_fin || "--:--"}
                    </div>
                  )}

                  {p.descripcion && (
                    <p style={{
                      fontSize: '0.875rem',
                      opacity: 0.9,
                      marginTop: '0.25rem',
                      margin: 0
                    }}>
                      {p.descripcion}
                    </p>
                  )}

                  {typeof p.descuento === "number" && (
                    <div style={{
                      fontSize: '0.75rem',
                      marginTop: '0.25rem',
                      color: 'rgb(74, 222, 128)'
                    }}>
                      Descuento: ${p.descuento}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function iconFor(t: string) {
  if (t === "preventa") return "🎫";
  if (t === "taquilla") return "💵";
  return "🔥";
}

