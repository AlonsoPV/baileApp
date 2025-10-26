import React from 'react';
import { useParams } from 'react-router-dom';
import { useAcademyPublic } from '../../hooks/useAcademy';
import { useTags } from '../../hooks/useTags';
import SocialMediaSection from '../../components/profile/SocialMediaSection';
import { Chip } from '../../components/profile/Chip';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';

const DIAS_SEMANA = [
  { value: 'Lun', label: 'Lunes' },
  { value: 'Mar', label: 'Martes' },
  { value: 'Mie', label: 'Miércoles' },
  { value: 'Jue', label: 'Jueves' },
  { value: 'Vie', label: 'Viernes' },
  { value: 'Sab', label: 'Sábado' },
  { value: 'Dom', label: 'Domingo' }
];

export default function AcademyPublicScreen() {
  const { academyId } = useParams();
  const id = Number(academyId);
  const { data: academy, isLoading } = useAcademyPublic(id);
  const { data: allTags } = useTags();

  // Obtener nombres de tags
  const getRitmoNombres = () => {
    if (!allTags || !academy?.ritmos) return [];
    return academy.ritmos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !academy?.zonas) return [];
    return academy.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getDiaLabel = (dia: string) => {
    return DIAS_SEMANA.find(d => d.value === dia)?.label || dia;
  };

  if (isLoading) {
    return (
      <div style={{
        padding: spacing[12],
        textAlign: 'center',
        color: colors.light,
        background: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
        <p style={{ fontSize: typography.fontSize.lg }}>Cargando academia...</p>
      </div>
    );
  }

  if (!academy) {
    return (
      <div style={{
        padding: spacing[12],
        textAlign: 'center',
        color: colors.light,
        background: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>❌</div>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>
          Academia no disponible
        </h2>
        <p style={{ marginBottom: spacing[6], opacity: 0.7, fontSize: typography.fontSize.lg }}>
          Esta academia no existe o no está aprobada
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: ${typography.fontFamily.primary};
        }
      `}</style>
      
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: colors.light,
        position: 'relative'
      }}>
        {/* Banner de la academia */}
        <div style={{
          position: 'relative',
          height: '400px',
          background: academy.portada_url 
            ? `url(${academy.portada_url}) center/cover`
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%)'
          }} />
          
          {/* Contenido del banner */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            maxWidth: '800px',
            padding: spacing[8]
          }}>
            {/* Avatar */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              margin: '0 auto',
              marginBottom: spacing[4],
              overflow: 'hidden',
              border: '4px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)'
            }}>
              {academy.avatar_url ? (
                <img
                  src={academy.avatar_url}
                  alt={academy.nombre_publico}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  background: 'linear-gradient(135deg, #FF3D57, #FF8C42)'
                }}>
                  🎓
                </div>
              )}
            </div>
            
            <h1 style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.black,
              margin: 0,
              marginBottom: spacing[2],
              background: 'linear-gradient(135deg, #FF3D57 0%, #FF8C42 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {academy.nombre_publico}
            </h1>
            
            {academy.bio && (
              <p style={{
                fontSize: typography.fontSize.lg,
                opacity: 0.9,
                margin: 0,
                lineHeight: typography.lineHeight.relaxed
              }}>
                {academy.bio}
              </p>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[8] }}>
          {/* Chips de ritmos y zonas */}
          <div style={{ marginBottom: spacing[8] }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], justifyContent: 'center' }}>
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
          </div>

          {/* Redes Sociales */}
          <div style={{ marginBottom: spacing[8] }}>
            <SocialMediaSection 
              respuestas={academy}
              redes_sociales={academy.redes_sociales}
              title="Redes Sociales"
              availablePlatforms={['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp', 'web']}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: borderRadius['2xl'],
                padding: spacing[6],
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>

          {/* Ubicaciones */}
          {academy.ubicaciones && academy.ubicaciones.length > 0 && (
            <div style={{ marginBottom: spacing[8] }}>
              <h2 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[6],
                color: colors.light
              }}>
                📍 Ubicaciones
              </h2>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: borderRadius['2xl'],
                padding: spacing[6],
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {academy.ubicaciones.map((ubicacion, index) => (
                  <div key={index} style={{
                    padding: spacing[4],
                    borderBottom: index < academy.ubicaciones.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    marginBottom: index < academy.ubicaciones.length - 1 ? spacing[4] : 0
                  }}>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      marginBottom: spacing[2],
                      color: colors.primary[500]
                    }}>
                      {ubicacion.sede || 'Sede'}
                    </h3>
                    <p style={{
                      fontSize: typography.fontSize.base,
                      color: colors.light,
                      marginBottom: spacing[1]
                    }}>
                      {ubicacion.direccion}
                    </p>
                    <p style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.light,
                      opacity: 0.7
                    }}>
                      {ubicacion.ciudad}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Horarios */}
          {academy.horarios && academy.horarios.length > 0 && (
            <div style={{ marginBottom: spacing[8] }}>
              <h2 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[6],
                color: colors.light
              }}>
                ⏰ Horarios de Clases
              </h2>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: borderRadius['2xl'],
                padding: spacing[6],
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: spacing[4]
                }}>
                  {academy.horarios.map((horario, index) => (
                    <div key={index} style={{
                      padding: spacing[3],
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: borderRadius.lg,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.primary[500],
                        marginBottom: spacing[2]
                      }}>
                        {getDiaLabel(horario.dia)}
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.light,
                        opacity: 0.8
                      }}>
                        {horario.desde && horario.hasta ? `${horario.desde} - ${horario.hasta}` : 'Horario por confirmar'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Galería de medios */}
          {Array.isArray(academy.media) && academy.media.length > 0 && (
            <div style={{ marginBottom: spacing[8] }}>
              <h2 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[6],
                color: colors.light
              }}>
                📷 Galería
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: spacing[4]
              }}>
                {academy.media.map((item, index) => (
                  <div key={index} style={{
                    borderRadius: borderRadius.xl,
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={`Imagen ${index + 1}`}
                        style={{
                          width: '100%',
                          aspectRatio: '16/9',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        style={{
                          width: '100%',
                          aspectRatio: '16/9',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}