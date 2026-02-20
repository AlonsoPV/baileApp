import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { RSVPStatus } from "../../hooks/useRSVP";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface RSVPButtonsProps {
  currentStatus?: RSVPStatus | null;
  onStatusChange: (status: RSVPStatus | null) => void;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  interestedCount?: number;
}

const buttonBase = {
  padding: '16px 32px',
  borderRadius: '30px',
  fontSize: '1.1rem',
  fontWeight: '800',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative' as const,
  overflow: 'hidden' as const,
  backdropFilter: 'blur(10px)',
  width: '100%',
  maxWidth: '300px',
  justifyContent: 'center' as const,
};

export default function RSVPButtons({
  currentStatus,
  onStatusChange,
  style,
  className,
  disabled = false,
  interestedCount
}: RSVPButtonsProps) {
  const { t } = useTranslation();
  const isInterested = currentStatus === 'interesado';
  const isGoing = currentStatus === 'going';
  const hasAnyStatus = isInterested || isGoing;

  const handleInterested = () => {
    if (disabled) return;
    onStatusChange(isInterested ? null : 'interesado');
  };

  const handleGoing = () => {
    if (disabled) return;
    onStatusChange(isGoing ? null : 'going');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '15px',
      ...style
    }} className={className}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: 300 }}>
        {/* Me interesa */}
        <motion.button
          whileHover={!disabled ? { scale: 1.02, boxShadow: '0 8px 25px rgba(255, 140, 66, 0.4)' } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          onClick={handleInterested}
          disabled={disabled}
          style={{
            ...buttonBase,
            background: isInterested
              ? 'linear-gradient(135deg, #FF8C42, #FFD166)'
              : 'linear-gradient(135deg, rgba(255, 140, 66, 0.2), rgba(255, 209, 102, 0.1))',
            color: colors.light,
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: isInterested ? '0 8px 25px rgba(255, 140, 66, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.3)',
            opacity: disabled ? 0.5 : 1,
            border: isInterested ? '2px solid rgba(255, 140, 66, 0.5)' : '2px solid rgba(255, 140, 66, 0.2)',
          }}
        >
          <span style={{ fontSize: '1.2rem', zIndex: 2 }}>{isInterested ? '❤️' : '👀'}</span>
          <span style={{ zIndex: 2 }}>{isInterested ? t('not_interested') : t('interested')}</span>
          {isInterested && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF3D57, #FF8C42)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                zIndex: 3,
              }}
            >
              ✓
            </motion.div>
          )}
        </motion.button>

        {/* Asistiré / RSVP */}
        <motion.button
          whileHover={!disabled ? { scale: 1.02, boxShadow: '0 8px 25px rgba(30, 136, 229, 0.4)' } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          onClick={handleGoing}
          disabled={disabled}
          style={{
            ...buttonBase,
            background: isGoing
              ? 'linear-gradient(135deg, #1E88E5, #42A5F5)'
              : 'linear-gradient(135deg, rgba(30, 136, 229, 0.2), rgba(66, 165, 245, 0.1))',
            color: colors.light,
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: isGoing ? '0 8px 25px rgba(30, 136, 229, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.3)',
            opacity: disabled ? 0.5 : 1,
            border: isGoing ? '2px solid rgba(30, 136, 229, 0.5)' : '2px solid rgba(30, 136, 229, 0.2)',
          }}
        >
          <span style={{ fontSize: '1.2rem', zIndex: 2 }}>{isGoing ? '✅' : '📅'}</span>
          <span style={{ zIndex: 2 }}>{isGoing ? t('not_going') : t('going')}</span>
          {isGoing && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1E88E5, #42A5F5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                zIndex: 3,
              }}
            >
              ✓
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Contador de interesados + asistentes */}
      {typeof interestedCount === 'number' && interestedCount >= 0 && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{
              padding: '.5rem .85rem',
              borderRadius: 999,
              fontWeight: 900,
              fontSize: '.95rem',
              background: 'linear-gradient(135deg, rgba(30,136,229,.28), rgba(0,188,212,.28))',
              border: '1px solid rgba(30,136,229,.45)',
              color: '#fff',
              boxShadow: '0 8px 22px rgba(30,136,229,.30)',
              transition: 'all 0.2s ease'
            }}
          >
            👥 {interestedCount} {interestedCount !== 1 ? t('interested_plural') : t('interested_singular')}
          </div>
        </div>
      )}
    </div>
  );
}
