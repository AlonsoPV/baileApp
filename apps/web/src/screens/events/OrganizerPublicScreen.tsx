import React from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useOrganizerLiveById, useEventsByOrganizerLive } from '../../hooks/useLive';
import { useEventParentsByOrganizer, useEventDatesByOrganizer } from '../../hooks/useEventParentsByOrganizer';
import { useAuth } from '../../hooks/useAuth';
import { canEditOrganizer } from '../../lib/access';
import { useTags } from "../../hooks/useTags";
import { Chip } from "../../components/profile/Chip";
import ShareLink from '../../components/ShareLink';
import { fmtDate, fmtTime } from "../../utils/format";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function OrganizerPublicScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const organizerId = parseInt(id || '0');
  
  const { data: org, isLoading } = useOrganizerLiveById(organizerId);
  const { data: eventos } = useEventsByOrganizerLive(organizerId);
  const { data: eventParents } = useEventParentsByOrganizer(organizerId);
  const { data: eventDates } = useEventDatesByOrganizer(organizerId);
  const { data: allTags } = useTags();
  
  // Debug logs
  console.log('[OrganizerPublicScreen] organizerId:', organizerId);
  console.log('[OrganizerPublicScreen] org:', org);
  console.log('[OrganizerPublicScreen] eventParents:', eventParents);
  console.log('[OrganizerPublicScreen] eventDates:', eventDates);
  
  // Verificar si el usuario puede editar este organizador
  const canEdit = canEditOrganizer(org, user?.id);

  // Get tag names from IDs
  const getRitmoNombres = () => {
    if (!allTags || !org?.ritmos) return [];
    return org.ritmos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !org?.zonas) return [];
    return org.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  // Preparar chip de estado
  const statusChip = org ? (
    <span
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        background: org.estado_aprobacion === 'aprobado' ? '#10B981cc' : `${colors.orange}cc`,
        border: `2px solid ${org.estado_aprobacion === 'aprobado' ? '#10B981' : colors.orange}`,
        color: colors.light,
        fontSize: '0.875rem',
        fontWeight: '700',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 2px 10px ${org.estado_aprobacion === 'aprobado' ? '#10B981' : colors.orange}66`,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {org.estado_aprobacion === 'aprobado' ? '✅' : '⏳'} {org.estado_aprobacion}
    </span>
  ) : null;

  if (isLoading) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>Cargando organizador...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
          Organizador no disponible
        </h2>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>
          El organizador que buscas no está aprobado, no existe o no está disponible.
        </p>
        <Link 
          to="/explore"
          style={{
            padding: '14px 28px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '700',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          🔍 Volver a Explorar
        </Link>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .org-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .org-banner {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .org-banner-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 3rem;
          align-items: center;
        }
        @media (max-width: 768px) {
          .org-container {
            max-width: 100% !important;
          }
          .org-banner {
            border-radius: 0 !important;
            padding: 2rem 1rem !important;
          }
          .org-banner-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
            justify-items: center !important;
            text-align: center !important;
          }
          .org-banner-grid h1 {
            font-size: 2rem !important;
          }
          .org-banner-avatar {
            width: 180px !important;
            height: 180px !important;
          }
          .org-banner-avatar-fallback {
            font-size: 4rem !important;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: colors.dark,
        color: colors.light,
        width: '100%'
      }}>
        {/* Botón compartir y editar */}
        <div className="org-container" style={{
          padding: '1rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem'
        }}>
          <ShareLink variant="icon-only" />
          
          {canEdit && (
            <Link 
              to="/profile/organizer/edit"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                background: colors.coral,
                color: 'white',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              ✏️ Editar
            </Link>
          )}
        </div>

        {/* Banner Principal */}
        <div className="org-banner" style={{
          position: 'relative',
          background: '#000000',
          overflow: 'hidden',
          borderRadius: '16px',
          padding: '3rem 2rem'
        }}>
          <div className="org-banner-grid">
            {/* Columna 1: Logo del Organizador */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div className="org-banner-avatar" style={{
                width: '250px',
                height: '250px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '6px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
                background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
              }}>
                {org.media && Array.isArray(org.media) && org.media[0] ? (
                  <img
                    src={typeof org.media[0] === 'string' ? org.media[0] : org.media[0].url}
                    alt="Logo del organizador"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="org-banner-avatar-fallback" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '6rem',
                    fontWeight: '700',
                    color: 'white'
                  }}>
                    {org.nombre_publico?.[0]?.toUpperCase() || '🎤'}
                  </div>
                )}
              </div>
            </div>

            {/* Columna 2: Nombre, Chips y Estado */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              justifyContent: 'center'
            }}>
              <h1 style={{
                fontSize: '3rem',
                fontWeight: '800',
                margin: 0,
                color: colors.light,
                lineHeight: '1.2'
              }}>
                {org.nombre_publico}
              </h1>

              {/* Chips de ritmos y zonas */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {getRitmoNombres().map((nombre) => (
                  <Chip 
                    key={`r-${nombre}`} 
                    label={nombre} 
                    icon="🎵" 
                    variant="ritmo" 
                  />
                ))}
                {getZonaNombres().map((nombre) => (
                  <Chip 
                    key={`z-${nombre}`} 
                    label={nombre} 
                    icon="📍" 
                    variant="zona" 
                  />
                ))}
              </div>

              {/* Estado del organizador */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {statusChip}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="org-container" style={{ 
          padding: '2rem'
        }}>
          {/* Biografía */}
          {org.bio && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                💬 Sobre nosotros
              </h3>
              <p style={{ lineHeight: 1.6, opacity: 0.85, fontSize: '1rem' }}>
                {org.bio}
              </p>
            </motion.section>
          )}

          {/* Pregunta: ¿Qué música tocarán? */}
          {org.respuestas?.musica_tocaran && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                🎵 ¿Qué música tocarán?
              </h3>
              <p style={{ lineHeight: 1.6, opacity: 0.85, fontSize: '1rem' }}>
                {org.respuestas.musica_tocaran}
              </p>
            </motion.section>
          )}

          {/* Pregunta: ¿Hay estacionamiento? */}
          {org.respuestas?.hay_estacionamiento && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                🅿️ ¿Hay estacionamiento?
              </h3>
              <p style={{ lineHeight: 1.6, opacity: 0.85, fontSize: '1rem' }}>
                {org.respuestas.hay_estacionamiento}
              </p>
            </motion.section>
          )}

          {/* Eventos (Sociales) */}
          {eventParents && eventParents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                🎭 Nuestros Sociales
              </h3>
              <p style={{ marginBottom: '1.5rem', opacity: 0.7, fontSize: '0.9rem' }}>
                {eventParents.length} {eventParents.length === 1 ? 'evento' : 'eventos'} disponibles
              </p>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {eventParents.map(evento => (
                  <Link
                    key={evento.id}
                    to={`/social/${evento.id}`}
                    style={{
                      display: 'block',
                      padding: '1.5rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      textDecoration: 'none',
                      color: colors.light,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                        {evento.nombre}
                      </h4>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.25rem 0.5rem', 
                        background: evento.estado_aprobacion === 'aprobado' ? colors.blue : colors.orange,
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        {evento.estado_aprobacion === 'aprobado' ? 'Aprobado' : 'En revisión'}
                      </span>
                    </div>
                    
                    {evento.descripcion && (
                      <p style={{ 
                        fontSize: '0.9rem', 
                        opacity: 0.8, 
                        marginBottom: '0.75rem',
                        lineHeight: 1.4
                      }}>
                        {evento.descripcion}
                      </p>
                    )}
                    
                    {evento.sede_general && (
                      <div>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0 0 0.25rem 0' }}>📍 Sede General</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>
                          {evento.sede_general}
                        </p>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* Fechas de Eventos */}
          {eventDates && eventDates.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                📅 Próximas Fechas
              </h3>
              <p style={{ marginBottom: '1.5rem', opacity: 0.7, fontSize: '0.9rem' }}>
                {eventDates.length} {eventDates.length === 1 ? 'fecha' : 'fechas'} disponibles
              </p>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {eventDates.map(fecha => (
                  <Link
                    key={fecha.id}
                    to={`/social/fecha/${fecha.id}`}
                    style={{
                      display: 'block',
                      padding: '1.5rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      textDecoration: 'none',
                      color: colors.light,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                        {fecha.events_parent?.nombre || 'Evento'}
                      </h4>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.25rem 0.5rem', 
                        background: fecha.estado_publicacion === 'publicado' ? colors.blue : colors.orange,
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        {fecha.estado_publicacion === 'publicado' ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0 0 0.25rem 0' }}>📅 Fecha</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>
                          {fmtDate(fecha.fecha)}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0 0 0.25rem 0' }}>🕐 Horario</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>
                          {fecha.hora_inicio && fecha.hora_fin 
                            ? `${fmtTime(fecha.hora_inicio)} - ${fmtTime(fecha.hora_fin)}`
                            : 'Por definir'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0 0 0.25rem 0' }}>📍 Lugar</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>
                          {fecha.lugar || 'Por definir'}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0 0 0.25rem 0' }}>🏙️ Ciudad</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>
                          {fecha.ciudad || 'Por definir'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* Galería */}
          {org.media && Array.isArray(org.media) && org.media.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                📸 Galería
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
              }}>
                {org.media.map((item: any, idx: number) => {
                  const url = typeof item === 'string' ? item : item.url;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      style={{
                        aspectRatio: '1',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <img
                        src={url}
                        alt={`Media ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255, 255, 255, 0.5)">
                                🖼️ Error al cargar
                              </div>
                            `;
                          }
                        }}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </>
  );
}