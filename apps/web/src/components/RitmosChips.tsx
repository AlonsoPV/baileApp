import React from 'react';
import { motion } from 'framer-motion';
import { RITMOS_CATALOG } from '@/lib/ritmosCatalog';
import { Chip } from './profile/Chip';

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
          wrapperGap: '0.5rem',
          groupFont: '0.78rem',
          groupPadding: '5px 10px',
          childGap: '0.35rem',
          childFont: '0.72rem',
          childPadding: '5px 10px',
          readOnlyFont: '0.78rem',
          readOnlyPadding: '5px 10px',
        }
      : {
          wrapperGap: '0.75rem',
          groupFont: '0.9rem',
          groupPadding: '5px 10px',
          childGap: '0.5rem',
          childFont: '0.82rem',
          childPadding: '5px 10px',
          readOnlyFont: '0.9rem',
          readOnlyPadding: '5px 10px',
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: metrics.wrapperGap }}>
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
              boxShadow: 'rgba(245, 87, 108, 0.3) 0px 4px 16px, rgba(255,255,255,0.2) 0px 1px 0px inset',
              alignSelf: 'flex-start',
              width: 'fit-content',
              minWidth: 'auto',
              justifyContent: 'center',
              transform: 'none',
            }}
          >
            <span>🎵 {r.label}</span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <>
      <style>{`
        .ritmos-chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: ${metrics.wrapperGap};
          align-items: flex-start;
        }
        .ritmos-chips-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          align-items: flex-start;
          min-width: fit-content;
          flex: 0 0 auto;
        }
        .ritmos-chips-children {
          display: flex;
          flex-wrap: wrap;
          gap: ${metrics.childGap};
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 0.4rem;
          width: 100%;
        }
        .ritmos-chips-children button {
          font-size: ${metrics.childFont};
          padding: ${metrics.childPadding};
        }
        @media (max-width: 768px) {
          .ritmos-chips-container {
            gap: 0.5rem;
          }
          .ritmos-chips-group {
            gap: 0.3rem;
            width: 100%;
          }
          .ritmos-chips-children {
            gap: 0.4rem;
            padding-top: 0.3rem;
          }
          .ritmos-chips-children button {
            font-size: 0.7rem;
            padding: 4px 8px;
          }
        }
        @media (max-width: 480px) {
          .ritmos-chips-container {
            gap: 0.4rem;
          }
          .ritmos-chips-group {
            gap: 0.25rem;
          }
          .ritmos-chips-children {
            gap: 0.35rem;
            padding-top: 0.25rem;
          }
          .ritmos-chips-children button {
            font-size: 0.65rem;
            padding: 3px 7px;
          }
        }
      `}</style>
      <div className="ritmos-chips-container">
      {filteredCatalog.map((group) => {
        const isOpen = expanded === group.id;
        const active = groupHasActive(group.id);
        return (
          <div
            key={group.id}
            className="ritmos-chips-group"
          >
            <Chip
              label={`${group.label} ${isOpen ? '▾' : '▸'}`}
              icon="🎵"
              variant="custom"
              active={active || isOpen}
              onClick={() => setExpanded((prev) => (prev === group.id ? null : group.id))}
              style={{
                fontSize: metrics.groupFont,
                alignSelf: 'flex-start',
                width: 'fit-content',
                minWidth: 'auto',
                justifyContent: 'center',
                padding: metrics.groupPadding,
                background: active || isOpen
                  ? 'rgba(245, 87, 108, 0.2)'
                  : 'rgba(255,255,255,0.05)',
                border: active || isOpen
                  ? '1px solid rgba(245, 87, 108, 0.65)'
                  : '1px solid rgba(255,255,255,0.15)',
                borderRadius: 999,
              }}
            />

            {isOpen && (
              <div className="ritmos-chips-children">
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
                        background: isActive
                          ? 'rgba(245, 87, 108, 0.2)'
                          : 'rgba(255,255,255,0.06)',
                        border: isActive
                          ? '1px solid rgba(245, 87, 108, 0.65)'
                          : '1px solid rgba(255,255,255,0.12)',
                        color: isActive ? '#FFE4EE' : '#fff',
                        boxShadow: isActive
                          ? 'rgba(245, 87, 108, 0.3) 0px 3px 10px'
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
    </>
  );
}

export default function RitmosChips(props: Props) {
  return <RitrosChipsInternal {...props} />;
}

