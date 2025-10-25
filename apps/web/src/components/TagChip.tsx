import React from 'react';
import { colors, spacing, borderRadius } from '../theme/colors';

interface TagChipProps {
  label: string;
  variant?: 'ritmo' | 'zona';
  color?: 'blue' | 'yellow' | 'red' | 'orange';
  onClick?: () => void;
  active?: boolean;
}

const colorMap = {
  blue: { bg: '#3B82F620', border: '#3B82F640', color: '#3B82F6' },
  yellow: { bg: '#F59E0B20', border: '#F59E0B40', color: '#F59E0B' },
  red: { bg: '#EF444420', border: '#EF444440', color: '#EF4444' },
  orange: { bg: '#F9731620', border: '#F9731640', color: '#F97316' },
};

export function TagChip({ label, variant, color, onClick, active }: TagChipProps) {
  // Determine color scheme
  let colorScheme;
  if (color) {
    colorScheme = colorMap[color];
  } else if (variant === 'ritmo') {
    colorScheme = { bg: 'rgba(30, 136, 229, 0.2)', border: '1px solid rgba(30, 136, 229, 0.4)', color: colors.blue };
  } else if (variant === 'zona') {
    colorScheme = { bg: 'rgba(253, 216, 53, 0.2)', border: '1px solid rgba(253, 216, 53, 0.4)', color: colors.yellow };
  } else {
    colorScheme = colorMap.blue;
  }

  const icon = variant === 'ritmo' ? '🎵' : variant === 'zona' ? '📍' : '';

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        borderRadius: borderRadius.md,
        fontSize: '0.875rem',
        fontWeight: '600',
        background: active ? colorScheme.color : colorScheme.bg,
        border: typeof colorScheme.border === 'string' ? colorScheme.border : `1px solid ${colorScheme.border}`,
        color: active ? '#fff' : colorScheme.color,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        userSelect: 'none',
      }}
    >
      {icon && `${icon} `}{label}
    </span>
  );
}

