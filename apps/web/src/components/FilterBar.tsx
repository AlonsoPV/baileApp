import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTags } from "../hooks/useTags";
import { Chip } from "./profile/Chip";
import type { ExploreFilters } from "../state/exploreFilters";

interface FilterBarProps {
  filters: ExploreFilters;
  onFiltersChange: (filters: ExploreFilters) => void;
  className?: string;
}

const PERFIL_OPTIONS = [
  { value: 'eventos', label: '📅 Eventos', icon: '📅' },
  { value: 'fechas', label: '📆 Fechas', icon: '📆' },
  { value: 'organizadores', label: '👤 Organizadores', icon: '👤' },
  { value: 'maestros', label: '🎓 Maestros', icon: '🎓' },
  { value: 'academias', label: '🏫 Academias', icon: '🏫' },
  { value: 'marcas', label: '🏷️ Marcas', icon: '🏷️' },
  { value: 'sociales', label: '🎉 Sociales', icon: '🎉' },
  { value: 'usuarios', label: '💃 Usuarios', icon: '💃' },
];

export default function FilterBar({ filters, onFiltersChange, className = '' }: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { ritmos, zonas } = useTags();

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
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
      type: 'eventos',
      q: '',
      ritmos: [],
      zonas: [],
      pageSize: 12
    });
    setOpenDropdown(null);
  };

  const hasActiveFilters = () => {
    return filters.q !== '' || 
           filters.type !== 'eventos' ||
           filters.ritmos.length > 0 || 
           filters.zonas.length > 0 || 
           filters.dateFrom || 
           filters.dateTo;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.q) count++;
    if (filters.type !== 'eventos') count++;
    count += filters.ritmos.length;
    count += filters.zonas.length;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  };

  return (
    <div className={`sticky top-16 z-40 ${className}`}>
      <style>{`
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
          .filters-search { 
            flex: 1 0 85% !important; 
            min-width: 85% !important; 
          }
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
          .filters-search { 
            min-width: 100% !important;
            margin-bottom: 0.5rem;
          }
          .dropdown-panel { 
            padding: 1rem !important;
          }
        }
      `}</style>
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(18, 18, 18, 0.98), rgba(20, 20, 25, 0.98))',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top gradient bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)',
          opacity: 0.9
        }} />
        
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0',
          position: 'relative',
          zIndex: 1
        }} className="filters-wrap">
          {/* Barra Principal de Filtros */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }} className="filters-row">
            {/* Búsqueda por palabra clave */}
            <div style={{ flex: '1 1 300px', minWidth: '200px', position: 'relative' }} className="filters-search">
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  fontSize: '1.25rem',
                  pointerEvents: 'none'
                }}>
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar eventos, academias, maestros..."
                  value={filters.q}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 3.25rem',
                    borderRadius: '14px',
                    border: filters.q ? '2px solid rgba(240, 147, 251, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: filters.q ? 'rgba(240, 147, 251, 0.1)' : 'rgba(255, 255, 255, 0.06)',
                    color: 'white',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: filters.q ? '0 0 0 3px rgba(240, 147, 251, 0.2), 0 4px 16px rgba(240, 147, 251, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = '2px solid rgba(240, 147, 251, 0.6)';
                    e.currentTarget.style.background = 'rgba(240, 147, 251, 0.12)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240, 147, 251, 0.25), 0 6px 20px rgba(240, 147, 251, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = filters.q ? '2px solid rgba(240, 147, 251, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.background = filters.q ? 'rgba(240, 147, 251, 0.1)' : 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.boxShadow = filters.q ? '0 0 0 3px rgba(240, 147, 251, 0.2), 0 4px 16px rgba(240, 147, 251, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.2)';
                  }}
                />
              </div>
            </div>

            {/* Botón Tipos */}
            <FilterButton
              label="Tipos"
              icon="👥"
              isOpen={openDropdown === 'tipos'}
              onClick={() => toggleDropdown('tipos')}
              activeCount={filters.type !== 'eventos' ? 1 : 0}
            />

            {/* Botón Ritmos */}
            <FilterButton
              label="Ritmos"
              icon="🎵"
              isOpen={openDropdown === 'ritmos'}
              onClick={() => toggleDropdown('ritmos')}
              activeCount={filters.ritmos.length}
            />

            {/* Botón Zonas */}
            <FilterButton
              label="Zonas"
              icon="📍"
              isOpen={openDropdown === 'zonas'}
              onClick={() => toggleDropdown('zonas')}
              activeCount={filters.zonas.length}
            />

            {/* Botón Fechas */}
            <FilterButton
              label="Fechas"
              icon="📅"
              isOpen={openDropdown === 'fechas'}
              onClick={() => toggleDropdown('fechas')}
              activeCount={filters.dateFrom || filters.dateTo ? 1 : 0}
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
          </div>

          {/* Dropdowns */}
          <AnimatePresence>
            {/* Dropdown Tipos */}
            {openDropdown === 'tipos' && (
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
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '4px'
                }}>
                  {ritmos?.map((ritmo) => (
                    <Chip
                      key={ritmo.id}
                      label={ritmo.nombre}
                      icon="🎵"
                      variant="ritmo"
                      active={filters.ritmos.includes(ritmo.id)}
                      onClick={() => handleRitmoToggle(ritmo.id)}
                    />
                  ))}
                </div>
              </DropdownPanel>
            )}

            {/* Dropdown Zonas */}
            {openDropdown === 'zonas' && (
              <DropdownPanel onClose={() => setOpenDropdown(null)}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '4px'
                }}>
                  {zonas?.map((zona) => (
                    <Chip
                      key={zona.id}
                      label={zona.nombre}
                      icon="📍"
                      variant="zona"
                      active={filters.zonas.includes(zona.id)}
                      onClick={() => handleZonaToggle(zona.id)}
                    />
                  ))}
                </div>
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
  activeCount 
}: { 
  label: string; 
  icon: string; 
  isOpen: boolean; 
  onClick: () => void; 
  activeCount: number;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.875rem 1.5rem',
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
      <span>{label}</span>
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
      <motion.span
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ fontSize: '0.75rem', opacity: 0.7 }}
      >
        ▼
      </motion.span>
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


