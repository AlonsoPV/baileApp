import React from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEventParent } from "../../hooks/useEventParent";
import { useEventDatesByParent } from "../../hooks/useEventDate";
import { useAuth } from '@/contexts/AuthProvider';
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";
import { Chip } from "../../components/profile/Chip";
import ShareLink from '../../components/ShareLink';
import ImageWithFallback from "../../components/ImageWithFallback";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function SocialLiveScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socialId = parseInt(id || '0');
  
  const { data: social, isLoading } = useEventParent(socialId);
  const { data: dates } = useEventDatesByParent(socialId);
  const { data: allTags } = useTags();
  
  // Verificar si el usuario puede editar este social
  const canEdit = social?.organizer_id && user?.id && 
    social.organizer_id === parseInt(user.id);

  // Get tag names from IDs
  const getRitmoNombres = () => {
    if (!allTags || !social?.estilos) return [];
    return social.estilos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !social?.zonas) return [];
    return social.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
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

  if (!social) {
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
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Social no encontrado</h1>
          <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
            El social que buscas no existe o ha sido eliminado
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
            {social.nombre}
          </h1>
          
          {social.descripcion && (
            <p style={{
              fontSize: '1.2rem',
              opacity: 0.8,
              maxWidth: '600px',
              margin: '0 auto 2rem',
              lineHeight: 1.6,
            }}>
              {social.descripcion}
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
                onClick={() => navigate(`/social/${socialId}/edit`)}
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
                ✏️ Editar Social
              </motion.button>
            )}
            
            <ShareLink url={window.location.href} />
          </div>
        </motion.div>

        {/* Información del Social */}
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

          {/* Zonas */}
          {getZonaNombres().length > 0 && (
            <div style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                📍 Zonas
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {getZonaNombres().map((zona, index) => (
                  <Chip key={index} label={zona} />
                ))}
              </div>
            </div>
          )}

          {/* Sede General */}
          {social.sede_general && (
            <div style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                🏢 Sede General
              </h3>
              <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
                {social.sede_general}
              </p>
            </div>
          )}
        </motion.div>

        {/* FAQ */}
        {social.faq && Array.isArray(social.faq) && social.faq.length > 0 && (
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
              ❓ Preguntas Frecuentes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {social.faq.map((faq: any, index: number) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: colors.light,
                  }}>
                    ❓ {faq.q}
                  </h4>
                  <p style={{
                    fontSize: '0.9rem',
                    opacity: 0.8,
                    lineHeight: 1.4,
                  }}>
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Fechas del Social */}
        {dates && dates.length > 0 && (
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
              📅 Fechas Disponibles
            </h3>
            <p style={{ marginBottom: '1.5rem', opacity: 0.7, fontSize: '0.9rem' }}>
              {dates.length} {dates.length === 1 ? 'fecha' : 'fechas'} disponibles
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {dates.map(fecha => (
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
                      {fecha.nombre || social.nombre}
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

        {/* Media */}
        {social.media && Array.isArray(social.media) && social.media.length > 0 && (
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
              📸 Galería
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              {social.media.map((url: string, index: number) => (
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
      </div>
    </div>
  );
}
