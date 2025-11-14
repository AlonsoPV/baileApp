import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function RolesInfoScreen() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'usuario',
      name: 'Usuario',
      icon: '👤',
      description: 'Perfil básico para bailarines. Puedes explorar eventos, conectar con otros bailarines y participar en la comunidad.',
      features: [
        'Crear y personalizar tu perfil',
        'Marcar eventos como interesados',
        'Participar en Challenges y Trendings',
        'Conectar con otros bailarines'
      ]
    },
    {
      id: 'organizador',
      name: 'Organizador',
      icon: '🎤',
      description: 'Para promotores y organizadores de eventos de baile. Publica tus eventos y llega a más bailarines.',
      features: [
        'Crear eventos públicos y sociales',
        'Gestionar fechas y horarios',
        'Ver estadísticas de asistencia',
        'Invitar maestros a tus eventos'
      ]
    },
    {
      id: 'academia',
      name: 'Academia',
      icon: '🎓',
      description: 'Para escuelas y academias de baile. Promociona tus clases, instalaciones y eventos.',
      features: [
        'Publicar clases y horarios',
        'Mostrar ubicaciones y contacto',
        'Crear eventos de la academia',
        'Destacar maestros invitados'
      ]
    },
    {
      id: 'maestro',
      name: 'Maestro',
      icon: '👨‍🏫',
      description: 'Para instructores y maestros de baile. Comparte tu experiencia y clases.',
      features: [
        'Publicar tus clases',
        'Mostrar tu trayectoria',
        'Conectar con academias',
        'Compartir contenido educativo'
      ]
    },
    {
      id: 'marca',
      name: 'Marca',
      icon: '🏷️',
      description: 'Para marcas de ropa, calzado y accesorios de baile. Promociona tus productos.',
      features: [
        'Catálogo de productos',
        'Guías de tallas',
        'Cupones y descuentos',
        'Galería de lookbook'
      ]
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b0d10 0%, #1a1d24 100%)',
      color: '#fff',
      padding: '2rem',
      paddingBottom: '120px'
    }}>
      <style>{`
        @media (max-width: 768px) {
          .roles-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          maxWidth: '1200px',
          margin: '0 auto 3rem',
          textAlign: 'center'
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: '2rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          ← Volver
        </button>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: '800',
          margin: '0 0 1rem 0',
          background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🎭 Nuestros Roles
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          color: 'rgba(255, 255, 255, 0.7)',
          maxWidth: '700px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Descubre los diferentes roles disponibles en Dónde Bailar y encuentra el que mejor se adapte a ti
        </p>
      </motion.div>

      {/* Grid de Roles */}
      <div 
        className="roles-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {roles.map((role, index) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            }}
          >
            {/* Icono y Nombre */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontSize: '2.5rem',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}>
                {role.icon}
              </div>
              
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                margin: 0,
                background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {role.name}
              </h2>
            </div>

            {/* Descripción */}
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1.5rem'
            }}>
              {role.description}
            </p>

            {/* Características */}
            <div>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Características:
              </h3>
              
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {role.features.map((feature, idx) => (
                  <li key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    <span style={{ 
                      color: '#4CAF50',
                      fontSize: '1rem'
                    }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Botón de solicitud */}
            {role.id !== 'usuario' && (
              <button
                onClick={() => navigate(`/app/roles/request?role=${role.id}`)}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Solicitar Rol {role.name}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* CTA Final */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          maxWidth: '800px',
          margin: '4rem auto 0',
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ¿Necesitas ayuda?
        </h3>
        <p style={{
          fontSize: '1rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '1.5rem',
          lineHeight: '1.6'
        }}>
          Si tienes dudas sobre qué rol es el adecuado para ti o cómo solicitarlo, 
          contáctanos y con gusto te ayudaremos.
        </p>
        <button
          onClick={() => navigate('/quienes-somos')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          📧 Contáctanos
        </button>
      </motion.div>
    </div>
  );
}

