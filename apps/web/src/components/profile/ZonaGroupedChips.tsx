import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Chip } from "./Chip";
import { useZonaCatalogGroups } from "@/hooks/useZonaCatalogGroups";

type TagLike = { id: number; nombre?: string; slug?: string; tipo?: string };

type Mode = "display" | "edit";

export interface ZonaGroupedChipsProps {
  selectedIds?: Array<number | null | undefined> | null;
  allTags?: TagLike[] | null;
  mode?: Mode;
  onToggle?: (id: number) => void;
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
  autoExpandSelectedParents?: boolean;
  size?: "default" | "compact";
}

function normalizeSelected(selected?: Array<number | null | undefined> | null) {
  return (selected || []).filter((id): id is number => typeof id === "number");
}

const ZonaGroupedChips: React.FC<ZonaGroupedChipsProps> = ({
  selectedIds,
  allTags,
  mode = "display",
  onToggle,
  icon = "📍",
  className,
  style,
  autoExpandSelectedParents = true,
  size = "default",
}) => {
  const normalizedSelected = React.useMemo(
    () => normalizeSelected(selectedIds),
    [selectedIds]
  );
  const selectedSet = React.useMemo(
    () => new Set(normalizedSelected),
    [normalizedSelected]
  );

  const { groups } = useZonaCatalogGroups(allTags);

  const relevantGroups = React.useMemo(() => {
    if (mode === "display") {
      return groups
        .map((group) => {
          const items = group.items.filter((item) => selectedSet.has(item.id));
          return items.length ? { ...group, items } : null;
        })
        .filter(Boolean) as typeof groups;
    }
    return groups;
  }, [groups, mode, selectedSet]);

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (mode === "display") {
      setExpanded((prev) => {
        const next = { ...prev };
        relevantGroups.forEach((group) => {
          const hasSelected = group.items.some((item) => selectedSet.has(item.id));
          if (autoExpandSelectedParents && hasSelected) {
            next[group.id] = true;
          } else if (next[group.id] === undefined) {
            next[group.id] = false;
          }
        });
        return next;
      });
    }
  }, [relevantGroups, selectedSet, autoExpandSelectedParents, mode]);

  if (mode === "display" && relevantGroups.length === 0) {
    return null;
  }

  const toggleGroup = (groupId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [groupId]: !(prev[groupId] ?? false),
    }));
  };

  const handleChipClick = (id: number) => {
    if (mode === "edit" && onToggle) {
      onToggle(id);
    }
  };

  const selectedCategoryGroup = React.useMemo(() => {
    if (!selectedCategory) return null;
    return relevantGroups.find((g) => g.id === selectedCategory) || null;
  }, [selectedCategory, relevantGroups]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // No cerrar el dropdown, solo cambiar a la vista de zonas anidadas
  };

  // Calcular posición del dropdown cuando se abre
  React.useEffect(() => {
    if (isDropdownOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isDropdownOpen]);

  // Cerrar dropdown al hacer clic fuera
  React.useEffect(() => {
    if (!isDropdownOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.zona-dropdown-container') && !target.closest('.zona-dropdown-menu')) {
        setIsDropdownOpen(false);
        setSelectedCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const groupHasActive = (groupId: string) => {
    const g = relevantGroups.find((x) => x.id === groupId);
    if (!g) return false;
    return g.items.some((i) => selectedSet.has(i.id));
  };

  const metrics =
    size === "compact"
      ? {
          wrapperGap: "0.5rem",
          parentFont: "0.78rem",
          parentPadding: "5px 10px",
          childGap: "0.35rem",
          childPadding: "5px 10px",
          childFont: "0.72rem",
        }
      : {
          wrapperGap: "0.75rem",
          parentFont: "0.9rem",
          parentPadding: "5px 10px",
          childGap: "0.5rem",
          childPadding: "5px 10px",
          childFont: "0.82rem",
        };

  // Modo display: mostrar chips simples (sin cambios)
  if (mode === "display") {
    return (
      <>
        <style>{`
          .zona-chips-container {
            display: flex;
            flex-wrap: wrap;
            gap: ${metrics.wrapperGap};
            align-items: flex-start;
          }
          .zona-chips-group {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            align-items: flex-start;
            min-width: fit-content;
            flex: 0 0 auto;
          }
          .zona-chips-children {
            display: flex;
            flex-wrap: wrap;
            gap: ${metrics.childGap};
            border-top: 1px solid rgba(255,255,255,0.08);
            padding-top: 0.4rem;
            width: 100%;
          }
          .zona-chips-children .chip {
            font-size: ${metrics.childFont};
            padding: ${metrics.childPadding};
          }
          @media (max-width: 768px) {
            .zona-chips-container {
              gap: 0.5rem;
            }
            .zona-chips-group {
              gap: 0.3rem;
              width: 100%;
            }
            .zona-chips-children {
              gap: 0.4rem;
              padding-top: 0.3rem;
            }
            .zona-chips-children .chip {
              font-size: 0.7rem;
              padding: 4px 8px;
            }
          }
          @media (max-width: 480px) {
            .zona-chips-container {
              gap: 0.4rem;
            }
            .zona-chips-group {
              gap: 0.25rem;
            }
            .zona-chips-children {
              gap: 0.35rem;
              padding-top: 0.25rem;
            }
            .zona-chips-children .chip {
              font-size: 0.65rem;
              padding: 3px 7px;
            }
          }
        `}</style>
        <div className={className} style={style}>
          <div className="zona-chips-container">
          {relevantGroups.map((group) => {
            const hasSelected = group.items.some((item) =>
              selectedSet.has(item.id)
            );
            const isExpanded = expanded[group.id] ?? false;
            const showChildren = isExpanded;
            return (
              <div
                key={group.id}
                className="zona-chips-group"
              >
                <Chip
                  label={`${group.label} ${isExpanded ? "▾" : "▸"}`}
                  icon={icon}
                  variant="custom"
                  active={hasSelected || isExpanded}
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    fontSize: metrics.parentFont,
                    alignSelf: "flex-start",
                    width: "fit-content",
                    minWidth: "auto",
                    justifyContent: "center",
                    padding: metrics.parentPadding,
                    background:
                      hasSelected || isExpanded
                        ? "rgba(76,173,255,0.18)"
                        : "rgba(255,255,255,0.05)",
                    border:
                      hasSelected || isExpanded
                        ? "1px solid rgba(76,173,255,0.6)"
                        : "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 999,
                  }}
                />

                {showChildren && (
                  <div className="zona-chips-children">
                    {group.items.map((item) => {
                      const isActive = selectedSet.has(item.id);
                      return (
                        <Chip
                          key={item.id}
                          label={item.label}
                          icon={icon}
                          variant="zona"
                          active={isActive}
                          style={{
                            fontSize: metrics.childFont,
                            padding: metrics.childPadding,
                            background: isActive
                              ? "rgba(76,173,255,0.18)"
                              : "rgba(255,255,255,0.06)",
                            border: isActive
                              ? "1px solid rgba(76,173,255,0.6)"
                              : "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 999,
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      </>
    );
  }

  // Modo edit: mostrar dropdown
  return (
    <>
      <style>{`
        .zona-dropdown-container {
          position: relative;
          width: 100%;
          max-width: 500px;
        }
        .zona-dropdown-trigger {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: #fff;
          font-size: ${metrics.parentFont};
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
        }
        .zona-dropdown-trigger:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.25);
        }
        .zona-dropdown-trigger.open {
          border-color: rgba(76, 173, 255, 0.65);
          background: rgba(76, 173, 255, 0.1);
        }
        .zona-dropdown-menu {
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
        .zona-dropdown-menu::-webkit-scrollbar {
          width: 6px;
        }
        .zona-dropdown-menu::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .zona-dropdown-menu::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .zona-dropdown-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .zona-category-item {
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #fff;
        }
        .zona-category-item:last-child {
          border-bottom: none;
        }
        .zona-category-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .zona-category-item.selected {
          background: rgba(76, 173, 255, 0.15);
          border-left: 3px solid rgba(76, 173, 255, 0.65);
        }
        .zona-zonas-list {
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.2);
        }
        .zona-zona-item {
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
        .zona-zona-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .zona-zona-item.selected {
          background: rgba(76, 173, 255, 0.2);
          border-color: rgba(76, 173, 255, 0.65);
        }
        .zona-checkbox {
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
        .zona-zona-item.selected .zona-checkbox {
          background: rgba(76, 173, 255, 0.8);
          border-color: rgba(76, 173, 255, 1);
        }
        .zona-checkbox::after {
          content: '✓';
          color: #fff;
          font-size: 12px;
          font-weight: 900;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .zona-zona-item.selected .zona-checkbox::after {
          opacity: 1;
        }
        @media (max-width: 768px) {
          .zona-dropdown-container {
            max-width: 100%;
          }
          .zona-dropdown-trigger {
            padding: 0.65rem 0.9rem;
            font-size: 0.85rem;
          }
          .zona-category-item {
            padding: 0.65rem 0.9rem;
            font-size: 0.85rem;
          }
          .zona-zona-item {
            padding: 0.5rem 0.65rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
      <div className={`zona-dropdown-container ${className || ''}`} style={style}>
        <button
          ref={triggerRef}
          type="button"
          className={`zona-dropdown-trigger ${isDropdownOpen ? 'open' : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span>
            {selectedCategoryGroup
              ? `${icon} ${selectedCategoryGroup.label}`
              : 'Selecciona una categoría de zonas'}
          </span>
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            {isDropdownOpen ? '▾' : '▸'}
          </span>
        </button>

        {typeof document !== 'undefined' && document.body && createPortal(
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                className="zona-dropdown-menu"
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
                relevantGroups.map((group) => {
                  const hasActive = groupHasActive(group.id);
                  return (
                    <div
                      key={group.id}
                      className={`zona-category-item ${hasActive ? 'selected' : ''}`}
                      onClick={() => handleCategorySelect(group.id)}
                    >
                      <span>
                        {icon} {group.label}
                        {hasActive && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
                            ({group.items.filter((i) => selectedSet.has(i.id)).length} seleccionados)
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>▸</span>
                    </div>
                  );
                })
              ) : (
                // Mostrar zonas de la categoría seleccionada
                selectedCategoryGroup && (
                  <div>
                    <div
                      className="zona-category-item"
                      onClick={() => setSelectedCategory(null)}
                      style={{
                        background: 'rgba(76, 173, 255, 0.1)',
                        borderLeft: '3px solid rgba(76, 173, 255, 0.65)',
                        fontWeight: 600,
                      }}
                    >
                      <span>← Volver a categorías</span>
                    </div>
                    <div className="zona-zonas-list">
                      {selectedCategoryGroup.items.map((zona) => {
                        const isSelected = selectedSet.has(zona.id);
                        return (
                          <div
                            key={zona.id}
                            className={`zona-zona-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleChipClick(zona.id)}
                          >
                            <div className="zona-checkbox" />
                            <span>{zona.label}</span>
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

        {/* Mostrar zonas seleccionadas como chips debajo del dropdown */}
        {normalizedSelected.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {relevantGroups.flatMap((g) => g.items)
              .filter((z) => selectedSet.has(z.id))
              .map((z) => (
                <motion.div
                  key={z.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 18px',
                    borderRadius: 999,
                    background: 'rgba(76,173,255,0.18)',
                    border: '1px solid rgba(76,173,255,0.6)',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    boxShadow: '0 6px 16px rgba(76,173,255,0.25)',
                  }}
                >
                  <span>{icon} {z.label}</span>
                  <button
                    type="button"
                    onClick={() => handleChipClick(z.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
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
};

export default ZonaGroupedChips;

