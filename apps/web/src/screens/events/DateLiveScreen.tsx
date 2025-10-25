import React from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEventDate } from "../../hooks/useEventDate";
import { useEventParent } from "../../hooks/useEventParent";
import { useAuth } from "../../hooks/useAuth";
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";
import { Chip } from "../../components/profile/Chip";
import ShareLink from '../../components/ShareLink';
import ImageWithFallback from "../../components/ImageWithFallback";
import RSVPButtons from "../../components/rsvp/RSVPButtons";
import { useEventRSVP } from "../../hooks/useRSVP";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function DateLiveScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dateId = parseInt(id || '0');
  
  // Debug logs
  console.log('[DateLiveScreen] URL id:', id);
  console.log('[DateLiveScreen] Parsed dateId:', dateId);
  
  const { data: date, isLoading, error } = useEventDate(dateId);
  const { data: social } = useEventParent(date?.parent_id);
  const { data: allTags } = useTags();
  const { userStatus, stats, toggleInterested, isUpdating } = useEventRSVP(dateId);
  
  // Debug logs
  console.log('[DateLiveScreen] Date data:', date);
  console.log('[DateLiveScreen] Is loading:', isLoading);
  console.log('[DateLiveScreen] Error:', error);
  console.log('[DateLiveScreen] User RSVP status:', userStatus);
  console.log('[DateLiveScreen] RSVP stats:', stats);
  console.log('[DateLiveScreen] Is updating:', isUpdating);
  
  // Verificar si el usuario puede editar esta fecha
  const canEdit = social?.organizer_id && user?.id && 
    social.organizer_id === parseInt(user.id);

  // Get tag names from IDs
  const getRitmoNombres = () => {
    if (!allTags || !date?.estilos) return [];
    return date.estilos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!date || !social) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
        textAlign: 'center',
        padding: '2rem',
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Fecha no encontrada</h1>
          <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
            La fecha que buscas no existe o ha sido eliminada
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Volver al inicio
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
      color: colors.light,
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            background: `linear-gradient(135deg, ${colors.coral}, ${colors.blue})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
          }}>
            {date.nombre || social.nombre}
          </h1>
          
          {date.biografia && (
            <p style={{
              fontSize: '1.2rem',
              opacity: 0.8,
              maxWidth: '600px',
              margin: '0 auto 2rem',
              lineHeight: 1.6,
            }}>
              {date.biografia}
            </p>
          )}

          {/* Botones de acción */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '2rem',
          }}>
            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/social/fecha/${dateId}/edit`)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                  color: colors.light,
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ✏️ Editar Fecha
              </motion.button>
            )}
            
            <ShareLink url={window.location.href} />
          </div>
        </motion.div>

        {/* Información de la Fecha */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem',
          }}
        >
          {/* Fecha y Horario */}
          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              📅 Fecha y Horario
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                📅 {fmtDate(date.fecha)}
              </p>
              {date.hora_inicio && date.hora_fin && (
                <p style={{ fontSize: '1rem', opacity: 0.8 }}>
                  🕐 {fmtTime(date.hora_inicio)} - {fmtTime(date.hora_fin)}
                </p>
              )}
            </div>
          </div>

          {/* Ubicación */}
          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              📍 Ubicación
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {date.lugar && (
                <p style={{ fontSize: '1rem', fontWeight: '600' }}>
                  🏢 {date.lugar}
                </p>
              )}
              {date.direccion && (
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  📍 {date.direccion}
                </p>
              )}
              {date.ciudad && (
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  🏙️ {date.ciudad}
                </p>
              )}
            </div>
          </div>

          {/* Ritmos */}
          {getRitmoNombres().length > 0 && (
            <div style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                🎵 Ritmos
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {getRitmoNombres().map((ritmo, index) => (
                  <Chip key={index} label={ritmo} />
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Requisitos */}
        {date.requisitos && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              📋 Requisitos
            </h3>
            <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
              {date.requisitos}
            </p>
          </motion.section>
        )}

        {/* Referencias */}
        {date.referencias && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              📍 Referencias
            </h3>
            <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
              {date.referencias}
            </p>
          </motion.section>
        )}

        {/* Cronograma */}
        {date.cronograma && Array.isArray(date.cronograma) && date.cronograma.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              ⏰ Cronograma
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {date.cronograma.map((item: any, index: number) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: colors.light,
                  }}>
                    {item.hora && `🕐 ${item.hora} - `}{item.actividad}
                  </h4>
                  {item.descripcion && (
                    <p style={{
                      fontSize: '0.9rem',
                      opacity: 0.8,
                      lineHeight: 1.4,
                    }}>
                      {item.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Costos */}
        {date.costos && Array.isArray(date.costos) && date.costos.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              💰 Costos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {date.costos.map((costo: any, index: number) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: colors.light,
                  }}>
                    {costo.tipo && `${costo.tipo} - `}${costo.precio}
                  </h4>
                  {costo.descripcion && (
                    <p style={{
                      fontSize: '0.9rem',
                      opacity: 0.8,
                      lineHeight: 1.4,
                    }}>
                      {costo.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* RSVP */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
            🎫 Confirmar Asistencia
          </h3>
          <RSVPButtons 
            currentStatus={userStatus}
            onStatusChange={toggleInterested}
            disabled={isUpdating}
          />
          
          {/* Estadísticas RSVP */}
          {stats && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  👀 {stats.interesado} interesado{stats.interesado !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  👥 {stats.total} persona{stats.total !== 1 ? 's' : ''} en total
                </span>
              </div>
            </div>
          )}
        </motion.section>

        {/* Media */}
        {date.media && Array.isArray(date.media) && date.media.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
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
              {date.media.map((url: string, index: number) => (
                <ImageWithFallback
                  key={index}
                  src={url}
                  alt={`Media ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Link al Social */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
            🎭 Parte del Social
          </h3>
          <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
            Esta fecha es parte del social "{social.nombre}"
          </p>
          <Link
            to={`/social/${social.id}`}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Ver Social Completo
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
