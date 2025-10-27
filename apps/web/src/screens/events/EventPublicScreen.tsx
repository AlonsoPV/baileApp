import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEventLiveById } from "../../hooks/useLive";
import { useEventSchedules } from "../../hooks/useEventSchedules";
import { useEventPrices } from "../../hooks/useEventPrices";
import { useTags } from "../../hooks/useTags";
import { useAuth } from '@/contexts/AuthProvider';
import { canEditEventDate } from "../../lib/access";
import { useToast } from "../../components/Toast";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import ShareLink from "../../components/ShareLink";
import SimpleInterestButton, { InterestCounter } from "../../components/SimpleInterestButton";

export default function EventPublicScreen() {
  const { id } = useParams();
  const dateId = Number(id);
  const nav = useNavigate();
  const { user } = useAuth();
  
  // Usar vista LIVE en lugar de useEventFullByDateId
  const { data: eventLive, isLoading } = useEventLiveById(dateId);
  const { data: schedules = [] } = useEventSchedules(dateId);
  const { data: prices = [] } = useEventPrices(dateId);
  const { ritmos } = useTags("ritmo");
  const { showToast } = useToast();

  // Verificar si el usuario puede editar este evento
  const canEdit = canEditEventDate(eventLive, user?.id);

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

  if (!eventLive) {
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
            Evento no disponible
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' }}>
            Este evento no está publicado o no existe.
          </p>
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

  // Extraer información de la vista live
  const styleNames = (eventLive.evento_estilos || [])
    .map(eid => ritmos.find(r => r.id === eid)?.nombre)
    .filter(Boolean) as string[];

  return (
    <div style={{ color: 'white', background: '#121212', minHeight: '100vh' }}>
      {/* Breadcrumbs */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem 1.5rem 0' }}>
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/', icon: '🏠' },
            { label: eventLive.evento_nombre, href: `/events/parent/${eventLive.parent_id}`, icon: '🎉' },
            { label: eventLive.fecha, icon: '📅' },
          ]}
        />
      </div>

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '800',
              textShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            }}>
              {eventLive.evento_nombre}
            </h1>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <ShareLink label="Compartir" />
              
              {canEdit && (
                <Link
                  to={`/profile/organizer/events/date/${eventLive.id}/edit`}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(236, 72, 153, 0.8)',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  ✏️ Editar
                </Link>
              )}
            </div>
          </div>

          {eventLive.evento_descripcion && (
            <p style={{
              marginTop: '0.5rem',
              opacity: 0.9,
              maxWidth: '42rem',
              lineHeight: '1.6'
            }}>
              {eventLive.evento_descripcion}
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
            <span>📅 {eventLive.fecha}</span>
            {eventLive.hora_inicio && (
              <span>
                🕒 {eventLive.hora_inicio}{eventLive.hora_fin ? `–${eventLive.hora_fin}` : ""}
              </span>
            )}
            {(eventLive.ciudad || eventLive.lugar) && (
              <span>📍 {eventLive.lugar || eventLive.ciudad}</span>
            )}
            <Link
              to={`/organizer/${eventLive.organizador_id}`}
              style={{
                color: 'rgb(236, 72, 153)',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              👤 {eventLive.organizador_nombre}
            </Link>
          </div>

          {eventLive.sede_general && (
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              opacity: 0.8
            }}>
              🏢 {eventLive.sede_general}
            </div>
          )}

          {eventLive.direccion && (
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              opacity: 0.8
            }}>
              🗺️ {eventLive.direccion}
            </div>
          )}

          {eventLive.requisitos && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.875rem'
            }}>
              <strong>👔 Requisitos:</strong> {eventLive.requisitos}
            </div>
          )}
        </div>
      </div>

      {/* RSVP Section - Simplificado */}
      <section style={{
        padding: '2rem 1.5rem',
        maxWidth: '50rem',
        margin: '0 auto'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '3rem',
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center'
          }}
        >
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 50% 50%, rgba(255, 209, 102, 0.15) 0%, transparent 50%)
            `,
            pointerEvents: 'none'
          }} />

          <div style={{
            position: 'relative',
            zIndex: 1
          }}>
            {/* Sección principal */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '2rem'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD166, #FF8C42)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  boxShadow: '0 8px 24px rgba(255, 209, 102, 0.4)'
                }}>
                  🎉
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  ¿Nos acompañas?
                </h3>
              </div>
              
              {/* Botón "Me interesa" */}
              <div>
                <SimpleInterestButton eventDateId={dateId} />
              </div>

              {/* Contador de interesados */}
              <div style={{ marginTop: '2rem' }}>
                <InterestCounter eventDateId={dateId} />
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255, 209, 102, 0.2), rgba(255, 140, 66, 0.2))',
            filter: 'blur(20px)',
            pointerEvents: 'none'
          }} />
        </motion.div>
      </section>

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

