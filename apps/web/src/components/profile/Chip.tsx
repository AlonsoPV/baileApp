import { motion } from 'framer-motion';

interface ChipProps {
  label: string;
  icon?: string;
  variant?: 'ritmo' | 'zona' | 'custom';
  color?: string;
  onClick?: () => void;
  active?: boolean;
}

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

const variantColors = {
  ritmo: colors.coral,
  zona: colors.yellow,
  custom: colors.blue,
};

export function Chip({ label, icon, variant = 'custom', color, onClick, active }: ChipProps) {
  const chipColor = color || variantColors[variant];
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.05, 
        boxShadow: `0 0 15px ${chipColor}88`,
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '20px',
        background: active ? chipColor : `${chipColor}33`,
        border: `1px solid ${chipColor}`,
        color: active ? colors.light : chipColor,
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(10px)',
        userSelect: 'none',
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </motion.div>
  );
}
