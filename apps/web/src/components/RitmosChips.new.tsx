import React from 'react';
import { motion } from 'framer-motion';
import { RITMOS_CATALOG } from '@/lib/ritmosCatalog';

interface Props {
  selected: string[];
  onChange: (ritmos: string[]) => void;
  allowedIds?: string[];
  readOnly?: boolean;
  size?: 'default' | 'compact';
}

function RitrosChipsInternal({
  selected,
  onChange,
  allowedIds,
  readOnly,
  size = 'default',
}: Props) {
  const isReadOnly =
    readOnly !== undefined
      ? readOnly
      : (() => {
          const fnStr = onChange.toString().replace(/\s/g, '');
          return fnStr === '()=>{}' || fnStr.includes('()=>{}') || fnStr === '()=>{}' || onChange.name === '';
        })();

  const metrics =
    size === 'compact'
      ? {
          gap: '0.55rem',
          groupFont: '0.78rem',
          groupPadding: '8px 14px',
          childFont: '0.72rem',
          childPadding: '6px 12px',
          readOnlyFont: '0.78rem',
          readOnlyPadding: '8px 14px',
        }
      : {
          gap: '0.85rem',
          groupFont: '0.875rem',
          groupPadding: '10px 18px',
          childFont: '0.8rem',
          childPadding: '8px 14px',
          readOnlyFont: '0.875rem',
          readOnlyPadding: '10px 18px',
        };

  const filteredCatalog = React.useMemo(() => {
    if (!allowedIds || allowedIds.length === 0) return RITMOS_CATALOG;
    return RITMOS_CATALOG.map((g) => ({
      ...g,
      items: g.items.filter((i) => allowedIds.includes(i.id)),
    })).filter((g) => g.items.length > 0);
  }, [allowedIds]);

  const autoExpanded = React.useMemo(() => {
    if (!isReadOnly) return null;
    return filteredCatalog.find((g) => g.items.some((i) => selected.includes(i.id)))?.id || null;
  }, [isReadOnly, selected, filteredCatalog]);

  const [expanded, setExpanded] = React.useState<string | null>(autoExpanded || null);

  React.useEffect(() => {
    if (isReadOnly && autoExpanded) {
      setExpanded(autoExpanded);
    }
  }, [isReadOnly, autoExpanded]);

  const toggleChild = (id: string) => {
    if (isReadOnly) return;
    if (selected.includes(id)) onChange(selected.filter((r) => r !== id));
    else onChange([...selected, id]);
  };

  const groupHasActive = (groupId: string) => {
    const g = filteredCatalog.find((x) => x.id === groupId);
    if (!g) return false;
    return g.items.some((i) => selected.includes(i.id));
  };

  if (isReadOnly) {
    const baseItems = filteredCatalog.flatMap((g) => g.items);
    const allSelectedItems = baseItems.filter((r) => selected.includes(r.id));
    if (allSelectedItems.length === 0) return null;

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: metrics.gap }}>
        {allSelectedItems.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: '0.3s',
              backdropFilter: 'blur(10px)',
              userSelect: 'none',
              fontWeight: 700,
              fontSize: metrics.readOnlyFont,
              padding: metrics.readOnlyPadding,
              borderRadius: 999,
              background: 'rgba(245, 87, 108, 0.2)',
              border: '1px solid rgba(245, 87, 108, 0.65)',
              color: '#FFE4EE',
              boxShadow: 'rgba(245,87,108,0.3) 0px 4px 16px, rgba(255,255,255,0.2) 0px 1px 0px inset',
              alignSelf: 'flex-start',
              width: 'fit-content',
              minWidth: 'auto',
              justifyContent: 'center',
              paddingInline: '1rem',
              transform: 'none',
            }}
          >
            <span>{r.label}</span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: metrics.gap,
        alignItems: 'flex-start',
      }}
    >
      {filteredCatalog.map((group) => {
        const isOpen = expanded === group.id;
        const active = groupHasActive(group.id);
        return (
          <div
            key={group.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              alignItems: 'flex-start',
              minWidth: 'fit-content',
            }}
          >
            <button
              type="button"
              onClick={() => setExpanded((prev) => (prev === group.id ? null : group.id))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: '0.3s',
                backdropFilter: 'blur(10px)',
                userSelect: 'none',
                fontWeight: 700,
                fontSize: metrics.groupFont,
                padding: metrics.groupPadding,
                borderRadius: 999,
                background: isOpen || active ? 'rgba(245, 87, 108, 0.2)' : 'rgba(255,255,255,0.04)',
                border: isOpen || active ? '1px solid rgba(245, 87, 108, 0.65)' : '1px solid rgba(255,255,255,0.12)',
                color: isOpen || active ? '#FFE4EE' : 'rgba(255,255,255,0.85)',
                boxShadow: isOpen || active
                  ? 'rgba(245,87,108,0.35) 0px 4px 14px, rgba(255,255,255,0.15) 0px 1px 0px inset'
                  : 'rgba(0,0,0,0.35) 0px 3px 10px',
                alignSelf: 'flex-start',
                width: 'fit-content',
                minWidth: 'auto',
                justifyContent: 'center',
                paddingInline: '1rem',
                transform: 'none',
              }}
            >
              {group.label}
            </button>

            {isOpen && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingTop: 10,
                  width: '100%',
                }}
              >
                {group.items.map((r) => {
                  const isActive = selected.includes(r.id);
                  return (
                    <motion.button
                      key={r.id}
                      type="button"
                      onClick={() => toggleChild(r.id)}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        transition: '0.3s',
                        backdropFilter: 'blur(10px)',
                        userSelect: 'none',
                        fontWeight: 700,
                        fontSize: metrics.childFont,
                        padding: metrics.childPadding,
                        borderRadius: 999,
                        background: isActive ? 'rgba(245, 87, 108, 0.2)' : 'rgba(255,255,255,0.03)',
                        border: isActive ? '1px solid rgba(245, 87, 108, 0.65)' : '1px solid rgba(255,255,255,0.1)',
                        color: isActive ? '#FFE4EE' : 'rgba(255,255,255,0.72)',
                        boxShadow: isActive
                          ? 'rgba(245,87,108,0.3) 0px 3px 10px'
                          : 'rgba(0,0,0,0.25) 0px 2px 8px',
                        alignSelf: 'flex-start',
                        minWidth: 'auto',
                        justifyContent: 'center',
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
      })}
    </div>
  );
}

export default function RitmosChips(props: Props) {
  return <RitrosChipsInternal {...props} />;
}

