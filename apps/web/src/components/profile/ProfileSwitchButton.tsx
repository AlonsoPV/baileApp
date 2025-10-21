import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ProfileSwitchButtonProps {
  currentType: 'bailarin' | 'maestro' | 'organizador' | 'marca';
  onSwitch: (type: 'bailarin' | 'maestro' | 'organizador' | 'marca') => void;
}

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

const profileTypes = [
  { id: 'bailarin' as const, label: 'Bailarín', icon: '💃', color: colors.coral },
  { id: 'maestro' as const, label: 'Maestro', icon: '🎓', color: colors.blue },
  { id: 'organizador' as const, label: 'Organizador', icon: '🎤', color: colors.orange },
  { id: 'marca' as const, label: 'Marca', icon: '🏢', color: colors.yellow },
];

export function ProfileSwitchButton({ currentType, onSwitch }: ProfileSwitchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentProfile = profileTypes.find(p => p.id === currentType) || profileTypes[0];

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
      }}
    >
      {/* Main Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: `linear-gradient(135deg, ${currentProfile.color}, ${colors.coral})`,
          color: colors.light,
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(255,61,87,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {currentProfile.icon}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 10, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              minWidth: '200px',
              borderRadius: '16px',
              background: `${colors.dark}f5`,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              padding: '8px',
              marginTop: '8px',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${colors.light}22`,
                marginBottom: '8px',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: colors.light,
                  opacity: 0.6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Cambiar a
              </p>
            </div>

            {profileTypes.map((type) => (
              <motion.button
                key={type.id}
                whileHover={{ x: 4, backgroundColor: `${type.color}22` }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSwitch(type.id);
                  setIsOpen(false);
                }}
                disabled={type.id === currentType}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: type.id === currentType ? `${type.color}33` : 'transparent',
                  color: colors.light,
                  fontSize: '0.95rem',
                  fontWeight: type.id === currentType ? '600' : '400',
                  cursor: type.id === currentType ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  marginBottom: '4px',
                  opacity: type.id === currentType ? 0.5 : 1,
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{type.icon}</span>
                <span>{type.label}</span>
                {type.id === currentType && (
                  <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>✓</span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
          }}
        />
      )}
    </div>
  );
}
