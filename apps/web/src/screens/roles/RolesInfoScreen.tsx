import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function RolesInfoScreen() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'usuario',
      name: 'Usuario / Bailarín',
      tag: 'Para quienes quieren descubrir dónde bailar',
      highlight: false,
      color: '#22c55e',
      features: [
        'Crear y personalizar tu perfil.',
        'Marcar eventos como interesados.',
        'Participar en challenges y trendings.',
        'Conectar con otros bailarines.'
      ]
    },
    {
      id: 'teacher',
      name: 'Maestro',
      tag: 'Para instructores que quieren crecer',
      highlight: true,
      color: '#fb7185',
      features: [
        'Publicar tus clases y horarios.',
        'Mostrar tu trayectoria y estilos que impartes.',
        'Conectar con academias y organizadores.',
        'Compartir contenido educativo.',
        'Ver métricas de asistencia por fechas en tus clases.'
      ]
    },
    {
      id: 'academy',
      name: 'Academia',
      tag: 'Para academias con múltiples clases',
      highlight: true,
      color: '#38bdf8',
      features: [
        'Publicar clases, ritmos y horarios.',
        'Mostrar ubicación, contacto, redes, paquetes y costos.',
        'Crear eventos y talleres de academia.',
        'Destacar maestros que forman parte de tu academia.',
        'Ver métricas de asistencia por fechas en clases y eventos.'
      ]
    },
    {
      id: 'brand',
      name: 'Marca',
      tag: 'Para proyectos de ropa, calzado y accesorios de baile',
      highlight: false,
      color: '#facc15',
      features: [
        'Mostrar un catálogo de productos para la comunidad de baile.',
        'Compartir guías de tallas y detalles por producto.',
        'Lanzar cupones y descuentos para usuarios de la plataforma.'
      ]
    },
    {
      id: 'organizer',
      name: 'Organizador',
      tag: 'Perfecto para sociales, congresos y festivales',
      highlight: true,
      color: '#a855f7',
      features: [
        'Crear eventos públicos y sociales dentro de la plataforma.',
        'Gestionar fechas, horarios y sedes.',
        'Ver estadísticas de asistencia y métricas por fechas.',
        'Invitar maestros y academias a tus eventos.'
      ]
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#111827',
      padding: '24px 12px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style>{`
        @media (max-width: 768px) {
          .roles-wrapper {
            padding: 20px 18px !important;
          }
          .roles-title {
            font-size: 1.75rem !important;
          }
          .roles-subtitle {
            font-size: 0.95rem !important;
          }
          .role-card {
            padding: 14px 16px !important;
          }
          .role-title {
            font-size: 14px !important;
          }
        }
        @media (max-width: 480px) {
          .roles-wrapper {
            padding: 16px 14px !important;
          }
          .roles-title {
            font-size: 1.5rem !important;
          }
        }
      `}</style>

      <main className="roles-wrapper" style={{
        width: '100%',
        maxWidth: '820px',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '22px 22px 18px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="roles-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <img 
                src="https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/LogoDondeBailar.png" 
                alt="Donde Bailar MX"
                style={{
                  height: '40px',
                  width: 'auto',
                  display: 'block'
                }}
              />
              <div style={{
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#6b7280'
              }}>
                DONDE BAILAR MX
              </div>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid #e5e7eb',
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6b7280',
              background: '#f9fafb'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#ff4f7b'
              }}></span>
              ROLES EN LA COMUNIDAD
            </div>
          </motion.div>

          {/* Title and Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="roles-title" style={{
              margin: '4px 0 4px',
              fontSize: '24px',
              letterSpacing: '-0.02em',
              color: '#111827'
            }}>
              Únete a la comunidad Donde Bailar MX
            </h1>
            <p className="roles-subtitle" style={{
              color: '#6b7280',
              maxWidth: '620px',
              fontSize: '13px',
              marginBottom: '12px'
            }}>
              Centralizamos <span style={{ color: '#ff4f7b', fontWeight: '600' }}>clases, academias, maestros, eventos y marcas</span> de baile
              para que sea más fácil encontrar dónde bailar y para que quienes organizan o enseñan puedan crecer su proyecto.
            </p>
          </motion.div>

          {/* Promo Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: '12px',
              color: '#111827',
              background: '#fffbeb',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              marginBottom: '18px',
              border: '1px solid #fed7aa'
            }}
          >
            <span style={{
              padding: '2px 8px',
              borderRadius: '999px',
              background: '#fee2e2',
              color: '#b91c1c',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.09em'
            }}>
              Lanzamiento
            </span>
            <span>
              <strong style={{ color: '#f97316' }}>Primeros 3 meses con acceso completo</strong> a todos los roles. Te apoyamos con la creación de tu perfil.
            </span>
          </motion.div>

          {/* Section Label */}
          <div style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: '#9ca3af',
            marginBottom: '4px'
          }}>
            Roles disponibles
          </div>

          {/* Role Cards */}
          {roles.map((role, index) => (
            <motion.section
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="role-card"
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e5e7eb',
                borderLeft: `4px solid ${role.color}`,
                padding: '16px 18px',
                marginBottom: '12px',
                position: 'relative'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '6px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#111827'
                }}>
                  {role.name}
                </div>
                <div style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: role.highlight ? '1px solid #fbbf24' : '1px solid #e5e7eb',
                  color: role.highlight ? '#92400e' : '#6b7280',
                  background: role.highlight ? '#fffbeb' : '#f9fafb',
                  whiteSpace: 'nowrap'
                }}>
                  {role.tag}
                </div>
              </div>
              
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                marginTop: '4px',
                marginBottom: '4px',
                color: '#4b5563'
              }}>
                Puedes:
              </div>
              
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: '12px',
                color: '#6b7280',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {role.features.map((feature, idx) => (
                  <li key={idx} style={{
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{
                      fontSize: '9px',
                      lineHeight: '1.6',
                      color: '#f97316',
                      marginTop: '1px'
                    }}>•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.section>
          ))}

          {/* CTA Banner */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              marginTop: '18px',
              padding: '12px 14px',
              borderRadius: '14px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe'
            }}
          >
            <p style={{
              fontSize: '13px',
              marginBottom: '8px',
              color: '#111827'
            }}>
              ¿Te gustaría ser parte de la comunidad <strong style={{ color: '#ff4f7b' }}>Donde Bailar MX</strong>?  
              Podemos ayudarte a crear tu perfil y dejar todo listo para el lanzamiento.
            </p>
            <Link
              to="/explore"
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: 'none',
                background: '#ff4f7b',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Unirme a la comunidad
            </Link>
          </motion.section>

          {/* Contact Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{
              marginTop: '14px',
              fontSize: '11px',
              color: '#6b7280',
              textAlign: 'left'
            }}
          >
            ¿Tienes dudas sobre qué rol activar primero?
            <a 
              href="mailto:alpeva96@gmail.com?subject=Contacto%20Donde%20Bailar%20MX"
              style={{
                color: '#ff4f7b',
                fontWeight: '600',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(251, 113, 133, 0.4)',
                marginLeft: '4px'
              }}
            >
              Escríbenos y te ayudamos a definirlo.
            </a>
          </motion.p>

          {/* WhatsApp Support */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <a
              href="https://wa.me/525511981149"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#16a34a',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 32 32" fill="#16a34a" aria-hidden="true">
                <path d="M16.04 4C9.4 4 4 9.36 4 15.92c0 2.8.92 5.28 2.52 7.32L4 28l4.92-2.48A11.83 11.83 0 0 0 16.04 28C22.68 28 28 22.64 28 16.08 28 9.36 22.68 4 16.04 4zm6.84 16.76c-.28.8-1.64 1.52-2.3 1.6-.6.12-1.38.16-2.24-.14-.52-.18-1.18-.38-2.04-.82-3.6-1.94-5.92-5.3-6.1-5.54-.18-.24-1.46-1.94-1.46-3.7 0-1.76.92-2.62 1.24-2.98.32-.34.7-.44.94-.44h.68c.22 0 .52-.08.82.62.3.74 1.04 2.54 1.12 2.72.08.18.12.4.02.64-.1.22-.16.36-.3.56-.16.18-.34.4-.48.54-.16.16-.32.34-.14.64.18.3.8 1.3 1.7 2.12 1.18 1.06 2.16 1.4 2.5 1.56.34.16.54.14.74-.08.22-.24.84-.94 1.06-1.26.22-.32.46-.26.78-.16.32.12 2.02.96 2.36 1.14.34.18.56.26.64.4.08.12.08.78-.2 1.58z"/>
              </svg>
              <span>55 11 98 11 49</span>
            </a>
          </motion.p>

          {/* Back Button */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                color: '#111827',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              }}
            >
              ← Volver
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
