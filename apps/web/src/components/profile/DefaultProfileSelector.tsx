import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDefaultProfile, ProfileOption } from '../../hooks/useDefaultProfile';
import { Chip } from './Chip';

interface DefaultProfileSelectorProps {
  onProfileChange?: (profileType: string) => void;
  showTitle?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function DefaultProfileSelector({
  onProfileChange,
  showTitle = true,
  style,
  className
}: DefaultProfileSelectorProps) {
  const {
    defaultProfile,
    updateDefaultProfile,
    getProfileOptions,
    isLoading
  } = useDefaultProfile();

  const [isOpen, setIsOpen] = useState(false);

  const handleProfileSelect = async (profileType: string) => {
    updateDefaultProfile(profileType as any);
    setIsOpen(false);
    // Esperar un momento para que el estado se actualice
    await new Promise(resolve => setTimeout(resolve, 100));
    onProfileChange?.(profileType);
  };

  const currentProfile = getProfileOptions().find(opt => opt.id === defaultProfile);

  if (isLoading) {
    return (
      <div style={{
        padding: '1rem',
        textAlign: 'center',
        color: '#666'
      }}>
        Cargando perfiles...
      </div>
    );
  }

  return (
    <div style={style} className={className}>
      {showTitle && (
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: '1rem',
          color: '#333'
        }}>
          🎯 Perfil por Defecto
        </h3>
      )}
      
      <div style={{ position: 'relative' }}>
        {/* Botón selector */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>
              {currentProfile?.icon}
            </span>
            <span>{currentProfile?.name}</span>
            {currentProfile?.hasProfile && (
              <span style={{
                fontSize: '0.75rem',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px'
              }}>
                ✓
              </span>
            )}
          </div>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            style={{ fontSize: '1.25rem' }}
          >
            ▼
          </motion.span>
        </motion.button>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.5rem',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                overflow: 'hidden'
              }}
            >
              {getProfileOptions().map((option) => (
                <motion.button
                  key={option.id}
                  whileHover={{ backgroundColor: '#f3f4f6' }}
                  onClick={() => handleProfileSelect(option.id)}
                  disabled={!option.available}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: option.id === defaultProfile ? '#f3f4f6' : 'transparent',
                    border: 'none',
                    cursor: option.available ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem',
                    color: option.available ? '#374151' : '#9ca3af',
                    transition: 'all 0.2s ease',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>
                      {option.icon}
                    </span>
                    <span>{option.name}</span>
                    {option.hasProfile && (
                      <span style={{
                        fontSize: '0.7rem',
                        background: '#10b981',
                        color: 'white',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}>
                        ✓
                      </span>
                    )}
                    {!option.available && (
                      <span style={{
                        fontSize: '0.7rem',
                        background: '#fbbf24',
                        color: 'white',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}>
                        Próximamente
                      </span>
                    )}
                  </div>
                  {option.id === defaultProfile && (
                    <span style={{ color: '#667eea', fontWeight: '600' }}>
                      ●
                    </span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Información adicional */}
      <div style={{
        marginTop: '0.75rem',
        padding: '0.75rem',
        background: '#f8fafc',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#64748b'
      }}>
        <p style={{ margin: 0, lineHeight: 1.4 }}>
          <strong>💡 Tip:</strong> El perfil por defecto determina a dónde te llevan los botones de navegación. 
          Puedes cambiarlo en cualquier momento.
        </p>
      </div>
    </div>
  );
}
