import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTags } from "../hooks/useTags";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { Chip } from "./profile/Chip";
import type { ExploreFilters } from "../state/exploreFilters";
import { useZonaCatalogGroups } from "@/hooks/useZonaCatalogGroups";
import { useUsedFilterTags } from "@/hooks/useUsedFilterTags";

// Debounce simple (sin dependencias externas)
function useDebouncedCallback<T extends any[]>(
  fn: (...args: T) => void,
  delay = 250
) {
  const timer = React.useRef<number | null>(null);
  return React.useCallback((...args: T) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

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
  // Estado temporal para fechas antes de aplicar
  const [tempDateFrom, setTempDateFrom] = useState<string | undefined>(filters.dateFrom);
  const [tempDateTo, setTempDateTo] = useState<string | undefined>(filters.dateTo);
  
  // Sincroniza con prop externa, sin depender de openDropdown
  React.useEffect(() => {
    if (initialOpenDropdown !== null) {
      setOpenDropdown(initialOpenDropdown);
    } else if (hideButtons) {
      // Solo cerrar si hideButtons es true Y initialOpenDropdown es null
      // Si initialOpenDropdown es 'fechas', mantenerlo abierto
      if (initialOpenDropdown === null) {
        setOpenDropdown(null);
      }
    }
  }, [initialOpenDropdown, hideButtons]);

  // Sincronizar fechas temporales con los filtros cuando cambian externamente
  React.useEffect(() => {
    setTempDateFrom(filters.dateFrom);
    setTempDateTo(filters.dateTo);
  }, [filters.dateFrom, filters.dateTo]);

  const [expandedRitmoGroup, setExpandedRitmoGroup] = useState<string | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [expandedZonaGroup, setExpandedZonaGroup] = useState<string | null>(null);
  
  // Cuando hideButtons es true, la búsqueda siempre empieza colapsada
  React.useEffect(() => {
    if (hideButtons) {
      setIsSearchExpanded(false);
    }
  }, [hideButtons]);

  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 768;
  });

  const { ritmos: allRitmos, zonas: allZonas } = useTags();
  const { usedRitmoIds, usedZonaIds, isLoading: loadingUsed, error: usedError } = useUsedFilterTags();

  const ritmos = React.useMemo(() => {
    // Mientras la query carga o si falla, mostrar todos los ritmos (comportamiento anterior)
    if (loadingUsed || usedError) return allRitmos;
    const set = new Set(usedRitmoIds);
    // Si no hay ninguno usado, no mostrar chips (lista vacía)
    if (set.size === 0) return [] as typeof allRitmos;
    return allRitmos.filter((r) => set.has(r.id));
  }, [allRitmos, usedRitmoIds, loadingUsed, usedError]);

  const zonas = React.useMemo(() => {
    if (loadingUsed || usedError) return allZonas;
    const set = new Set(usedZonaIds);
    if (set.size === 0) return [] as typeof allZonas;
    return allZonas.filter((z) => set.has(z.id));
  }, [allZonas, usedZonaIds, loadingUsed, usedError]);

  const { groups: zonaGroups } = useZonaCatalogGroups(zonas);

  // Grupos de catálogo de ritmos ya filtrados a los ids usados
  const catalogGroups = React.useMemo(() => {
    const tagIdByName = new Map<string, number>((ritmos || []).map(r => [r.nombre, r.id]));
    const groups = RITMOS_CATALOG
      .map(group => ({ ...group, items: group.items.filter(i => tagIdByName.has(i.label)) }))
      .filter(g => g.items.length > 0);
    return { groups, tagIdByName };
  }, [ritmos]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.q) count++;
    if (showTypeFilter && filters.type !== 'all') count++;
    count += filters.ritmos.length;
    count += filters.zonas.length;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters, showTypeFilter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (!desktop) setIsSearchExpanded(false);
    };
    handler();
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  const toggleDropdown = React.useCallback((dropdown: string) => {
    setOpenDropdown(prev => (prev === dropdown ? null : dropdown));
  }, []);

  const onCloseDropdown = React.useCallback(() => setOpenDropdown(null), []);

  // Debounced search
  const debouncedSearch = useDebouncedCallback((value: string) => {
    onFiltersChange({ ...filters, q: value });
  }, 250);

  const handleSearchChange = React.useCallback((value: string) => {
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleTypeChange = React.useCallback((type: string) => {
    onFiltersChange({ ...filters, type: type as any });
  }, [filters, onFiltersChange]);

  const handleRitmoToggle = React.useCallback((ritmoId: number) => {
    const newRitmos = filters.ritmos.includes(ritmoId)
      ? filters.ritmos.filter(r => r !== ritmoId)
      : [...filters.ritmos, ritmoId];
    onFiltersChange({ ...filters, ritmos: newRitmos });
  }, [filters, onFiltersChange]);

  const handleZonaToggle = React.useCallback((zonaId: number) => {
    const newZonas = filters.zonas.includes(zonaId)
      ? filters.zonas.filter(z => z !== zonaId)
      : [...filters.zonas, zonaId];
    onFiltersChange({ ...filters, zonas: newZonas });
  }, [filters, onFiltersChange]);

  const handleDateChange = React.useCallback((type: 'desde' | 'hasta', value: string) => {
    // Actualizar solo el estado temporal, no aplicar aún
    if (type === 'desde') {
      setTempDateFrom(value || undefined);
    } else {
      setTempDateTo(value || undefined);
    }
  }, []);

  const handleApplyDateFilter = React.useCallback(() => {
    // Cuando se aplica, limpiar el preset para evitar conflictos
    const updates: any = {
      datePreset: undefined, // Limpiar preset cuando se usa fecha manual
      dateFrom: tempDateFrom,
      dateTo: tempDateTo,
    };
    
    onFiltersChange({ ...filters, ...updates });
    setOpenDropdown(null); // Cerrar el dropdown después de aplicar
  }, [filters, tempDateFrom, tempDateTo, onFiltersChange]);

  const clearFilters = React.useCallback(() => {
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
  }, [filters, onFiltersChange]);

  const hasActiveFilters = React.useMemo(() => {
    return filters.q !== '' || 
           (showTypeFilter && filters.type !== 'all') ||
           filters.ritmos.length > 0 || 
           filters.zonas.length > 0 || 
           filters.dateFrom || 
           filters.dateTo;
  }, [filters, showTypeFilter]);

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
          .filters-wrap { 
            padding: 0.75rem 0.5rem 0 !important; 
          }
          .filters-row { 
            flex-wrap: nowrap !important; 
            overflow-x: auto !important; 
            gap: 0.6rem !important; 
            -webkit-overflow-scrolling: touch !important;
            scroll-behavior: smooth !important;
            padding: 0.5rem 0.5rem 0.75rem !important;
            scrollbar-width: thin !important;
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent !important;
          }
          .filters-row::-webkit-scrollbar { 
            height: 4px !important;
            display: block !important;
          }
          .filters-row::-webkit-scrollbar-track {
            background: transparent !important;
          }
          .filters-row::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2) !important;
            border-radius: 4px !important;
          }
          /* Botones de filtros más pequeños en móvil */
          .filter-button-mobile {
            padding: 0.7rem 1rem !important;
            font-size: 0.8125rem !important;
            min-height: 40px !important;
            min-width: 40px !important;
          }
          .filter-button-icon-only {
            padding: 0.65rem !important;
            min-width: 40px !important;
            min-height: 40px !important;
            width: 40px !important;
            height: 40px !important;
          }
          .dropdown-panel { 
            width: 100% !important; 
            padding: 1rem 1.125rem !important;
            margin-top: 0.75rem !important;
            border-radius: 14px !important;
            max-height: calc(100vh - 200px) !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          /* Chips de ritmos en móvil */
          .ritmo-chip-parent {
            padding: 10px 14px !important;
            font-size: 0.875rem !important;
            min-height: 38px !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
          }
          .ritmo-chip-parent.active {
            padding: 6px 12px !important;
            font-size: 0.75rem !important;
          }
          .ritmo-chip-child {
            padding: 8px 12px !important;
            font-size: 0.8125rem !important;
            min-height: 36px !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
          }
          .ritmo-chip-child.active {
            padding: 6px 10px !important;
            font-size: 0.75rem !important;
          }
          /* Chips de zonas en móvil */
          .zona-chip-parent {
            padding: 10px 14px !important;
            font-size: 0.875rem !important;
            min-height: 38px !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
          }
          .zona-chip-child {
            padding: 8px 12px !important;
            font-size: 0.8125rem !important;
            min-height: 36px !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
          }
          /* Gap mejorado para chips */
          .ritmos-parents-container {
            gap: 0.5rem !important;
          }
          .ritmos-children-container {
            gap: 0.5rem !important;
          }
          .zonas-container {
            gap: 0.6rem !important;
          }
          .zonas-group {
            gap: 0.4rem !important;
          }
          .zonas-children {
            gap: 0.45rem !important;
          }
          /* Botón limpiar filtros */
          .clear-filters-btn {
            min-height: 40px !important;
            padding: 0.7rem 1.25rem !important;
            font-size: 0.8125rem !important;
          }
          input[type="text"] {
            padding: 0.875rem 1rem 0.875rem 3.25rem !important;
            font-size: 0.9375rem !important;
            min-height: 44px !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
          }
          button {
            padding: 0.875rem 1.25rem !important;
            font-size: 0.875rem !important;
            min-height: 44px !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
            white-space: nowrap !important;
          }
        }
        @media (max-width: 480px) {
          .filters-wrap { 
            padding: 0.5rem 0.25rem 0 !important; 
          }
          .filters-row { 
            gap: 0.5rem !important; 
            padding: 0.5rem 0.25rem 0.75rem !important;
          }
          .filter-button-mobile {
            padding: 0.625rem 0.875rem !important;
            font-size: 0.75rem !important;
            min-height: 38px !important;
            min-width: 38px !important;
          }
          .filter-button-icon-only {
            padding: 0.6rem !important;
            min-width: 38px !important;
            min-height: 38px !important;
            width: 38px !important;
            height: 38px !important;
          }
          .dropdown-panel { 
            padding: 0.875rem 1rem !important;
            margin-top: 0.5rem !important;
            border-radius: 12px !important;
          }
          .ritmo-chip-parent {
            padding: 8px 12px !important;
            font-size: 0.8125rem !important;
            min-height: 36px !important;
          }
          .ritmo-chip-parent.active {
            padding: 5px 10px !important;
            font-size: 0.7rem !important;
          }
          .ritmo-chip-child {
            padding: 7px 11px !important;
            font-size: 0.75rem !important;
            min-height: 34px !important;
          }
          .ritmo-chip-child.active {
            padding: 5px 9px !important;
            font-size: 0.7rem !important;
          }
          .zona-chip-parent {
            padding: 8px 12px !important;
            font-size: 0.8125rem !important;
            min-height: 36px !important;
          }
          .zona-chip-child {
            padding: 7px 11px !important;
            font-size: 0.75rem !important;
            min-height: 34px !important;
          }
          .ritmos-parents-container {
            gap: 0.4rem !important;
          }
          .ritmos-children-container {
            gap: 0.4rem !important;
          }
          .zonas-container {
            gap: 0.5rem !important;
          }
          .zonas-children {
            gap: 0.4rem !important;
          }
          .clear-filters-btn {
            min-height: 38px !important;
            padding: 0.625rem 1rem !important;
            font-size: 0.75rem !important;
          }
          input[type="text"] {
            padding: 0.75rem 0.875rem 0.75rem 3rem !important;
            font-size: 0.875rem !important;
            min-height: 42px !important;
          }
          button {
            padding: 0.75rem 1rem !important;
            font-size: 0.8125rem !important;
            min-height: 42px !important;
          }
        }
        @media (max-width: 430px) {
          .filters-wrap { 
            padding: 0.5rem 0.125rem 0 !important; 
          }
          .filters-row { 
            gap: 0.4rem !important; 
            padding: 0.4rem 0.125rem 0.6rem !important;
          }
          .filter-button-mobile {
            padding: 0.6rem 0.75rem !important;
            font-size: 0.7rem !important;
            min-height: 36px !important;
            min-width: 36px !important;
          }
          .filter-button-icon-only {
            padding: 0.55rem !important;
            min-width: 36px !important;
            min-height: 36px !important;
            width: 36px !important;
            height: 36px !important;
          }
          .dropdown-panel { 
            padding: 0.75rem 0.875rem !important;
            border-radius: 10px !important;
          }
          .ritmo-chip-parent {
            padding: 7px 11px !important;
            font-size: 0.75rem !important;
            min-height: 34px !important;
          }
          .ritmo-chip-parent.active {
            padding: 5px 9px !important;
            font-size: 0.68rem !important;
          }
          .ritmo-chip-child {
            padding: 6px 10px !important;
            font-size: 0.7rem !important;
            min-height: 32px !important;
          }
          .ritmo-chip-child.active {
            padding: 4px 8px !important;
            font-size: 0.68rem !important;
          }
          .zona-chip-parent {
            padding: 7px 11px !important;
            font-size: 0.75rem !important;
            min-height: 34px !important;
          }
          .zona-chip-child {
            padding: 6px 10px !important;
            font-size: 0.7rem !important;
            min-height: 32px !important;
          }
          .ritmos-parents-container {
            gap: 0.35rem !important;
          }
          .ritmos-children-container {
            gap: 0.35rem !important;
          }
          .zonas-container {
            gap: 0.4rem !important;
          }
          .zonas-children {
            gap: 0.35rem !important;
          }
          .clear-filters-btn {
            min-height: 36px !important;
            padding: 0.6rem 0.9rem !important;
            font-size: 0.7rem !important;
          }
          input[type="text"] {
            padding: 0.7rem 0.8rem 0.7rem 2.75rem !important;
            font-size: 0.8125rem !important;
            min-height: 40px !important;
          }
          button {
            padding: 0.7rem 0.9rem !important;
            font-size: 0.75rem !important;
            min-height: 40px !important;
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
          position: 'relative',
          zIndex: openDropdown ? 2001 : 'auto'
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
                ariaControlsId="dropdown-tipos"
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
              ariaControlsId="dropdown-ritmos"
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
              ariaControlsId="dropdown-zonas"
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
              ariaControlsId="dropdown-fechas"
            />

            {/* Botón Limpiar Filtros */}
            {hasActiveFilters && (
              <motion.button
                className="clear-filters-btn"
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
                <span>Limpiar ({activeFilterCount})</span>
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
              <DropdownPanel id="dropdown-tipos" onClose={onCloseDropdown}>
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
              <DropdownPanel id="dropdown-ritmos" onClose={onCloseDropdown}>
                {(() => {
                  const { groups: groupsMemo, tagIdByName } = catalogGroups;

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
                      {/* Chips padres (solo grupos con algún hijo mapeado) */}
                      <div className="ritmos-parents-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {groupsMemo.map(group => {
                          const activeInGroup = group.items.some(i => isTagActive(i.label));
                          const isOpen = expandedGroup === group.id;
                          const isActive = isOpen || activeInGroup;
                          return (
                            <button
                              key={group.id}
                              className={`ritmo-chip-parent ${isActive ? 'active' : ''}`}
                              onClick={() => toggleGroup(group.id)}
                              style={{
                                padding: isActive ? '5px 10px' : '12px 18px',
                                borderRadius: 999,
                                border: isActive ? '1px solid rgba(245, 87, 108, 0.65)' : '1px solid rgba(255,255,255,0.15)',
                                background: isActive ? 'rgba(245, 87, 108, 0.2)' : 'rgba(255,255,255,0.06)',
                                color: isActive ? '#FFE4EE' : 'rgba(255,255,255,0.9)',
                                fontWeight: isActive ? 700 : 700,
                                fontSize: isActive ? '0.78rem' : '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backdropFilter: isActive ? 'blur(10px)' : 'none',
                                boxShadow: isActive ? 'rgba(245, 87, 108, 0.3) 0px 4px 16px, rgba(255,255,255,0.2) 0px 1px 0px inset' : 'none',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              🎵 {group.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Chips hijas del grupo expandido */}
                      {expandedGroup && (
                        <div className="ritmos-children-container" style={{
                          display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
                          borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12
                        }}>
                          {groupsMemo.find(g => g.id === expandedGroup)?.items.map(child => {
                            const active = isTagActive(child.label);
                            return (
                              <button
                                key={child.id}
                                className={`ritmo-chip-child ${active ? 'active' : ''}`}
                                onClick={() => toggleChild(child.label)}
                                style={{
                                  padding: active ? '5px 10px' : '7px 13px',
                                  borderRadius: 999,
                                  border: active ? '1px solid rgba(245, 87, 108, 0.65)' : '1px solid rgba(255,255,255,0.15)',
                                  background: active ? 'rgba(245, 87, 108, 0.2)' : 'transparent',
                                  color: active ? '#FFE4EE' : 'rgba(255,255,255,0.9)',
                                  fontSize: active ? '0.78rem' : '0.85rem',
                                  fontWeight: active ? 700 : 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  backdropFilter: active ? 'blur(10px)' : 'none',
                                  boxShadow: active ? 'rgba(245, 87, 108, 0.3) 0px 4px 16px, rgba(255,255,255,0.2) 0px 1px 0px inset' : 'none',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                🎵 {child.label}
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
              <DropdownPanel id="dropdown-zonas" onClose={onCloseDropdown}>
                {zonaGroups.length ? (
                  <div
                    className="zonas-container"
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
                          className="zonas-group"
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
                            className="zona-chip-parent"
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
                              whiteSpace: 'nowrap',
                            }}
                          />

                          {isOpen && (
                            <div
                              className="zonas-children"
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
                                    className="zona-chip-child"
                                    style={{
                                      fontSize: '0.85rem',
                                      padding: '7px 13px',
                                      fontWeight: 500,
                                      whiteSpace: 'nowrap',
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
              <DropdownPanel id="dropdown-fechas" onClose={onCloseDropdown}>
                <div 
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    maxWidth: '500px'
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1.5rem'
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
                        value={tempDateFrom || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleDateChange('desde', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
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
                        value={tempDateTo || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleDateChange('hasta', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
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
                  
                  {/* Botones de acción */}
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end',
                    marginTop: '0.5rem'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Limpiar fechas temporales y aplicar
                        setTempDateFrom(undefined);
                        setTempDateTo(undefined);
                        handleApplyDateFilter();
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyDateFilter();
                      }}
                      style={{
                        padding: '0.5rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #ff4b8b, #ff9b45)',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(255, 75, 139, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 75, 139, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 75, 139, 0.3)';
                      }}
                    >
                      Aplicar
                    </button>
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
            onClick={onCloseDropdown}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 2000,
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
            aria-hidden="true"
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
  ariaLabel,
  ariaControlsId
}: { 
  label: string; 
  icon: string; 
  isOpen: boolean; 
  onClick: () => void; 
  activeCount: number;
  iconOnly?: boolean;
  ariaLabel?: string;
  ariaControlsId?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={iconOnly ? ariaLabel || label : undefined}
      aria-expanded={isOpen}
      aria-controls={ariaControlsId}
      className={iconOnly ? 'filter-button-mobile filter-button-icon-only' : 'filter-button-mobile'}
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
        backdropFilter: 'blur(10px)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.1)'
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
function DropdownPanel({ id, children, onClose }: { id?: string; children: React.ReactNode; onClose: () => void }) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') onClose(); 
    };
    document.addEventListener('keydown', onKey);
    // enfocar al abrir
    panelRef.current?.focus?.();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      id={id}
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
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
        overflow: 'hidden',
        outline: 'none',
        zIndex: 2001,
        pointerEvents: 'auto'
      }}
      className="dropdown-panel"
    >
      {children}
    </motion.div>
  );
}



