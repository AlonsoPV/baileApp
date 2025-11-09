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

const baseColors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  purple: '#8B5CF6',
  dark: '#121212',
  light: '#F5F5F5',
};

const variantColors = {
  ritmo: baseColors.coral,
  zona: baseColors.blue,
  perfil: baseColors.purple,
  custom: baseColors.orange,
};

export function Chip({ label, icon, variant = 'custom', color, onClick, active, style }: ChipProps) {
  const chipColor = color || variantColors[variant];
  const isZona = variant === 'zona';

  const baseStyles: React.CSSProperties = isZona
    ? {
        padding: '8px 14px',
        borderRadius: 999,
        background: active ? 'rgba(76, 173, 255, 0.18)' : 'rgba(255,255,255,0.06)',
        border: active ? '1px solid rgba(76, 173, 255, 0.6)' : '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.9)',
        fontWeight: 600,
        fontSize: '0.85rem',
        boxShadow: active ? '0 6px 16px rgba(76,173,255,0.25)' : 'none',
      }
    : {
        padding: '10px 18px',
        borderRadius: 20,
        background: active
          ? `linear-gradient(135deg, ${chipColor}ee, ${chipColor}cc)`
          : `${chipColor}1A`,
        border: `2px solid ${active ? chipColor : `${chipColor}55`}`,
        color: active ? baseColors.light : chipColor,
        boxShadow: active
          ? `0 4px 16px ${chipColor}55, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
          : `0 2px 8px ${chipColor}33`,
      };

  return (
    <motion.div
      whileHover={{
        scale: 1.05,
        boxShadow: isZona
          ? '0 6px 18px rgba(76,173,255,0.22)'
          : active
          ? `0 0 20px ${chipColor}99`
          : `0 0 15px ${chipColor}66`,
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        userSelect: 'none',
        fontWeight: active ? '700' : '600',
        fontSize: '0.875rem',
        ...baseStyles,
        ...style,
      }}
    >
      {icon && <span style={{ fontSize: '1.05em' }}>{icon}</span>}
      <span>{label}</span>
      {!isZona && active && (
        <motion.span
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.3, type: 'spring' }}
          style={{
            fontSize: '0.75em',
            marginLeft: '2px',
          }}
        >
          ✓
        </motion.span>
      )}
    </motion.div>
  );
}
