import React from 'react';
import { TagChip } from './TagChip';

interface TagMultiSelectProps {
  options: { id: number; label: string }[];
  value: number[];
  onChange: (ids: number[]) => void;
  variant?: 'ritmo' | 'zona';
  color?: 'blue' | 'yellow' | 'red' | 'orange';
}

export function TagMultiSelect({ options, value, onChange, variant, color }: TagMultiSelectProps) {
  const toggleTag = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {options.map(option => (
        <TagChip
          key={option.id}
          label={option.label}
          variant={variant}
          color={color}
          active={value.includes(option.id)}
          onClick={() => toggleTag(option.id)}
        />
      ))}
    </div>
  );
}
