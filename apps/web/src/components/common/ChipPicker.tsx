import React from "react";
import { motion } from "framer-motion";
import { useTags } from "../../hooks/useTags";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface ChipPickerProps {
  tipo: 'ritmo' | 'zona';
  selected: number[];
  onChange: (selected: number[]) => void;
  label?: string;
  placeholder?: string;
  maxSelections?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function ChipPicker({
  tipo,
  selected,
  onChange,
  label,
  placeholder,
  maxSelections,
  style,
  className
}: ChipPickerProps) {
  const { data: tags } = useTags(tipo);
  const items = tags || [];

  const toggleSelection = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter(item => item !== id));
    } else {
      if (maxSelections && selected.length >= maxSelections) {
        return; // No agregar si ya se alcanzó el máximo
      }
      onChange([...selected, id]);
    }
  };

  const isSelected = (id: number) => selected.includes(id);
  const canSelect = !maxSelections || selected.length < maxSelections;

  return (
    <div style={{ ...style }} className={className}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '12px',
          fontWeight: '600',
          color: colors.light,
        }}>
          {label}
          {maxSelections && (
            <span style={{ 
              fontSize: '0.9rem', 
              fontWeight: '400', 
              opacity: 0.7,
              marginLeft: '8px'
            }}>
              ({selected.length}/{maxSelections})
            </span>
          )}
        </label>
      )}

      {items.length === 0 && placeholder && (
        <p style={{
          color: colors.light,
          opacity: 0.6,
          fontSize: '0.9rem',
          marginBottom: '12px'
        }}>
          {placeholder}
        </p>
      )}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {items.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleSelection(item.id)}
            disabled={!isSelected(item.id) && !canSelect}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: isSelected(item.id)
                ? `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`
                : `${colors.dark}cc`,
              border: `2px solid ${isSelected(item.id) ? colors.coral : `${colors.light}33`}`,
              color: colors.light,
              fontSize: '0.875rem',
              fontWeight: '700',
              cursor: canSelect || isSelected(item.id) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              opacity: !canSelect && !isSelected(item.id) ? 0.5 : 1,
            }}
          >
            {tipo === 'ritmo' ? '🎵' : '📍'} {item.nombre}
          </motion.button>
        ))}
      </div>

      {selected.length > 0 && (
        <div style={{
          marginTop: '12px',
          fontSize: '0.875rem',
          color: colors.light,
          opacity: 0.7,
        }}>
          Seleccionados: {selected.length}
          {maxSelections && ` de ${maxSelections} máximo`}
        </div>
      )}
    </div>
  );
}
