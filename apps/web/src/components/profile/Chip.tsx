import { motion } from 'framer-motion';

interface ChipProps {
  label: string;
  icon?: string;
  variant?: 'ritmo' | 'zona' | 'perfil' | 'custom';
  color?: string;
  onClick?: () => void;
  active?: boolean;
  style?: React.CSSProperties;
}

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  purple: '#8B5CF6',
  dark: '#121212',
  light: '#F5F5F5',
};

const variantColors = {
  ritmo: colors.coral,
  zona: colors.yellow,
  perfil: colors.purple,
  custom: colors.blue,
};

export function Chip({ label, icon, variant = 'custom', color, onClick, active, style }: ChipProps) {
  const chipColor = color || variantColors[variant];
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.05, 
        boxShadow: active 
          ? `0 0 20px ${chipColor}99`
          : `0 0 15px ${chipColor}66`,
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 18px',
        borderRadius: '20px',
        background: active 
          ? `linear-gradient(135deg, ${chipColor}ee, ${chipColor}cc)` 
          : `${chipColor}22`,
        border: `2px solid ${active ? chipColor : `${chipColor}66`}`,
        color: active ? colors.light : chipColor,
        fontSize: '0.875rem',
        fontWeight: active ? '700' : '600',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        userSelect: 'none',
        ...style,
        boxShadow: active 
          ? `0 4px 16px ${chipColor}55, inset 0 1px 0 rgba(255, 255, 255, 0.2)` 
          : `0 2px 8px ${chipColor}33`,
      }}
    >
      {icon && <span style={{ fontSize: '1.1em' }}>{icon}</span>}
      <span>{label}</span>
      {active && (
        <motion.span
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.3, type: 'spring' }}
          style={{ 
            fontSize: '0.75em',
            marginLeft: '2px'
          }}
        >
          ✓
        </motion.span>
      )}
    </motion.div>
  );
}
