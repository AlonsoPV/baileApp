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

type RSVPStatus = 'voy' | 'interesado' | 'no_voy' | null;

interface RSVPButtonsProps {
  currentStatus?: RSVPStatus;
  onStatusChange: (status: RSVPStatus) => void;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
}

export default function RSVPButtons({
  currentStatus,
  onStatusChange,
  style,
  className,
  disabled = false
}: RSVPButtonsProps) {
  const buttons = [
    {
      status: 'voy' as RSVPStatus,
      label: 'Voy',
      icon: '✅',
      color: colors.blue,
      gradient: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
    },
    {
      status: 'interesado' as RSVPStatus,
      label: 'Me interesa',
      icon: '👀',
      color: colors.orange,
      gradient: `linear-gradient(135deg, ${colors.orange}, ${colors.yellow})`
    },
    {
      status: 'no_voy' as RSVPStatus,
      label: 'No voy',
      icon: '❌',
      color: colors.coral,
      gradient: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`
    }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      ...style
    }} className={className}>
      {buttons.map((button) => {
        const isSelected = currentStatus === button.status;
        const isDisabled = disabled;

        return (
          <motion.button
            key={button.status}
            whileHover={!isDisabled ? { scale: 1.05 } : {}}
            whileTap={!isDisabled ? { scale: 0.95 } : {}}
            onClick={() => !isDisabled && onStatusChange(button.status)}
            disabled={isDisabled}
            style={{
              padding: '12px 20px',
              borderRadius: '25px',
              border: 'none',
              background: isSelected 
                ? button.gradient 
                : isDisabled 
                  ? `${colors.light}33`
                  : `${colors.dark}66`,
              color: isDisabled ? `${colors.light}66` : colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isSelected 
                ? `0 4px 12px ${button.color}33`
                : '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              opacity: isDisabled ? 0.5 : 1,
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>
              {button.icon}
            </span>
            <span>{button.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
