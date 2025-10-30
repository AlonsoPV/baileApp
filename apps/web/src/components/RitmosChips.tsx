import React from 'react';
import { motion } from 'framer-motion';
import { RITMOS_CATALOG } from '@/lib/ritmosCatalog';

interface Props {
  selected: string[];
  onChange: (ritmos: string[]) => void;
}

export default function RitmosChips({ selected, onChange }: Props) {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const toggleChild = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(r => r !== id));
    else onChange([...selected, id]);
  };

  const groupHasActive = (groupId: string) => {
    const g = RITMOS_CATALOG.find(x => x.id === groupId);
    if (!g) return false;
    return g.items.some(i => selected.includes(i.id));
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Chips padre */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {RITMOS_CATALOG.map(group => {
          const isOpen = expanded === group.id;
          const active = groupHasActive(group.id);
          return (
            <button
              key={group.id}
              onClick={() => setExpanded(prev => prev === group.id ? null : group.id)}
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: isOpen || active ? '2px solid rgba(240,147,251,0.6)' : '1px solid rgba(255,255,255,0.15)',
                background: isOpen || active ? 'rgba(240,147,251,0.15)' : 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.95)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {group.label}
            </button>
          );
        })}
      </div>

      {/* Chips hijas del grupo expandido */}
      {expanded && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
          borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10
        }}>
          {RITMOS_CATALOG.find(g => g.id === expanded)?.items.map(r => {
            const isActive = selected.includes(r.id);
            return (
              <motion.button
                key={r.id}
                onClick={() => toggleChild(r.id)}
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
      )}
    </div>
  );
}


