import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
      : false; // Por defecto, siempre es editable a menos que se especifique explícitamente

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
    if (!allowedIds || allowedIds.length === 0) {
      console.log('[RitmosChips] No hay allowedIds, mostrando todos los ritmos');
      return RITMOS_CATALOG;
    }
    
    console.log('[RitmosChips] Filtrando catálogo con allowedIds:', allowedIds);
    const filtered = RITMOS_CATALOG.map((g) => ({
      ...g,
      items: g.items.filter((i) => allowedIds.includes(i.id)),
    })).filter((g) => g.items.length > 0);
    
    console.log('[RitmosChips] Resultado del filtro:', {
      totalGrupos: filtered.length,
      totalItems: filtered.reduce((sum, g) => sum + g.items.length, 0),
      grupos: filtered.map(g => ({ id: g.id, label: g.label, items: g.items.length }))
    });
    
    // Si después de filtrar no hay coincidencias, mostrar todos (fallback)
    if (filtered.length === 0) {
      console.warn('[RitmosChips] No se encontraron coincidencias con allowedIds:', allowedIds, '- Mostrando todos los ritmos');
      return RITMOS_CATALOG;
    }
    
    return filtered;
  }, [allowedIds]);

  // Log para debug (comentado para producción)
  // React.useEffect(() => {
  //   console.log('[RitmosChips] Renderizado:', {
  //     selected: selected,
  //     allowedIds: allowedIds,
  //     filteredCatalogGroups: filteredCatalog.length,
  //     filteredCatalogItems: filteredCatalog.reduce((sum, g) => sum + g.items.length, 0),
  //     isReadOnly: isReadOnly
  //   });
  // }, [selected, allowedIds, filteredCatalog, isReadOnly]);

  const autoExpanded = React.useMemo(() => {
    if (!isReadOnly) return null;
    return filteredCatalog.find((g) => g.items.some((i) => selected.includes(i.id)))?.id || null;
  }, [isReadOnly, selected, filteredCatalog]);

  const [expanded, setExpanded] = React.useState<string | null>(autoExpanded || null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const rafIdRef = React.useRef<number | null>(null);

  const updateDropdownPosition = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = typeof window !== 'undefined' ? window.innerWidth : rect.width;
    const margin = 8;
    const desiredWidth = Math.min(rect.width, Math.max(0, vw - margin * 2));
    let left = rect.left;
    if (left + desiredWidth > vw - margin) left = vw - margin - desiredWidth;
    if (left < margin) left = margin;

    // Si estamos muy abajo, intentar abrir hacia arriba (maxHeight aprox = 400)
    const maxH = 400;
    const vh = typeof window !== 'undefined' ? window.innerHeight : rect.bottom + maxH;
    let top = rect.bottom + margin;
    if (top + maxH > vh - margin) {
      top = Math.max(margin, rect.top - margin - maxH);
    }

    const next = { top, left, width: desiredWidth };
    setDropdownPosition((prev) => {
      if (prev.top === next.top && prev.left === next.left && prev.width === next.width) return prev;
      return next;
    });
  }, []);

  const scheduleDropdownPositionUpdate = React.useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      updateDropdownPosition();
    });
  }, [updateDropdownPosition]);

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

  const selectedCategoryGroup = React.useMemo(() => {
    if (!selectedCategory) return null;
    return filteredCatalog.find((g) => g.id === selectedCategory) || null;
  }, [selectedCategory, filteredCatalog]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // No cerrar el dropdown, solo cambiar a la vista de ritmos anidados
  };

  // Calcular posición del dropdown cuando se abre
  React.useEffect(() => {
    if (isDropdownOpen && triggerRef.current) {
      // Calcular inmediatamente al abrir para evitar “salto” a (0,0)
      updateDropdownPosition();
      window.addEventListener('scroll', scheduleDropdownPositionUpdate, true);
      window.addEventListener('resize', scheduleDropdownPositionUpdate);
      
      return () => {
        window.removeEventListener('scroll', scheduleDropdownPositionUpdate, true);
        window.removeEventListener('resize', scheduleDropdownPositionUpdate);
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      };
    }
  }, [isDropdownOpen, scheduleDropdownPositionUpdate]);

  // Cerrar dropdown al hacer clic fuera
  React.useEffect(() => {
    if (!isDropdownOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.ritmos-dropdown-container') && !target.closest('.ritmos-dropdown-menu')) {
        setIsDropdownOpen(false);
        setSelectedCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

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
        .ritmos-dropdown-container {
          position: relative;
          width: 100%;
          max-width: 500px;
        }
        .ritmos-dropdown-trigger {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: #fff;
          font-size: ${metrics.groupFont};
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
        }
        .ritmos-dropdown-trigger:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.25);
        }
        .ritmos-dropdown-trigger.open {
          border-color: rgba(245, 87, 108, 0.65);
          background: rgba(245, 87, 108, 0.1);
        }
        .ritmos-dropdown-menu {
          position: fixed;
          background: rgba(15, 23, 42, 1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          z-index: 999999;
          max-height: 400px;
          overflow-y: auto;
          overflow-x: hidden;
          color: #fff;
        }
        .ritmos-dropdown-menu::-webkit-scrollbar {
          width: 6px;
        }
        .ritmos-dropdown-menu::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .ritmos-dropdown-menu::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .ritmos-dropdown-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .ritmos-category-item {
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #fff;
        }
        .ritmos-category-item:last-child {
          border-bottom: none;
        }
        .ritmos-category-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .ritmos-category-item.selected {
          background: rgba(245, 87, 108, 0.15);
          border-left: 3px solid rgba(245, 87, 108, 0.65);
        }
        .ritmos-ritmos-list {
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.2);
        }
        .ritmos-ritmo-item {
          padding: 0.6rem 0.75rem;
          margin: 0.25rem 0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .ritmos-ritmo-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .ritmos-ritmo-item.selected {
          background: rgba(245, 87, 108, 0.2);
          border-color: rgba(245, 87, 108, 0.65);
        }
        .ritmos-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .ritmos-ritmo-item.selected .ritmos-checkbox {
          background: rgba(245, 87, 108, 0.8);
          border-color: rgba(245, 87, 108, 1);
        }
        .ritmos-checkbox::after {
          content: '✓';
          color: #fff;
          font-size: 12px;
          font-weight: 900;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .ritmos-ritmo-item.selected .ritmos-checkbox::after {
          opacity: 1;
        }
        @media (max-width: 768px) {
          .ritmos-dropdown-container {
            max-width: 100%;
          }
          .ritmos-dropdown-trigger {
            padding: 0.65rem 0.9rem;
            font-size: 0.85rem;
          }
          .ritmos-category-item {
            padding: 0.65rem 0.9rem;
            font-size: 0.85rem;
          }
          .ritmos-ritmo-item {
            padding: 0.5rem 0.65rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
      <div className="ritmos-dropdown-container" style={{ display: 'block', visibility: 'visible' }}>
        <button
          ref={triggerRef}
          type="button"
          className={`ritmos-dropdown-trigger ${isDropdownOpen ? 'open' : ''}`}
          onClick={() => {
            if (!isDropdownOpen) {
              // Calcular posición ANTES de abrir (evita render inicial desalineado)
              updateDropdownPosition();
              setIsDropdownOpen(true);
              return;
            }
            setIsDropdownOpen(false);
            setSelectedCategory(null);
          }}
          style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
        >
          <span>
            {selectedCategoryGroup
              ? `🎵 ${selectedCategoryGroup.label}`
              : 'Selecciona una categoría de ritmos'}
          </span>
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            {isDropdownOpen ? '▾' : '▸'}
          </span>
        </button>

        {typeof document !== 'undefined' && document.body && createPortal(
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                className="ritmos-dropdown-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`,
                }}
              >
            {!selectedCategory ? (
              // Mostrar categorías primero
              filteredCatalog.map((group) => {
                const hasActive = groupHasActive(group.id);
                return (
                  <div
                    key={group.id}
                    className={`ritmos-category-item ${hasActive ? 'selected' : ''}`}
                    onClick={() => handleCategorySelect(group.id)}
                  >
                    <span>
                      🎵 {group.label}
                      {hasActive && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
                          ({group.items.filter((i) => selected.includes(i.id)).length} seleccionados)
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>▸</span>
                  </div>
                );
              })
            ) : (
              // Mostrar ritmos de la categoría seleccionada
              selectedCategoryGroup && (
                <div>
                  <div
                    className="ritmos-category-item"
                    onClick={() => setSelectedCategory(null)}
                    style={{
                      background: 'rgba(245, 87, 108, 0.1)',
                      borderLeft: '3px solid rgba(245, 87, 108, 0.65)',
                      fontWeight: 600,
                    }}
                  >
                    <span>← Volver a categorías</span>
                  </div>
                  <div className="ritmos-ritmos-list">
                    {selectedCategoryGroup.items.map((ritmo) => {
                      const isSelected = selected.includes(ritmo.id);
                      return (
                        <div
                          key={ritmo.id}
                          className={`ritmos-ritmo-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleChild(ritmo.id)}
                        >
                          <div className="ritmos-checkbox" />
                          <span>{ritmo.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Mostrar ritmos seleccionados como chips debajo del dropdown */}
        {selected.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {filteredCatalog.flatMap((g) => g.items)
              .filter((r) => selected.includes(r.id))
              .map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 18px',
                    borderRadius: 999,
                    background: 'rgba(245, 87, 108, 0.18)',
                    border: '1px solid rgba(245, 87, 108, 0.6)',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    boxShadow: '0 6px 16px rgba(245,87,108,0.25)',
                  }}
                >
                  <span>🎵 {r.label}</span>
                    <button
                    type="button"
                    onClick={() => toggleChild(r.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.9)',
                      cursor: 'pointer',
                      padding: '0 0.25rem',
                      fontSize: '0.9rem',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function RitmosChips(props: Props) {
  return <RitrosChipsInternal {...props} />;
}

