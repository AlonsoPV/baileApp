import React, { useState } from "react";
import { motion } from "framer-motion";

export interface InvitedMaster {
  id: string;
  user_id?: string; // ID del usuario maestro
  name: string;
  specialty: string;
  avatar?: string;
  social_media?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  bio?: string;
  is_confirmed?: boolean;
  is_user_master?: boolean; // Si es un usuario con perfil de maestro
}

export interface InvitedMastersSectionProps {
  masters?: InvitedMaster[];
  title?: string;
  showTitle?: boolean;
  style?: React.CSSProperties;
  isEditable?: boolean;
  onAddMaster?: () => void;
  onEditMaster?: (master: InvitedMaster) => void;
  onRemoveMaster?: (masterId: string) => void;
  onAssignUserMaster?: () => void; // Nueva función para asignar usuario maestro
  availableUserMasters?: Array<{
    id: string;
    user_id: string;
    name: string;
    specialty: string;
    avatar?: string;
  }>; // Lista de usuarios con perfil de maestro disponibles
}

const defaultStyle: React.CSSProperties = {
  marginBottom: '2rem',
  padding: '2rem',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(10px)',
};

const masterCardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '1.5rem',
  marginBottom: '1rem',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
};

const masterCardHoverStyle: React.CSSProperties = {
  transform: 'translateY(-2px)',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
};

export default function InvitedMastersSection({
  masters = [],
  title = "🎭 Maestros Invitados",
  showTitle = true,
  style,
  isEditable = false,
  onAddMaster,
  onEditMaster,
  onRemoveMaster,
  onAssignUserMaster,
  availableUserMasters = [],
}: InvitedMastersSectionProps) {
  const [hoveredMaster, setHoveredMaster] = useState<string | null>(null);

  // Si no hay maestros y no es editable, no mostrar nada
  if (masters.length === 0 && !isEditable) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ ...defaultStyle, ...style }}
    >
      {showTitle && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: 0
          }}>
            {title}
          </h3>
          {isEditable && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddMaster}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                ➕ Agregar Maestro
              </motion.button>
              
              {availableUserMasters.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAssignUserMaster}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  👥 Asignar Usuario Maestro
                </motion.button>
              )}
            </div>
          )}
        </div>
      )}

      {masters.length === 0 && isEditable ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '1.1rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎭</div>
          <p style={{ margin: 0, marginBottom: '1rem' }}>
            No hay maestros invitados aún
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
            Agrega maestros que participarán en tus eventos
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {masters.map((master, index) => (
            <motion.div
              key={master.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              style={{
                ...masterCardStyle,
                ...(hoveredMaster === master.id ? masterCardHoverStyle : {}),
              }}
              onMouseEnter={() => setHoveredMaster(master.id)}
              onMouseLeave={() => setHoveredMaster(null)}
              onClick={() => isEditable && onEditMaster?.(master)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'white',
                  flexShrink: 0
                }}>
                  {master.avatar ? (
                    <img
                      src={master.avatar}
                      alt={master.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    master.name[0]?.toUpperCase() || '🎭'
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <h4 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: 'white',
                      margin: 0
                    }}>
                      {master.name}
                    </h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {master.is_confirmed && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid #10B981',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#10B981'
                        }}>
                          ✅ Confirmado
                        </span>
                      )}
                      {master.is_user_master && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid #3B82F6',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#3B82F6'
                        }}>
                          👤 Usuario Maestro
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    {master.specialty}
                  </p>
                </div>

                {/* Actions */}
                {isEditable && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    opacity: hoveredMaster === master.id ? 1 : 0.6,
                    transition: 'opacity 0.2s'
                  }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditMaster?.(master);
                      }}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid #3B82F6',
                        borderRadius: '8px',
                        color: '#3B82F6',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      ✏️
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveMaster?.(master.id);
                      }}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #EF4444',
                        borderRadius: '8px',
                        color: '#EF4444',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      🗑️
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Bio */}
              {master.bio && (
                <p style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: 0,
                  lineHeight: 1.5,
                  fontStyle: 'italic'
                }}>
                  "{master.bio}"
                </p>
              )}

              {/* Social Media */}
              {master.social_media && (
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {master.social_media.instagram && (
                    <a
                      href={master.social_media.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #E4405F, #C13584)',
                        borderRadius: '12px',
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      📷 Instagram
                    </a>
                  )}
                  {master.social_media.facebook && (
                    <a
                      href={master.social_media.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #1877F2, #0A5FCC)',
                        borderRadius: '12px',
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      📘 Facebook
                    </a>
                  )}
                  {master.social_media.whatsapp && (
                    <a
                      href={`https://wa.me/${master.social_media.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        borderRadius: '12px',
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      📱 WhatsApp
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
