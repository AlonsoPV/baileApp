import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDefaultProfile } from "../../hooks/useDefaultProfile";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useAcademyMy } from "../../hooks/useAcademyMy";
import DefaultProfileSelector from "../../components/profile/DefaultProfileSelector";
import { Chip } from "../../components/profile/Chip";

const colors = {
  primary: '#E53935',
  secondary: '#FB8C00',
  blue: '#1E88E5',
  coral: '#FF7043',
  light: '#F5F5F5',
  dark: '#1A1A1A',
  orange: '#FF9800'
};

export default function DefaultProfileSettings() {
  const navigate = useNavigate();
  const { getProfileOptions, defaultProfile } = useDefaultProfile();
  const { data: organizerProfile } = useMyOrganizer();
  const { data: academyProfile } = useAcademyMy();

  const profileOptions = getProfileOptions();

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.dark} 0%, #2C2C2C 100%)`,
      color: colors.light,
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          padding: '2rem 0',
          borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 1rem 0'
          }}>
            🎯 Configurar Perfil por Defecto
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0
          }}>
            Elige tu perfil principal para navegación rápida
          </p>
        </div>

        {/* Selector de Perfil por Defecto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <DefaultProfileSelector 
            showTitle={true}
            onProfileChange={(profileType) => {
              console.log('Perfil por defecto cambiado a:', profileType);
            }}
          />
        </motion.div>

        {/* Información de Perfiles Disponibles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            color: colors.light,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📋 Tus Perfiles Disponibles
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {profileOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                style={{
                  padding: '1.5rem',
                  background: option.id === defaultProfile 
                    ? 'rgba(229, 57, 53, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: option.id === defaultProfile 
                    ? `2px solid ${colors.primary}` 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {option.icon}
                  </span>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    margin: 0,
                    color: colors.light
                  }}>
                    {option.name}
                  </h3>
                  {option.id === defaultProfile && (
                    <Chip
                      label="Por Defecto"
                      active={true}
                    />
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  {option.hasProfile ? (
                    <Chip
                      label="✓ Configurado"
                      active={true}
                    />
                  ) : (
                    <Chip
                      label="⚠️ No configurado"
                      active={false}
                    />
                  )}
                  
                  {/* Estado de aprobación para organizador y academia */}
                  {option.hasProfile && (option.id === 'organizer' || option.id === 'academy') && (
                    <Chip
                      label={option.id === 'organizer' ? 
                        (organizerProfile?.estado_aprobacion === 'aprobado' ? '✅ Aprobado' :
                         organizerProfile?.estado_aprobacion === 'en_revision' ? '⏳ En revisión' :
                         organizerProfile?.estado_aprobacion === 'rechazado' ? '❌ Rechazado' : '📝 Borrador') :
                        (academyProfile?.estado_aprobacion === 'aprobado' ? '✅ Aprobado' :
                         academyProfile?.estado_aprobacion === 'en_revision' ? '⏳ En revisión' :
                         academyProfile?.estado_aprobacion === 'rechazado' ? '❌ Rechazado' : '📝 Borrador')
                      }
                      active={false}
                    />
                  )}
                  
                  {!option.available && (
                    <Chip
                      label="Próximamente"
                      active={false}
                    />
                  )}
                </div>
                
                <p style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: '0 0 1rem 0',
                  lineHeight: 1.4
                }}>
                  {option.id === 'user' && 'Tu perfil personal como usuario de la plataforma.'}
                  {option.id === 'organizer' && 'Perfil para organizadores de eventos y actividades.'}
                  {option.id === 'academy' && 'Perfil para academias y centros de enseñanza.'}
                  {option.id === 'teacher' && 'Perfil para maestros e instructores independientes.'}
                  {option.id === 'brand' && 'Perfil para marcas y empresas del sector.'}
                </p>
                
                {option.hasProfile && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(option.route)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: colors.light,
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      👁️ Ver
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`${option.route}/edit`)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: colors.primary,
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ✏️ Editar
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Información Adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            padding: '2rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            textAlign: 'center'
          }}
        >
          <h3 style={{
            fontSize: '1.25rem',
            color: '#3b82f6',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            💡 ¿Cómo funciona?
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 0 1rem 0',
            lineHeight: 1.6
          }}>
            El perfil por defecto determina a dónde te llevan los botones de navegación en el menú y la barra superior. 
            Puedes cambiarlo en cualquier momento desde esta pantalla.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/app/profile')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: colors.light,
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ← Volver al Perfil
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/explore')}
              style={{
                padding: '0.75rem 1.5rem',
                background: colors.primary,
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🔍 Explorar
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
