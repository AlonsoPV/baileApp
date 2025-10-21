import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { ProfileHero } from "../../components/profile/ProfileHero";
import { MediaGrid } from "../../components/MediaGrid";
import { EventInviteStrip } from "../../components/EventInviteStrip";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useParentsByOrganizer, useDatesByParent, useRSVPCounts } from "../../hooks/useEvents";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function OrganizerProfileLive() {
  const navigate = useNavigate();
  const { data: org, isLoading } = useMyOrganizer();
  const { data: parents } = useParentsByOrganizer(org?.id);
  const { media } = useOrganizerMedia();
  const { ritmos } = useTags('ritmo');

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
          No tienes perfil de organizador
        </h2>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>
          Crea uno para organizar eventos
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile/organizer/edit')}
          style={{
            padding: '14px 28px',
            borderRadius: '50px',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(30,136,229,0.5)',
          }}
        >
          🎤 Crear Organizador
        </motion.button>
      </div>
    );
  }

  // Preparar chips de estado
  const statusChip = (
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
  );

  // Preparar items de "Próximos eventos" (fechas publicadas)
  const getUpcomingDates = () => {
    const upcomingItems: any[] = [];
    
    parents?.forEach(parent => {
      // Aquí podrías usar useDatesByParent para cada parent, pero por simplicidad usamos mock
      upcomingItems.push({
        title: parent.nombre,
        date: 'Próximamente',
        place: parent.sede_general || '',
        href: `/events/parent/${parent.id}`,
        cover: Array.isArray(parent.media) && parent.media.length > 0 
          ? (parent.media[0] as any)?.url || parent.media[0]
          : undefined,
      });
    });

    return upcomingItems.slice(0, 3);
  };

  const inviteItems = getUpcomingDates();

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
    }}>
      {/* Breadcrumbs */}
      <div style={{ padding: '24px 24px 0' }}>
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/app/profile', icon: '🏠' },
            { label: 'Organizador', icon: '🎤' },
          ]}
        />
      </div>

      {/* Hero Section */}
      <ProfileHero
        coverUrl={media[0]?.url || (Array.isArray(org.media) && org.media.length > 0 ? org.media[0] : undefined)}
        title={org.nombre_publico}
        subtitle={org.bio || undefined}
        chipsLeft={[statusChip]}
      />

      {/* Content Sections */}
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        {/* About Section */}
        {org.bio && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              marginBottom: '32px',
              padding: '24px',
              background: `${colors.dark}ee`,
              borderRadius: '16px',
              border: `1px solid ${colors.light}22`,
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '600' }}>
              💬 Sobre nosotros
            </h3>
            <p style={{ lineHeight: 1.6, opacity: 0.85 }}>
              {org.bio}
            </p>
          </motion.section>
        )}

        {/* Próximos Eventos del Organizador */}
        {inviteItems.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div style={{
              background: `linear-gradient(135deg, ${colors.coral}22, ${colors.orange}22)`,
              padding: '20px',
              borderRadius: '16px',
              border: `1px solid ${colors.coral}33`,
            }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                margin: 0,
                color: colors.light,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span style={{
                  fontSize: '2rem',
                  background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  🎫
                </span>
                Nuestros próximos eventos
              </h2>
              <p style={{
                marginTop: '8px',
                opacity: 0.7,
                fontSize: '0.95rem',
              }}>
                {inviteItems.length} {inviteItems.length === 1 ? 'evento' : 'eventos'} próximos
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '20px',
                padding: '24px',
                background: `${colors.dark}aa`,
                borderRadius: '0 0 16px 16px',
                border: `1px solid ${colors.coral}33`,
                borderTop: 'none',
                scrollbarWidth: 'thin',
                scrollbarColor: `${colors.coral} ${colors.dark}`,
              }}
            >
              {inviteItems.map((ev, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  style={{ minWidth: '300px' }}
                >
                  <motion.div
                    onClick={() => navigate(ev.href)}
                    style={{
                      display: 'block',
                      background: `${colors.dark}ee`,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: colors.light,
                      border: `2px solid ${colors.coral}44`,
                      boxShadow: `0 4px 16px ${colors.coral}33`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                    whileHover={{ 
                      borderColor: colors.coral,
                      boxShadow: `0 12px 32px ${colors.coral}66`
                    }}
                  >
                    {/* Cover Image */}
                    <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                      {ev.cover ? (
                        <>
                          <img
                            src={ev.cover}
                            alt={ev.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          {/* Gradient Overlay */}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(to bottom, transparent, ${colors.dark}aa)`,
                          }} />
                        </>
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3rem',
                        }}>
                          🎉
                        </div>
                      )}

                      {/* Date Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: colors.coral,
                        color: colors.light,
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        textTransform: 'uppercase',
                      }}>
                        {ev.date}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '16px' }}>
                      <h3 style={{
                        color: colors.light,
                        fontWeight: '700',
                        fontSize: '1.2rem',
                        marginBottom: '8px',
                        lineHeight: 1.2,
                      }}>
                        {ev.title}
                      </h3>
                      {ev.place && (
                        <div style={{
                          fontSize: '0.875rem',
                          color: `${colors.light}99`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <span style={{ fontSize: '1rem' }}>📍</span>
                          {ev.place}
                        </div>
                      )}

                      {/* CTA */}
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        borderRadius: '12px',
                        background: `${colors.coral}22`,
                        border: `1px solid ${colors.coral}44`,
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: colors.coral,
                      }}>
                        👁️ Ver evento
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Galería */}
        {media && media.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{
              marginTop: '32px',
            }}
          >
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              marginBottom: '16px',
            }}>
              📸 Galería
            </h2>
            <MediaGrid items={media} />
          </motion.section>
        )}

        {/* Todos los Eventos */}
        {parents && parents.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              marginTop: '32px',
            }}
          >
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              marginBottom: '16px',
            }}>
              📅 Todos los Eventos
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {parents.map((parent) => (
                <motion.div
                  key={parent.id}
                  whileHover={{ scale: 1.01, boxShadow: `0 8px 24px ${colors.coral}44` }}
                  onClick={() => navigate(`/events/parent/${parent.id}`)}
                  style={{
                    padding: '24px',
                    background: `${colors.dark}ee`,
                    borderRadius: '16px',
                    border: `1px solid ${colors.light}22`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
                    {parent.nombre}
                  </h3>
                  {parent.descripcion && (
                    <p style={{ opacity: 0.7, marginBottom: '12px', lineHeight: 1.5 }}>
                      {parent.descripcion}
                    </p>
                  )}
                  {parent.sede_general && (
                    <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>
                      📍 {parent.sede_general}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}