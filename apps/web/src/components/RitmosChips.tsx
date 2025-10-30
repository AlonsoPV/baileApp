import React from 'react';
import { motion } from 'framer-motion';
import { RITMOS_CATALOG } from '@/lib/ritmosCatalog';

interface Props {
  selected: string[];
  onChange: (ritmos: string[]) => void;
}

export default function RitmosChips({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(r => r !== id));
    else onChange([...selected, id]);
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {RITMOS_CATALOG.map(group => (
        <div key={group.id}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{group.label}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {group.items.map(r => {
              const isActive = selected.includes(r.id);
              return (
                <motion.button
                  key={r.id}
                  onClick={() => toggle(r.id)}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: `1px solid ${isActive ? '#f093fb' : 'rgba(255,255,255,0.15)'}`,
                    background: isActive ? 'rgba(240,147,251,0.15)' : 'transparent',
                    color: isActive ? '#f093fb' : 'rgba(255,255,255,0.85)',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {r.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}


