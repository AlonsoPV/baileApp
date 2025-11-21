import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTags } from "../hooks/useTags";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { Chip } from "./profile/Chip";
import type { ExploreFilters } from "../state/exploreFilters";
import { useZonaCatalogGroups } from "@/hooks/useZonaCatalogGroups";

interface FilterBarProps {
  filters: ExploreFilters;
  onFiltersChange: (filters: ExploreFilters) => void;
  className?: string;
  showTypeFilter?: boolean;
  initialOpenDropdown?: string | null;
  hideButtons?: boolean;
}

const PERFIL_OPTIONS = [
  { value: 'all', label: 'Todos', icon: '✨' },
  { value: 'fechas', label: 'Fechas', icon: '📆' },
  { value: 'sociales', label: 'Sociales', icon: '🎉' },
  { value: 'clases', label: 'Clases', icon: '🎓' },
  { value: 'organizadores', label: 'Organizadores', icon: '👤' },
  { value: 'academias', label: 'Academias', icon: '🏫' },
  { value: 'maestros', label: 'Maestros', icon: '🎓' },
  { value: 'marcas', label: 'Marcas', icon: '🏷️' },
  { value: 'usuarios', label: 'Bailarines', icon: '🧍' },
];

export default function FilterBar({ filters, onFiltersChange, className = '', showTypeFilter = true, initialOpenDropdown = null, hideButtons = false }: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(initialOpenDropdown || null);
  
  // Sincronizar con prop externo cuando cambia
  React.useEffect(() => {
    if (initialOpenDropdown !== null && initialOpenDropdown !== openDropdown) {
      setOpenDropdown(initialOpenDropdown);
    } else if (initialOpenDropdown === null && openDropdown !== null && hideButtons) {
      // Si se cierra desde fuera, cerrar también internamente
      setOpenDropdown(null);
    }
  }, [initialOpenDropdown, hideButtons]);
  const [expandedRitmoGroup, setExpandedRitmoGroup] = useState<string | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [expandedZonaGroup, setExpandedZonaGroup] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 768;
  });
  const { ritmos, zonas } = useTags();
  const { groups: zonaGroups } = useZonaCatalogGroups(zonas);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (!desktop) setIsSearchExpanded(false);
    };
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };
  
  // Cerrar dropdown cuando se hace clic fuera o se selecciona algo
  const handleCloseDropdown = () => {
    setOpenDropdown(null);
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, q: value });
  };

  const handleTypeChange = (type: string) => {
    onFiltersChange({ ...filters, type: type as any });
  };

  const handleRitmoToggle = (ritmoId: number) => {
    const newRitmos = filters.ritmos.includes(ritmoId)
      ? filters.ritmos.filter(r => r !== ritmoId)
      : [...filters.ritmos, ritmoId];
    onFiltersChange({ ...filters, ritmos: newRitmos });
  };

  const handleZonaToggle = (zonaId: number) => {
    const newZonas = filters.zonas.includes(zonaId)
      ? filters.zonas.filter(z => z !== zonaId)
      : [...filters.zonas, zonaId];
    onFiltersChange({ ...filters, zonas: newZonas });
  };

  const handleDateChange = (type: 'desde' | 'hasta', value: string) => {
    if (type === 'desde') {
      onFiltersChange({ ...filters, dateFrom: value });
    } else {
      onFiltersChange({ ...filters, dateTo: value });
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      type: 'all' as any,
      q: '',
      ritmos: [],
      zonas: [],
      datePreset: 'todos',
      dateFrom: undefined,
      dateTo: undefined,
      pageSize: filters.pageSize ?? 12
    });
    setOpenDropdown(null);
  };

  const hasActiveFilters = () => {
    return filters.q !== '' || 
           (showTypeFilter && filters.type !== 'all') ||
           filters.ritmos.length > 0 || 
           filters.zonas.length > 0 || 
           filters.dateFrom || 
           filters.dateTo;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.q) count++;
    if (showTypeFilter && filters.type !== 'all') count++;
    count += filters.ritmos.length;
    count += filters.zonas.length;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  };

  return (
    <div className={`sticky top-16 z-40 ${className}`}>
      <style>{`
        ${hideButtons ? `
          .filters-row {
            display: none !important;
          }
          .filters-wrap {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .dropdown-panel {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            border-radius: 12px !important;
            background: #101119 !important;
            border: 1px solid #262a36 !important;
            padding: 1rem 1.25rem !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
          }
        ` : ''}
        @media (max-width: 768px) {
          .filters-wrap { padding: 0 !important; }
          .filters-row { 
            flex-wrap: nowrap !important; 
            overflow-x: auto; 
            gap: 0.5rem !important; 
            -webkit-overflow-scrolling: touch;
            padding-bottom: 0.5rem;
          }
          .filters-row::-webkit-scrollbar { display: none; }
          .dropdown-panel { 
            width: 100% !important; 
            padding: 1.25rem !important;
            margin-top: 0.75rem !important;
          }
          input[type="text"] {
            padding: 0.75rem 1rem 0.75rem 3rem !important;
            font-size: 0.875rem !important;
          }
          button {
            padding: 0.75rem 1rem !important;
            font-size: 0.825rem !important;
          }
        }
        @media (max-width: 480px) {
          .filters-wrap { padding: 0 !important; }
          .dropdown-panel { 
            padding: 1rem !important;
          }
        }
      `}</style>
      <div 
        style={{
          background: hideButtons ? 'transparent' : 'linear-gradient(135deg, rgba(18, 18, 18, 0.98), rgba(20, 20, 25, 0.98))',
          backdropFilter: hideButtons ? 'none' : 'blur(20px)',
          borderBottom: hideButtons ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: hideButtons ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.4)',
          position: 'relative'
        }}
      >
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0',
          position: 'relative'
        }} className="filters-wrap">
          {/* Barra Principal de Filtros */}
          {!hideButtons && (
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }} className="filters-row">
            {/* Botón Tipos */}
            {showTypeFilter && (
              <FilterButton
                label="Tipos"
                icon="👥"
                isOpen={openDropdown === 'tipos'}
                onClick={() => toggleDropdown('tipos')}
                activeCount={filters.type !== 'all' ? 1 : 0}
              />
            )}

            {/* Botón Ritmos */}
            <FilterButton
              label="Ritmos"
              icon="🎵"
              isOpen={openDropdown === 'ritmos'}
              onClick={() => toggleDropdown('ritmos')}
              activeCount={filters.ritmos.length}
              iconOnly
              ariaLabel="Filtrar por ritmos"
            />

            {/* Botón Zonas */}
            <FilterButton
              label="Zonas"
              icon="📍"
              isOpen={openDropdown === 'zonas'}
              onClick={() => toggleDropdown('zonas')}
              activeCount={filters.zonas.length}
              iconOnly
              ariaLabel="Filtrar por zonas"
            />

            {/* Botón Fechas */}
            <FilterButton
              label="Fechas"
              icon="📅"
              isOpen={openDropdown === 'fechas'}
              onClick={() => toggleDropdown('fechas')}
              activeCount={filters.dateFrom || filters.dateTo ? 1 : 0}
              iconOnly
              ariaLabel="Filtrar por fechas"
            />

            {/* Botón Limpiar Filtros */}
            {hasActiveFilters() && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '14px',
                  border: '2px solid rgba(239, 68, 68, 0.4)',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))',
                  color: '#F87171',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <span>🗑️</span>
                <span>Limpiar ({getActiveFilterCount()})</span>
              </motion.button>
            )}

            {/* Búsqueda por palabra clave al final */}
            {!hideButtons && (
            <div style={{ flex: '0 0 auto', position: 'relative' }} className="filters-search">
              {isSearchExpanded ? (
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  width: isDesktop ? 320 : 'min(85vw, 320px)'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    fontSize: '1.1rem',
                    pointerEvents: 'none'
                  }}>
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar fechas, academias, maestros..."
                    value={filters.q}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem 0.8rem 3rem',
                      borderRadius: '14px',
                      border: filters.q ? '2px solid rgba(240, 147, 251, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
                      background: filters.q ? 'rgba(240, 147, 251, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                      color: 'white',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: filters.q ? '0 0 0 3px rgba(240, 147, 251, 0.2), 0 4px 16px rgba(240, 147, 251, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                  />
                  <button
                    onClick={() => setIsSearchExpanded(false)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      fontSize: '0.85rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer'
                    }}
                    aria-label="Cerrar búsqueda"
                  >
                    ✖
                  </button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSearchExpanded(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.75rem',
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  aria-label="Abrir búsqueda"
                >
                  <span>🔍</span>
                </motion.button>
              )}
            </div>
            )}
          </div>
          )}

          {/* Dropdowns */}
          <AnimatePresence>
            {/* Dropdown Tipos */}
            {showTypeFilter && openDropdown === 'tipos' && (
              <DropdownPanel onClose={() => setOpenDropdown(null)}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  {PERFIL_OPTIONS.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label.replace(/^.+ /, '')} // Remove emoji from label
                      icon={option.icon}
                      variant="perfil"
                      active={filters.type === option.value}
                      onClick={() => handleTypeChange(option.value)}
                    />
                  ))}
                </div>
              </DropdownPanel>
            )}

            {/* Dropdown Ritmos */}
            {openDropdown === 'ritmos' && (
              <DropdownPanel onClose={() => setOpenDropdown(null)}>
                {(() => {
                  // Mapeos nombre<->id para enlazar catálogo a tags
                  const tagNameById = new Map<number, string>((ritmos || []).map(r => [r.id, r.nombre]));
                  const tagIdByName = new Map<string, number>((ritmos || []).map(r => [r.nombre, r.id]));

                  // UI estado: chip padre expandida
                  const expandedGroup = expandedRitmoGroup;
                  const toggleGroup = (gid: string) => setExpandedRitmoGroup(prev => prev === gid ? null : gid);

                  // Helpers para activar/desactivar ritmos hijos
                  const isTagActive = (name: string) => {
                    const id = tagIdByName.get(name);
                    return id ? filters.ritmos.includes(id) : false;
                  };
                  const toggleChild = (name: string) => {
                    const id = tagIdByName.get(name);
                    if (!id) return;
                    const newRitmos = filters.ritmos.includes(id)
                      ? filters.ritmos.filter(r => r !== id)
                      : [...filters.ritmos, id];
                    onFiltersChange({ ...filters, ritmos: newRitmos });
                  };

                  return (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {/* Chips padres */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {RITMOS_CATALOG.map(group => {
                          const activeInGroup = group.items.some(i => isTagActive(i.label));
                          const isOpen = expandedGroup === group.id;
                          return (
                            <button
                              key={group.id}
                              onClick={() => toggleGroup(group.id)}
                              style={{
                                padding: '12px 18px',
                                borderRadius: 999,
                                border: isOpen || activeInGroup ? '2px solid rgba(240,147,251,0.6)' : '1px solid rgba(255,255,255,0.15)',
                                background: isOpen || activeInGroup ? 'rgba(240,147,251,0.15)' : 'rgba(255,255,255,0.06)',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {group.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Chips hijas del grupo expandido */}
                      {expandedGroup && (
                        <div style={{
                          display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
                          borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12
                        }}>
                          {RITMOS_CATALOG.find(g => g.id === expandedGroup)?.items.map(child => {
                            const active = isTagActive(child.label);
                            return (
                              <button
                                key={child.id}
                                onClick={() => toggleChild(child.label)}
                                style={{
                                  padding: '7px 13px',
                                  borderRadius: 999,
                                  border: active ? '1px solid #f093fb' : '1px solid rgba(255,255,255,0.15)',
                                  background: active ? 'rgba(240,147,251,0.15)' : 'transparent',
                                  color: active ? '#f093fb' : 'rgba(255,255,255,0.9)',
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {child.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </DropdownPanel>
            )}

            {/* Dropdown Zonas */}
            {openDropdown === 'zonas' && (
              <DropdownPanel onClose={() => setOpenDropdown(null)}>
                {zonaGroups.length ? (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    {zonaGroups.map(group => {
                      const activeInGroup = group.items.some(item => filters.zonas.includes(item.id));
                      const isOpen = expandedZonaGroup === group.id;
                      return (
                        <div
                          key={group.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            alignItems: 'flex-start',
                            minWidth: 'fit-content',
                          }}
                        >
                          <Chip
                            label={`${group.label} ${isOpen ? '▾' : '▸'}`}
                            icon="📍"
                            variant="custom"
                            active={isOpen || activeInGroup}
                            onClick={() => setExpandedZonaGroup(prev => (prev === group.id ? null : group.id))}
                            style={{
                              width: 'fit-content',
                              minWidth: 'auto',
                              padding: '12px 18px',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              background: (isOpen || activeInGroup)
                                ? 'rgba(76,173,255,0.18)'
                                : 'rgba(255,255,255,0.05)',
                              border: (isOpen || activeInGroup)
                                ? '1px solid rgba(76,173,255,0.6)'
                                : '1px solid rgba(255,255,255,0.12)',
                              borderRadius: 999,
                            }}
                          />

                          {isOpen && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                borderTop: '1px solid rgba(255,255,255,0.08)',
                                paddingTop: '0.35rem',
                                width: '100%',
                              }}
                            >
                              {group.items.map(item => {
                                const active = filters.zonas.includes(item.id);
                                return (
                                  <Chip
                                    key={item.id}
                                    label={item.label}
                                    icon="📍"
                                    variant="zona"
                                    active={active}
                                    onClick={() => handleZonaToggle(item.id)}
                                    style={{
                                      fontSize: '0.85rem',
                                      padding: '7px 13px',
                                      fontWeight: 500,
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
                ) : (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                    No hay zonas disponibles
                  </div>
                )}
              </DropdownPanel>
            )}

            {/* Dropdown Fechas */}
            {openDropdown === 'fechas' && (
              <DropdownPanel onClose={() => setOpenDropdown(null)}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1.5rem',
                  maxWidth: '500px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '0.5rem'
                    }}>
                      📅 Desde
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) => handleDateChange('desde', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '0.5rem'
                    }}>
                      📅 Hasta
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) => handleDateChange('hasta', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </DropdownPanel>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Overlay para cerrar dropdowns */}
      <AnimatePresence>
        {openDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenDropdown(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: -1
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente auxiliar: Botón de filtro
function FilterButton({ 
  label, 
  icon, 
  isOpen, 
  onClick, 
  activeCount,
  iconOnly = false,
  ariaLabel
}: { 
  label: string; 
  icon: string; 
  isOpen: boolean; 
  onClick: () => void; 
  activeCount: number;
  iconOnly?: boolean;
  ariaLabel?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={iconOnly ? ariaLabel || label : undefined}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: iconOnly ? 0 : '0.5rem',
        padding: iconOnly ? '0.75rem' : '0.875rem 1.5rem',
        width: iconOnly ? 48 : undefined,
        height: iconOnly ? 48 : undefined,
        borderRadius: '14px',
        border: isOpen ? '2px solid rgba(240, 147, 251, 0.6)' : '1px solid rgba(255, 255, 255, 0.15)',
        background: isOpen 
          ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.15))' 
          : 'rgba(255, 255, 255, 0.06)',
        color: 'white',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        whiteSpace: 'nowrap',
        boxShadow: isOpen 
          ? '0 4px 16px rgba(240, 147, 251, 0.3), 0 0 0 2px rgba(240, 147, 251, 0.2)' 
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <span>{icon}</span>
      {!iconOnly && <span>{label}</span>}
      {activeCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            minWidth: '24px',
            height: '24px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f093fb, #f5576c)',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 6px',
            boxShadow: '0 4px 12px rgba(240, 147, 251, 0.5), 0 0 0 2px rgba(240, 147, 251, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            zIndex: 10
          }}
        >
          {activeCount}
        </motion.div>
      )}
      {!iconOnly && (
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: '0.75rem', opacity: 0.7 }}
        >
          ▼
        </motion.span>
      )}
    </motion.button>
  );
}

// Componente auxiliar: Panel desplegable
function DropdownPanel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        marginTop: '1rem',
        padding: '1.75rem',
        borderRadius: '18px',
        background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.98), rgba(25, 25, 30, 0.98))',
        border: '2px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(240, 147, 251, 0.1)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="dropdown-panel"
    >
      {children}
    </motion.div>
  );
}


