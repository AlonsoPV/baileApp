import React from 'react';
import { motion } from 'framer-motion';
import { RITMOS_CATALOG } from '@/lib/ritmosCatalog';

interface Props {
  selected: string[];
  onChange: (ritmos: string[]) => void;
  allowedIds?: string[]; // opcional: restringe qué ritmos se muestran/pueden elegirse
  readOnly?: boolean; // opcional: modo solo lectura explícito
}

function RitrosChipsInternal({ selected, onChange, allowedIds, readOnly }: Props) {
  // Detectar modo solo lectura: función vacía o prop explícita
  const isReadOnly = readOnly !== undefined 
    ? readOnly 
    : (() => {
        const fnStr = onChange.toString().replace(/\s/g, '');
        return fnStr === '()=>{}' || fnStr.includes('()=>{}') || fnStr === '()=>{}' || onChange.name === '';
      })();
  // En modo solo lectura, expandir automáticamente todos los grupos que tienen ritmos seleccionados
  const autoExpanded = React.useMemo(() => {
    if (!isReadOnly) return null;
    return filteredCatalog.find(g => g.items.some(i => selected.includes(i.id)))?.id || null;
  }, [isReadOnly, selected]);
  
  const [expanded, setExpanded] = React.useState<string | null>(autoExpanded || null);

  React.useEffect(() => {
    if (isReadOnly && autoExpanded) {
      setExpanded(autoExpanded);
    }
  }, [isReadOnly, autoExpanded]);

  const toggleChild = (id: string) => {
    if (isReadOnly) return; // No hacer nada en modo solo lectura
    if (selected.includes(id)) onChange(selected.filter(r => r !== id));
    else onChange([...selected, id]);
  };

  const groupHasActive = (groupId: string) => {
    const g = filteredCatalog.find(x => x.id === groupId);
    if (!g) return false;
    return g.items.some(i => selected.includes(i.id));
  };

  // Catálogo filtrado por allowedIds (si se provee)
  const filteredCatalog = React.useMemo(() => {
    if (!allowedIds || allowedIds.length === 0) return RITMOS_CATALOG;
    return RITMOS_CATALOG.map(g => ({
      ...g,
      items: g.items.filter(i => allowedIds.includes(i.id))
    })).filter(g => g.items.length > 0);
  }, [allowedIds]);

  // En modo solo lectura, mostrar todos los ritmos seleccionados directamente
  if (isReadOnly) {
    const baseItems = filteredCatalog.flatMap(g => g.items);
    const allSelectedItems = baseItems.filter(r => selected.includes(r.id));
    if (allSelectedItems.length === 0) return null;
    
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {allSelectedItems.map(r => {
          const group = filteredCatalog.find(g => g.items.some(i => i.id === r.id));
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: '1px solid rgba(240,147,251,0.4)',
                background: 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(245,87,108,0.2))',
                color: '#f093fb',
                fontSize: 14,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(240,147,251,0.3)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {group && <span style={{ fontSize: 12, opacity: 0.8 }}>{group.label}</span>}
              <span>{r.label}</span>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Chips padre */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {filteredCatalog.map(group => {
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
          {filteredCatalog.find(g => g.id === expanded)?.items.map(r => {
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

// Re-export con nombre correcto (para no romper imports existentes)
export default function RitmosChips(props: Props) {
  return <RitrosChipsInternal {...props} />;
}


