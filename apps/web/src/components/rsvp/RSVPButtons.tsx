import React from "react";
import { motion } from "framer-motion";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

type RSVPStatus = 'interesado' | null;

interface RSVPButtonsProps {
  currentStatus?: RSVPStatus;
  onStatusChange: (status: RSVPStatus) => void;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  interestedCount?: number;
}

export default function RSVPButtons({
  currentStatus,
  onStatusChange,
  style,
  className,
  disabled = false,
  interestedCount
}: RSVPButtonsProps) {
  const isInterested = currentStatus === 'interesado';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      ...style
    }} className={className}>
      <motion.button
        whileHover={!disabled ? { 
          scale: 1.05,
          boxShadow: '0 8px 25px rgba(255, 140, 66, 0.4)'
        } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={() => !disabled && onStatusChange(isInterested ? null : 'interesado')}
        disabled={disabled}
        style={{
          padding: '16px 32px',
          borderRadius: '30px',
          background: isInterested 
            ? 'linear-gradient(135deg, #FF8C42, #FFD166)'
            : 'linear-gradient(135deg, rgba(255, 140, 66, 0.2), rgba(255, 209, 102, 0.1))',
          color: colors.light,
          fontSize: '1.1rem',
          fontWeight: '800',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: isInterested 
            ? '0 8px 25px rgba(255, 140, 66, 0.4)'
            : '0 4px 15px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: disabled ? 0.5 : 1,
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          border: isInterested 
            ? '2px solid rgba(255, 140, 66, 0.5)'
            : '2px solid rgba(255, 140, 66, 0.2)',
        }}
      >
        {/* Efecto de brillo en hover */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
          transition: 'left 0.6s ease',
          zIndex: 1
        }} />
        
        <span style={{ 
          fontSize: '1.3rem',
          position: 'relative',
          zIndex: 2
        }}>
          {isInterested ? '❤️' : '👀'}
        </span>
        <span style={{ 
          position: 'relative',
          zIndex: 2
        }}>
          {isInterested ? 'Me interesa' : 'Me interesa'}
        </span>
        
        {/* Indicador de estado */}
        {isInterested && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF3D57, #FF8C42)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              boxShadow: '0 2px 8px rgba(255, 61, 87, 0.4)',
              zIndex: 3
            }}
          >
            ✓
          </motion.div>
        )}
      </motion.button>

      {typeof interestedCount === 'number' && (
        <div style={{ display: 'flex', justifyContent: 'center', marginLeft: 12 }}>
          <div
            aria-live="polite"
            style={{
              padding: '.5rem .85rem',
              borderRadius: 999,
              fontWeight: 900,
              fontSize: '.95rem',
              background: 'linear-gradient(135deg, rgba(30,136,229,.28), rgba(0,188,212,.28))',
              border: '1px solid rgba(30,136,229,.45)',
              color: '#fff',
              boxShadow: '0 8px 22px rgba(30,136,229,.30)'
            }}
          >
            👥 {interestedCount} interesado{interestedCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
