import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ZonaGroupedChips from '../profile/ZonaGroupedChips';
import RitmosChips from '../RitmosChips';
import { RITMOS_CATALOG } from '@/lib/ritmosCatalog';

// Mapeo de nombres de tags a slugs del catálogo (para compatibilidad con variaciones de nombres)
const TAG_NAME_TO_SLUG_MAP: Record<string, string> = {
  'Salsa On 1': 'salsa_on1',
  'Moderna': 'moderna',
  'Salsa On 2': 'salsa_on2',
  'Salsa Casino': 'salsa_casino',
  'Bachata tradicional': 'bachata_tradicional',
  'Bachata Tradicional': 'bachata_tradicional',
  'Bachata sensual': 'bachata_sensual',
  'Bachata Sensual': 'bachata_sensual',
  'Merengue': 'merengue',
  'Cumbia': 'cumbia',
  'Timba': 'timba',
  'Kizomba': 'kizomba',
  'Semba': 'semba',
  'Zouk': 'zouk',
  'Hip hop': 'hiphop',
  'Hip Hop': 'hiphop',
  'Break dance': 'breakdance',
  'Reggaetón': 'reggaeton',
  'Reggaeton': 'reggaeton',
  'Twerk': 'twerk',
  'Danzón': 'danzon',
  'Rock and Roll': 'rockandroll',
  'Swing': 'swing',
  'Cha-cha-chá': 'chachacha',
  'Boogie Woogie': 'boogiewoogie',
  'Yoga': 'yoga',
  'Pilates': 'pilates',
  'Cumbia Sonidera': 'cumbia_sonidera',
};

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  purple: '#7C4DFF',
  dark: '#0F1115',
  panel: 'rgba(255,255,255,0.06)',
  line: 'rgba(255,255,255,0.12)',
  soft: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  mut: 'rgba(255,255,255,0.7)',
  ok: '#10B981',
  warn: '#F59E0B',
  err: '#EF4444',
};

export type CrearClaseValue = {
  nombre?: string;
  tipo?: 'clases sueltas' | 'paquetes' | 'coreografia' | 'entrenamiento' | 'otro' | 'personalizado';
  precio?: number | null;
  regla?: string;
  nivel?: string | null;
  descripcion?: string;
  fechaModo?: 'especifica' | 'semanal' | 'por_agendar';
  fecha?: string;
  diaSemana?: number | null;
  diasSemana?: number[]; // Array de días de la semana (0=Dom, 1=Lun, ..., 6=Sab)
  horarioModo?: 'especifica' | 'duracion';
  inicio?: string;
  fin?: string;
  duracionHoras?: number | null;
  ritmoId?: number | null;
  ritmoIds?: number[];
  zonaId?: number | null;
  ubicacion?: string;
  ubicacionNombre?: string;
  ubicacionDireccion?: string;
  ubicacionNotas?: string;
  ubicacionId?: string | null;
};

type Tag = { id: number; nombre: string };

type Props = {
  value?: CrearClaseValue;
  editIndex?: number | null;
  editValue?: CrearClaseValue;
  onChange?: (v: CrearClaseValue) => void;
  onSubmit?: (v: CrearClaseValue) => void | Promise<void>;
  onCancel?: () => void;
  ritmos: Tag[];
  zonas: Tag[];
  zonaTags?: Array<{ id: number; nombre: string; slug?: string; tipo?: string }>;
  selectedZonaIds?: number[];
  locations?: Array<{ id?: string; nombre?: string; direccion?: string; referencias?: string; zonas?: number[] | null }>; // para seleccionar
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  enableDate?: boolean;
};

const card: React.CSSProperties = {
  position: 'relative',
  borderRadius: 20,
  background: 'linear-gradient(135deg, rgba(19,21,27,0.9), rgba(16,18,24,0.9))',
  padding: 20,
  overflow: 'hidden',
  border: `1px solid ${colors.line}`,
  boxShadow: '0 18px 44px rgba(0,0,0,0.45)',
  backdropFilter: 'blur(10px)'
};

const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
const label: React.CSSProperties = { fontSize: 12, color: colors.mut, marginBottom: 6, letterSpacing: .2 };

const fieldShell = (invalid = false): React.CSSProperties => ({
  position: 'relative',
  borderRadius: 12,
  border: `1px solid ${invalid ? colors.err + '66' : colors.line}`,
  background: colors.panel,
  transition: 'all .2s ease',
  boxShadow: invalid ? '0 0 0 3px rgba(239,68,68,0.15)' : 'inset 0 0 0 1px rgba(255,255,255,0.02)',
});

const inputBase: React.CSSProperties = {
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: colors.text,
  padding: '12px 14px 12px 40px',
  fontSize: 14,
};

const leftIcon = (emoji = '🎛️'): React.CSSProperties => ({
  position: 'absolute',
  left: 10,
  top: 9,
  width: 22,
  height: 22,
  borderRadius: 8,
  display: 'grid',
  placeItems: 'center',
  fontSize: 14,
  opacity: .9
});

const chipWrap: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const chip = (active: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  borderRadius: 999,
  border: active ? `1px solid ${colors.blue}` : `1px solid ${colors.soft}`,
  background: active ? 'linear-gradient(135deg, rgba(30,136,229,0.22), rgba(124,77,255,0.18))' : 'rgba(255,255,255,0.04)',
  color: active ? colors.text : colors.mut,
  fontSize: 13,
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all .15s ease',
  boxShadow: active ? '0 6px 16px rgba(30,136,229,0.25)' : 'none'
});

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  margin: '18px 0 10px'
};

const divider: React.CSSProperties = {
  height: 1,
  background: colors.line,
  margin: '10px 0 14px',
  borderRadius: 1
};

const helpText = (warn = false): React.CSSProperties => ({
  fontSize: 12,
  color: warn ? colors.warn : colors.mut,
  marginTop: 6
});

const normalizeTime = (t?: string) => {
  if (!t) return '';
  const [hh = '', mm = ''] = t.split(':');
  return `${hh.padStart(2, '0')}:${(mm || '00').padStart(2, '0')}`;
};

const tipos: Array<NonNullable<CrearClaseValue['tipo']>> = [
  'clases sueltas', 'paquetes', 'coreografia', 'entrenamiento', 'otro', 'personalizado'
];

const diasSemana = [
  { id: 0, nombre: 'Domingo' },
  { id: 1, nombre: 'Lunes' },
  { id: 2, nombre: 'Martes' },
  { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' },
  { id: 5, nombre: 'Viernes' },
  { id: 6, nombre: 'Sábado' },
];

// Convertir números a nombres de días (para guardar en backend)
const numberToDayName = (num: number): string | null => {
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return (num >= 0 && num <= 6) ? dayNames[num] : null;
};

// Convertir nombres de días a números (para cargar desde backend)
const dayNameToNumber = (dayName: string | number): number | null => {
  if (typeof dayName === 'number') return dayName;
  const normalized = String(dayName).toLowerCase().trim();
  const map: Record<string, number> = {
    'domingo': 0, 'dom': 0,
    'lunes': 1, 'lun': 1,
    'martes': 2, 'mar': 2,
    'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
    'jueves': 4, 'jue': 4,
    'viernes': 5, 'vie': 5,
    'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
  };
  return map[normalized] ?? null;
};

const niveles = [
  'Todos los niveles',
  'Principiante',
  'Intermedio',
  'Avanzado'
] as const;

export default function CrearClase({
  value,
  editIndex,
  editValue,
  onChange,
  onSubmit,
  onCancel,
  ritmos,
  zonas,
  zonaTags = [],
  selectedZonaIds = [],
  locations,
  title = 'Crear Clase',
  style,
  className,
  enableDate = true
}: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  // Usar ref para onChange para evitar cambios en el array de dependencias
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  const [form, setForm] = useState<CrearClaseValue>({
    nombre: value?.nombre || '',
    tipo: value?.tipo || 'clases sueltas',
    precio: value?.precio ?? null,
    regla: value?.regla || '',
    nivel: value?.nivel ?? null,
    descripcion: value?.descripcion || '',
    fechaModo: enableDate ? (value?.fechaModo || 'especifica') : undefined,
    fecha: enableDate ? (value?.fecha || '') : undefined,
    diaSemana: enableDate ? (value?.diaSemana ?? null) : null,
    diasSemana: enableDate && value?.diasSemana && Array.isArray(value.diasSemana) ? (() => {
      // Convertir strings a números si es necesario
      return value.diasSemana.map((d: string | number) => typeof d === 'number' ? d : dayNameToNumber(d)).filter((d: number | null) => d !== null) as number[];
    })() : (value?.diaSemana !== null && value?.diaSemana !== undefined ? [value.diaSemana] : []),
    horarioModo: value?.horarioModo || (value?.duracionHoras ? 'duracion' : (value?.fechaModo === 'por_agendar' ? 'duracion' : 'especifica')),
    inicio: normalizeTime(value?.inicio),
    fin: normalizeTime(value?.fin),
    duracionHoras: value?.duracionHoras ?? null,
    ritmoId: value?.ritmoId ?? (value?.ritmoIds && value.ritmoIds.length ? value.ritmoIds[0] ?? null : null),
    ritmoIds: value?.ritmoIds ? [...value.ritmoIds] : (value?.ritmoId ? [value.ritmoId] : []),
    zonaId: value?.zonaId ?? null,
    ubicacion: value?.ubicacion || '',
    ubicacionNombre: value?.ubicacionNombre || '',
    ubicacionDireccion: value?.ubicacionDireccion || '',
    ubicacionNotas: value?.ubicacionNotas || '',
    ubicacionId: value?.ubicacionId ?? null,
  });

  // Synchronize form when editing value changes
  useEffect(() => {
    const effective = editValue || value;
    if (effective) {
      setForm({
        nombre: effective?.nombre || '',
        tipo: effective?.tipo || 'clases sueltas',
        precio: effective?.precio ?? null,
        regla: effective?.regla || '',
        nivel: effective?.nivel ?? null,
        descripcion: effective?.descripcion || '',
        fechaModo: enableDate ? (effective?.fechaModo || 'especifica') : undefined,
        fecha: enableDate ? (effective?.fecha || '') : undefined,
        diaSemana: enableDate ? (effective?.diaSemana ?? null) : null,
        diasSemana: enableDate && effective?.diasSemana && Array.isArray(effective.diasSemana) ? (() => {
      // Convertir strings a números si es necesario
      return effective.diasSemana.map((d: string | number) => typeof d === 'number' ? d : dayNameToNumber(d)).filter((d: number | null) => d !== null) as number[];
    })() : (effective?.diaSemana !== null && effective?.diaSemana !== undefined ? [effective.diaSemana] : []),
        horarioModo: effective?.horarioModo || (effective?.duracionHoras ? 'duracion' : (effective?.fechaModo === 'por_agendar' ? 'duracion' : 'especifica')),
        inicio: normalizeTime(effective?.inicio),
        fin: normalizeTime(effective?.fin),
        duracionHoras: effective?.duracionHoras ?? null,
        ritmoId: effective?.ritmoId ?? (effective?.ritmoIds && effective.ritmoIds.length ? effective.ritmoIds[0] ?? null : null),
        ritmoIds: effective?.ritmoIds ? [...effective.ritmoIds] : (effective?.ritmoId ? [effective.ritmoId] : []),
        zonaId: effective?.zonaId ?? null,
        ubicacion: effective?.ubicacion || '',
        ubicacionNombre: effective?.ubicacionNombre || '',
        ubicacionDireccion: effective?.ubicacionDireccion || '',
        ubicacionNotas: effective?.ubicacionNotas || '',
        ubicacionId: effective?.ubicacionId ?? null,
      });
      setIsOpen(true);
      setSelectedLocationId((effective?.ubicacionId as any) || '');
    }
  }, [value, editValue]);

  // Sincronizar campos de ubicación cuando cambia la selección del dropdown
  useEffect(() => {
    if (!locations || !Array.isArray(locations)) return;
    if (selectedLocationId) {
      const sel = locations.find(l => (l.id || '') === selectedLocationId);
      if (sel) {
        setForm(prev => ({
          ...prev,
          ubicacionId: selectedLocationId,
          ubicacionNombre: sel.nombre || '',
          ubicacionDireccion: sel.direccion || '',
          ubicacionNotas: sel.referencias || ''
        }));
      }
    } else {
      // Modo manual
      setForm(prev => ({
        ...prev,
        ubicacionId: null
      }));
    }
  }, [selectedLocationId, locations]);

  const updateForm = useCallback((updater: (prev: CrearClaseValue) => CrearClaseValue) => {
    setForm(prev => {
      const next = updater(prev);
      onChange?.(next);
      return next;
    });
  }, [onChange]);

  // Ajustar horarioModo cuando cambia fechaModo a 'por_agendar'
  useEffect(() => {
    if (enableDate && form.fechaModo === 'por_agendar' && form.horarioModo !== 'duracion') {
      setForm(prev => {
        const updated = {
          ...prev,
          horarioModo: 'duracion' as const,
          // Limpiar inicio y fin cuando se cambia a por_agendar
          inicio: undefined,
          fin: undefined
        };
        // Usar ref para onChange para mantener array de dependencias estable
        onChangeRef.current?.(updated);
        return updated;
      });
    }
  }, [form.fechaModo, form.horarioModo, enableDate]);

  const setField = useCallback((k: keyof CrearClaseValue, v: any) => {
    updateForm(prev => ({ ...prev, [k]: v }));
  }, [updateForm]);

  const toggleRitmoChip = useCallback((ritmoId: number) => {
    updateForm(prev => {
      const baseIds = prev.ritmoIds && prev.ritmoIds.length
        ? prev.ritmoIds
        : (prev.ritmoId !== null && prev.ritmoId !== undefined ? [prev.ritmoId] : []);
      const exists = baseIds.includes(ritmoId);
      const nextIds = exists ? baseIds.filter(id => id !== ritmoId) : [...baseIds, ritmoId];
      return {
        ...prev,
        ritmoIds: nextIds,
        ritmoId: nextIds.length ? nextIds[0] ?? null : null,
      };
    });
  }, [updateForm]);

  // Convertir ritmos disponibles (tag IDs) a slugs del catálogo para allowedIds
  const allowedRitmoSlugs = useMemo(() => {
    // Si no hay ritmos disponibles, mostrar todos (undefined = sin filtro)
    if (!ritmos || ritmos.length === 0) return undefined;
    
    // Crear mapa de tag nombre → catálogo slug (usando normalizeRitmos para mejor compatibilidad)
    const nameToSlug = new Map<string, string>();
    RITMOS_CATALOG.forEach(g => {
      g.items.forEach(item => {
        nameToSlug.set(item.label, item.id);
        // También agregar variaciones comunes
        nameToSlug.set(item.label.toLowerCase().trim(), item.id);
      });
    });
    
    // También usar el mapeo de nombres a slugs
    Object.entries(TAG_NAME_TO_SLUG_MAP).forEach(([name, slug]: [string, string]) => {
      nameToSlug.set(name, slug);
      nameToSlug.set(name.toLowerCase().trim(), slug);
    });
    
    // Convertir tag nombres → slugs del catálogo
    const slugs = ritmos
      .map(r => {
        if (!r || !r.nombre) return null;
        // Intentar coincidencia exacta primero
        let slug = nameToSlug.get(r.nombre);
        if (slug) {
          console.log(`[CrearClase] Mapeo encontrado (exacto): "${r.nombre}" -> "${slug}"`);
          return slug;
        }
        // Intentar case-insensitive
        slug = nameToSlug.get(r.nombre.toLowerCase().trim());
        if (slug) {
          console.log(`[CrearClase] Mapeo encontrado (case-insensitive): "${r.nombre}" -> "${slug}"`);
          return slug;
        }
        // Intentar buscar en el catálogo por label
        const catalogItem = RITMOS_CATALOG.flatMap(g => g.items).find(
          item => item.label.toLowerCase().trim() === r.nombre.toLowerCase().trim()
        );
        if (catalogItem) {
          console.log(`[CrearClase] Mapeo encontrado (catálogo): "${r.nombre}" -> "${catalogItem.id}"`);
          return catalogItem.id;
        }
        console.warn(`[CrearClase] No se encontró mapeo para: "${r.nombre}"`);
        return null;
      })
      .filter(Boolean) as string[];
    
    console.log('[CrearClase] Resultado del mapeo:', {
      ritmosInput: ritmos.map(r => r.nombre),
      slugsOutput: slugs,
      total: slugs.length
    });
    
    // Si no se encontraron coincidencias, mostrar todos (undefined = sin filtro)
    // Esto evita que el componente no se renderice cuando hay allowedIds pero no hay coincidencias
    if (slugs.length === 0) {
      console.warn('[CrearClase] No se encontraron coincidencias, mostrando todos los ritmos');
      return undefined;
    }
    
    return slugs;
  }, [ritmos]);

  // Convertir ritmoIds (tag IDs numéricos) a slugs del catálogo para RitmosChips
  // Similar a AcademyProfileEditor.tsx pero adaptado para convertir IDs → slugs
  const selectedCatalogIds = useMemo(() => {
    const ritmoIds = form.ritmoIds && form.ritmoIds.length
      ? form.ritmoIds
      : (form.ritmoId !== null && form.ritmoId !== undefined ? [form.ritmoId] : []);
    
    if (ritmoIds.length === 0 || !ritmos || ritmos.length === 0) return [];
    
    // Crear mapa de tag ID → tag nombre
    const tagIdToName = new Map<number, string>();
    ritmos.forEach(r => {
      if (r && r.id && r.nombre) {
        tagIdToName.set(r.id, r.nombre);
        // También agregar variaciones case-insensitive
        tagIdToName.set(r.id, r.nombre.toLowerCase().trim());
      }
    });
    
    // Crear mapa de tag nombre → catálogo slug
    const nameToSlug = new Map<string, string>();
    RITMOS_CATALOG.forEach(g => {
      g.items.forEach(item => {
        nameToSlug.set(item.label, item.id);
        nameToSlug.set(item.label.toLowerCase().trim(), item.id);
      });
    });
    
    // También usar el mapeo de nombres a slugs
    Object.entries(TAG_NAME_TO_SLUG_MAP).forEach(([name, slug]: [string, string]) => {
      nameToSlug.set(name, slug);
      nameToSlug.set(name.toLowerCase().trim(), slug);
    });
    
    // Convertir tag IDs → nombres → slugs
    return ritmoIds
      .map(id => {
        const tagName = tagIdToName.get(id);
        if (!tagName) return null;
        // Intentar coincidencia exacta
        let slug = nameToSlug.get(tagName);
        if (slug) return slug;
        // Intentar case-insensitive
        slug = nameToSlug.get(tagName.toLowerCase().trim());
        if (slug) return slug;
        // Intentar buscar en el catálogo por label
        const catalogItem = RITMOS_CATALOG.flatMap(g => g.items).find(
          item => item.label.toLowerCase().trim() === tagName.toLowerCase().trim()
        );
        return catalogItem?.id || null;
      })
      .filter(Boolean) as string[];
  }, [form.ritmoIds, form.ritmoId, ritmos]);

  // Manejar cambio de ritmos desde RitmosChips (slugs → tag IDs)
  // Similar a AcademyProfileEditor.tsx pero adaptado para convertir slugs → IDs
  const onChangeCatalog = useCallback((slugs: string[]) => {
    if (!ritmos || ritmos.length === 0) {
      // Si no hay ritmos disponibles, no podemos mapear
      updateForm(prev => ({
        ...prev,
        ritmoIds: [],
        ritmoId: null,
      }));
      return;
    }

    // Crear mapa de catálogo slug → tag nombre
    const slugToName = new Map<string, string>();
    RITMOS_CATALOG.forEach(g => {
      g.items.forEach(item => {
        slugToName.set(item.id, item.label);
      });
    });
    
    // Crear mapa de tag nombre → tag ID (con variaciones case-insensitive)
    const nameToTagId = new Map<string, number>();
    ritmos.forEach(r => {
      if (r && r.nombre && r.id) {
        nameToTagId.set(r.nombre, r.id);
        nameToTagId.set(r.nombre.toLowerCase().trim(), r.id);
      }
    });
    
    // Convertir slugs → nombres → tag IDs
    const tagIds = slugs
      .map(slug => {
        const catalogLabel = slugToName.get(slug);
        if (!catalogLabel) return null;
        // Intentar coincidencia exacta
        let tagId = nameToTagId.get(catalogLabel);
        if (tagId) return tagId;
        // Intentar case-insensitive
        tagId = nameToTagId.get(catalogLabel.toLowerCase().trim());
        if (tagId) return tagId;
        // Buscar en ritmos por nombre (case-insensitive)
        const matchingRitmo = ritmos.find(r => 
          r.nombre && r.nombre.toLowerCase().trim() === catalogLabel.toLowerCase().trim()
        );
        return matchingRitmo?.id || null;
      })
      .filter((id): id is number => typeof id === 'number');
    
    updateForm(prev => ({
      ...prev,
      ritmoIds: tagIds,
      ritmoId: tagIds.length > 0 ? tagIds[0] : null,
    }));
  }, [ritmos, updateForm]);

  const zonaTagSource = useMemo(() => {
    if (zonaTags && zonaTags.length) return zonaTags;
    return zonas.map((z) => ({ ...z, tipo: 'zona' as const }));
  }, [zonaTags, zonas]);

  const selectedLocation = useMemo(() => {
    if (!selectedLocationId || !locations) return null;
    return locations.find((l) => (l.id || '') === selectedLocationId) || null;
  }, [selectedLocationId, locations]);

  const selectedLocationZonaIds = useMemo(() => {
    if (!selectedLocation) return [];
    const ids = (selectedLocation as any)?.zonas || [];
    return Array.isArray(ids) ? ids.filter((id: any): id is number => typeof id === 'number') : [];
  }, [selectedLocation]);

  const manualZonaIds = useMemo(() => {
    if (selectedLocationZonaIds.length > 0) return [];
    return (selectedZonaIds || []).filter((id): id is number => typeof id === 'number');
  }, [selectedLocationZonaIds, selectedZonaIds]);

  const [zonesExpanded, setZonesExpanded] = useState(false);

  useEffect(() => {
    setZonesExpanded(false);
  }, [selectedLocationId, selectedZonaIds]);

  const canSubmit = useMemo(() => {
    const nombreOk = (form.nombre || '').trim().length > 0;
    const porAgendar = form.fechaModo === 'por_agendar';
    const horarioModo = form.horarioModo || (porAgendar ? 'duracion' : 'especifica');
    // Si es por agendar, siempre requiere duración
    const horarioOk = porAgendar 
      ? Boolean(form.duracionHoras && form.duracionHoras > 0)
      : (
        horarioModo === 'duracion' 
          ? Boolean(form.duracionHoras && form.duracionHoras > 0) 
          : Boolean(form.inicio && form.fin)
      );
    const fechaOk = enableDate
      ? form.fechaModo === 'por_agendar' ? true
        : form.fechaModo === 'especifica' ? Boolean(form.fecha)
        : (form.diasSemana && form.diasSemana.length > 0) || form.diaSemana !== null
      : true;
    return nombreOk && horarioOk && fechaOk;
  }, [form, enableDate]);

  // Validaciones visuales (solo estilos, sin cambiar estructura)
  const porAgendar = form.fechaModo === 'por_agendar';
  const horarioModo = form.horarioModo || (porAgendar ? 'duracion' : 'especifica');
  const invalid = {
    nombre: !(form.nombre || '').trim(),
    fecha: enableDate && form.fechaModo === 'especifica' && !form.fecha,
    dia: enableDate && form.fechaModo === 'semanal' && (!form.diasSemana || form.diasSemana.length === 0) && form.diaSemana === null,
    inicio: porAgendar ? false : (horarioModo === 'especifica' ? !form.inicio : false),
    fin: porAgendar ? false : (horarioModo === 'especifica' ? !form.fin : false),
    duracion: (porAgendar || horarioModo === 'duracion') ? !(form.duracionHoras && form.duracionHoras > 0) : false,
  };

  const completion = useMemo(() => {
    const total = enableDate ? 5 : 4;
    let done = 0;
    if (!invalid.nombre) done++;
    if (horarioModo === 'duracion' ? !invalid.duracion : (!invalid.inicio && !invalid.fin)) done++;
    if (enableDate) {
      if (form.fechaModo === 'por_agendar') done++;
      else if (form.fechaModo === 'especifica' ? !invalid.fecha : !invalid.dia) done++;
    }
    const hasRitmo = (form.ritmoIds && form.ritmoIds.length > 0) || !!form.ritmoId;
    if (hasRitmo) done++;
    return Math.round((done / total) * 100);
  }, [invalid, form.fechaModo, form.ritmoIds, form.ritmoId, enableDate, horarioModo]);

  const isEditing = (editIndex !== null && editIndex !== undefined) || Boolean(editValue);

  const resetForm = () => {
    const base: CrearClaseValue = {
      nombre: '',
      tipo: 'clases sueltas',
      precio: null,
      regla: '',
      nivel: null,
      descripcion: '',
      fechaModo: enableDate ? 'especifica' : undefined,
      fecha: enableDate ? '' : undefined,
      diaSemana: enableDate ? null : null,
      diasSemana: [],
      horarioModo: form.fechaModo === 'por_agendar' ? 'duracion' : 'especifica',
      inicio: '',
      fin: '',
      duracionHoras: null,
      ritmoId: null,
      ritmoIds: [],
      zonaId: null,
      ubicacion: '',
      ubicacionNombre: '',
      ubicacionDireccion: '',
      ubicacionNotas: '',
      ubicacionId: null,
    };
    setForm(base);
    onChange?.(base);
    setSelectedLocationId('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...style }} className={className}>
      <div style={{ ...card }}>
        {/* Accent bar / progreso */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${colors.blue}, ${colors.purple})` }} />
        <div style={{ position: 'absolute', top: 0, left: 0, height: 4, background: colors.ok, width: `${completion}%`, transition: 'width .25s ease' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1E88E5,#7C4DFF)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(30,136,229,0.35)' }}>➕</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: colors.text }}>{title}</h2>
            <div style={{ fontSize: 12, color: colors.mut }}>Completa los campos — {completion}%</div>
          </div>
        </div>

        {isOpen && (
          <>
            {/* NOMBRE + TIPO */}
            <div style={sectionHeader}><span>📝</span><b>Detalles</b></div>
            <div style={row}>
              <div>
                <div style={label}>Nombre</div>
                <div style={fieldShell(invalid.nombre)}>
                  <div style={leftIcon('🏷️')} />
                  <input
                    style={inputBase}
                    placeholder="Ej. Bachata Sensual"
                    value={form.nombre || ''}
                    onChange={(e) => setField('nombre', e.target.value)}
                  />
                </div>
                {invalid.nombre && <div style={helpText(true)}>Agrega un nombre</div>}
              </div>

              <div>
                <div style={label}>Tipo</div>
                <div style={chipWrap}>
                  {tipos.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setField('tipo', t)}
                      style={chip(form.tipo === t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PRECIO + REGLA */}
            <div style={sectionHeader}><span>💰</span><b>Precio</b></div>
            <div style={row}>
              <div>
                <div style={label}>Precio (opcional)</div>
                <div style={fieldShell()}>
                  <div style={leftIcon('💵')} />
                  <input
                    style={inputBase}
                    type="number"
                    min={0}
                    step="1"
                    placeholder="Ej. 200"
                    value={form.precio !== null && form.precio !== undefined ? form.precio : ''}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      // Si está vacío, guardar como null (no mostrar nada)
                      if (val === '' || val === null || val === undefined) {
                        setField('precio', null);
                      } else {
                        const num = Number(val);
                        // Number("") devuelve 0, pero queremos null si está vacío
                        // Si el valor es un número válido (incluyendo 0), guardarlo
                        if (Number.isNaN(num)) {
                          setField('precio', null);
                        } else {
                          // Permitir 0 explícitamente
                          setField('precio', num);
                        }
                      }
                    }}
                  />
                </div>
                <div style={helpText()}>Déjalo vacío para no mostrar precio. Pon <b>0</b> para marcar como Gratis</div>
              </div>

              <div>
                <div style={label}>Regla o condición</div>
                <div style={fieldShell()}>
                  <div style={leftIcon('📋')} />
                  <input
                    style={inputBase}
                    placeholder="Ej. Válido hasta el 15/Nov · 2x1 pareja"
                    value={form.regla || ''}
                    onChange={(e) => setField('regla', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* NIVEL */}
            <div style={sectionHeader}><span>🏷️</span><b>Nivel</b></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {niveles.map(n => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setField('nivel', n)}
                  style={chip(form.nivel === n)}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* DESCRIPCIÓN */}
            <div style={sectionHeader}><span>📄</span><b>Descripción</b></div>
            <div>
              <div style={label}>Descripción de la clase (opcional)</div>
              <div style={fieldShell()}>
                <div style={leftIcon('📝')} />
                <textarea
                  style={{
                    ...inputBase,
                    minHeight: '80px',
                    resize: 'vertical',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                  }}
                  placeholder="Describe la clase, qué se enseñará, requisitos, etc."
                  value={form.descripcion || ''}
                  onChange={(e) => setField('descripcion', e.target.value)}
                />
              </div>
            </div>

            {/* FECHA */}
            {enableDate && (
              <>
                <div style={sectionHeader}><span>📅</span><b>Fecha</b></div>
                <div style={row}>
                  <div>
                    <div style={label}>Modo</div>
                    <div style={chipWrap}>
                      <button type="button" style={chip(form.fechaModo === 'especifica')} onClick={() => {
                        setField('fechaModo', 'especifica');
                        // Si cambia a específica y no tiene horarioModo, establecerlo en 'especifica'
                        if (!form.horarioModo || form.horarioModo === 'duracion') {
                          setField('horarioModo', 'especifica');
                        }
                      }}>Específica</button>
                      <button type="button" style={chip(form.fechaModo === 'semanal')} onClick={() => {
                        setField('fechaModo', 'semanal');
                        // Si cambia a semanal y no tiene horarioModo, establecerlo en 'especifica'
                        if (!form.horarioModo || form.horarioModo === 'duracion') {
                          setField('horarioModo', 'especifica');
                        }
                      }}>Semanal</button>
                      <button type="button" style={chip(form.fechaModo === 'por_agendar')} onClick={() => {
                        setField('fechaModo', 'por_agendar');
                        // Cuando se elige "por agendar", establecer automáticamente horarioModo a 'duracion'
                        setField('horarioModo', 'duracion');
                      }}>Por agendar con academia</button>
                    </div>
                  </div>
                  <div>
                    {form.fechaModo === 'por_agendar' ? (
                      <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: colors.text, fontSize: 13 }}>
                        📅 La fecha y hora se acordarán directamente con la academia
                      </div>
                    ) : form.fechaModo === 'especifica' ? (
                      <>
                        <div style={fieldShell(invalid.fecha)}>
                          <div style={leftIcon('📆')} />
                          <input
                            style={inputBase}
                            type="date"
                            value={form.fecha || ''}
                            onChange={(e) => setField('fecha', e.target.value)}
                          />
                        </div>
                        {invalid.fecha && <div style={helpText(true)}>Selecciona una fecha</div>}
                      </>
                    ) : (
                      <>
                        <div style={chipWrap}>
                          {diasSemana.map(d => {
                            const diasSeleccionados = form.diasSemana || [];
                            const estaSeleccionado = diasSeleccionados.includes(d.id);
                            return (
                              <button
                                type="button"
                                key={d.id}
                                style={chip(estaSeleccionado)}
                                onClick={() => {
                                  const diasActuales = form.diasSemana || [];
                                  if (estaSeleccionado) {
                                    // Deseleccionar día
                                    const nuevosDias = diasActuales.filter((dia: number) => dia !== d.id);
                                    setField('diasSemana', nuevosDias);
                                    // Si queda un solo día, también actualizar diaSemana para compatibilidad
                                    if (nuevosDias.length === 1) {
                                      setField('diaSemana', nuevosDias[0]);
                                    } else if (nuevosDias.length === 0) {
                                      setField('diaSemana', null);
                                    }
                                  } else {
                                    // Seleccionar día
                                    const nuevosDias = [...diasActuales, d.id].sort();
                                    setField('diasSemana', nuevosDias);
                                    // Actualizar diaSemana con el primer día para compatibilidad
                                    setField('diaSemana', nuevosDias[0]);
                                  }
                                }}
                              >
                                {d.nombre}
                              </button>
                            );
                          })}
                        </div>
                        {invalid.dia && <div style={helpText(true)}>Elige al menos un día de la semana</div>}
                        {(form.diasSemana && form.diasSemana.length > 0) && (
                          <div style={helpText()}>
                            {form.diasSemana.length === 1 
                              ? `Día seleccionado: ${diasSemana.find(d => d.id === form.diasSemana![0])?.nombre}`
                              : `${form.diasSemana.length} días seleccionados: ${form.diasSemana.map(d => diasSemana.find(ds => ds.id === d)?.nombre).join(', ')}`
                            }
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* HORARIO */}
            {!porAgendar && (
              <>
                <div style={sectionHeader}><span>⏰</span><b>Horario</b></div>
                <div style={row}>
                  <div>
                    <div style={label}>Modo de horario</div>
                    <div style={chipWrap}>
                      <button 
                        type="button" 
                        style={chip(horarioModo === 'especifica')} 
                        onClick={() => setField('horarioModo', 'especifica')}
                      >
                        Hora específica
                      </button>
                      <button 
                        type="button" 
                        style={chip(horarioModo === 'duracion')} 
                        onClick={() => setField('horarioModo', 'duracion')}
                      >
                        Duración (horas)
                      </button>
                    </div>
                  </div>
                </div>
                
                {horarioModo === 'especifica' ? (
                  <div style={row}>
                    <div>
                      <div style={label}>Hora inicio (HH:MM)</div>
                      <div style={fieldShell(invalid.inicio)}>
                        <div style={leftIcon('🟢')} />
                        <input
                          type="time"
                          step={60}
                          style={inputBase}
                          value={form.inicio || ''}
                          onChange={(e) => setField('inicio', normalizeTime(e.target.value))}
                        />
                      </div>
                      {invalid.inicio && <div style={helpText(true)}>Indica la hora de inicio</div>}
                    </div>

                    <div>
                      <div style={label}>Hora fin (HH:MM)</div>
                      <div style={fieldShell(invalid.fin)}>
                        <div style={leftIcon('🔴')} />
                        <input
                          type="time"
                          step={60}
                          style={inputBase}
                          value={form.fin || ''}
                          onChange={(e) => setField('fin', normalizeTime(e.target.value))}
                        />
                      </div>
                      {invalid.fin && <div style={helpText(true)}>Indica la hora de fin</div>}
                    </div>
                  </div>
                ) : (
                  <div style={row}>
                    <div>
                      <div style={label}>Duración (horas)</div>
                      <div style={fieldShell(invalid.duracion)}>
                        <div style={leftIcon('⏱️')} />
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          style={inputBase}
                          placeholder="Ej. 1.5"
                          value={form.duracionHoras ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setField('duracionHoras', val === '' ? null : parseFloat(val));
                          }}
                        />
                      </div>
                      {invalid.duracion && <div style={helpText(true)}>Indica la duración en horas (ej: 1, 1.5, 2)</div>}
                      <div style={helpText()}>Ej: 1 = 1 hora, 1.5 = 1 hora 30 min, 2 = 2 horas</div>
                    </div>
                    <div></div>
                  </div>
                )}
              </>
            )}
            
            {/* HORARIO - Solo duración cuando es "Por agendar" */}
            {porAgendar && (
              <>
                <div style={sectionHeader}><span>⏰</span><b>Duración Estimada</b></div>
                <div style={row}>
                  <div>
                    <div style={label}>Duración (horas)</div>
                    <div style={fieldShell(invalid.duracion)}>
                      <div style={leftIcon('⏱️')} />
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        style={inputBase}
                        placeholder="Ej. 1.5"
                        value={form.duracionHoras ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setField('duracionHoras', val === '' ? null : parseFloat(val));
                        }}
                      />
                    </div>
                    {invalid.duracion && <div style={helpText(true)}>Indica la duración estimada en horas</div>}
                    <div style={helpText()}>Ej: 1 = 1 hora, 1.5 = 1 hora 30 min, 2 = 2 horas</div>
                  </div>
                  <div></div>
                </div>
              </>
            )}

            {/* RITMO + ZONA */}
            <div style={sectionHeader}><span>🎶</span><b>Ritmo</b></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={label}>Ritmos (puedes elegir varios)</div>
                <div >
                  <RitmosChips 
                    selected={selectedCatalogIds} 
                    onChange={onChangeCatalog}
                    allowedIds={allowedRitmoSlugs}
                  />
                </div>
                {(!form.ritmoIds || form.ritmoIds.length === 0) && (
                  <div style={helpText()}>
                    Opcional, pero sugerido: seleccionar ritmos ayuda a mejorar el descubrimiento
                  </div>
                )}
              </div>

             {/*  <div>
                <div style={label}>Zona</div>   
                <div style={chipWrap}>
                  {zonas.map(z => (
                    <button
                      type="button"
                      key={z.id}
                      style={chip(form.zonaId === z.id)}
                      onClick={() => setField('zonaId', z.id)}
                      title={z.nombre}
                    >
                      {z.nombre}
                    </button>
                  ))}
                </div>
              </div> */}
            </div>

            {/* UBICACIÓN */}
            <div style={sectionHeader}><span>📍</span><b>Ubicación</b></div>
            {Array.isArray(locations) && locations.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={label}>Elegir ubicación existente</div>
                <div style={fieldShell()}>
                  <select
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: colors.text,
                      outline: 'none',
                      fontSize: 14,
                      borderRadius: 8,
                      WebkitAppearance: 'none' as any,
                      appearance: 'none' as any
                    }}
                    value={selectedLocationId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setSelectedLocationId(nextId);
                      setField('ubicacionId', nextId || null);
                      const sel = locations.find(l => (l.id || '') === nextId);
                      if (sel && nextId) {
                        setField('ubicacionNombre', sel.nombre || '');
                        setField('ubicacionDireccion', sel.direccion || '');
                        setField('ubicacionNotas', sel.referencias || '');
                      } else {
                        setField('ubicacionNombre', '');
                        setField('ubicacionDireccion', '');
                        setField('ubicacionNotas', '');
                      }
                    }}
                  >
                    <option value="" style={{ color: '#111' }}>— Escribir manualmente —</option>
                    {locations.map((l, i) => (
                      <option key={l.id || i} value={l.id || ''} style={{ color: '#111' }}>{l.nombre || l.direccion || 'Ubicación'}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={label}>Nombre de la ubicación</div>
                <div style={fieldShell()}>
                  <div style={leftIcon('🏢')} />
                  <input
                    style={inputBase}
                    placeholder="Ej. Sede Centro / Salón Principal"
                    value={form.ubicacionNombre || ''}
                    onChange={(e) => setField('ubicacionNombre', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div style={label}>Dirección</div>
                <div style={fieldShell()}>
                  <div style={leftIcon('📍')} />
                  <input
                    style={inputBase}
                    placeholder="Calle, número, colonia, ciudad"
                    value={form.ubicacionDireccion || ''}
                    onChange={(e) => setField('ubicacionDireccion', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={label}>Notas o referencias</div>
              <div style={fieldShell()}>
                <div style={leftIcon('📝')} />
                <input
                  style={inputBase}
                  placeholder="Ej. Entrada por la puerta lateral, 2do piso"
                  value={form.ubicacionNotas || ''}
                  onChange={(e) => setField('ubicacionNotas', e.target.value)}
                />
              </div>
            </div>
            {(() => {
              const zoneIdsToShow = selectedLocationZonaIds.length
                ? selectedLocationZonaIds
                : manualZonaIds;
              if (!zoneIdsToShow || zoneIdsToShow.length === 0 || zonaTagSource.length === 0) {
                return null;
              }
              const isLocationDriven = selectedLocationZonaIds.length > 0;

              return (
                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => setZonesExpanded(prev => !prev)}
                    style={{
                      ...chip(zonesExpanded),
                      padding: '6px 10px',
                      fontSize: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isLocationDriven ? 'Zonas (ubicación)' : 'Zonas (perfil)'}
                    <span style={{ fontSize: 12 }}>{zonesExpanded ? '▾' : '▸'}</span>
                  </button>
                  {zonesExpanded && (
                    <div style={{ marginTop: 8 }}>
                      <ZonaGroupedChips
                        selectedIds={zoneIdsToShow}
                        allTags={zonaTagSource}
                        mode="display"
                        autoExpandSelectedParents={false}
                        style={{
                          gap: '4px',
                          fontSize: 12,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={divider} />
          </>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={() => {
              setSubmitState('idle');
              resetForm();
              setIsOpen(false);
              onCancel?.();
            }}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              border: `1px solid ${colors.line}`,
              background: 'transparent',
              color: colors.text,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>

          <motion.button
            whileHover={{ y: (!isOpen || (isOpen && submitState === 'idle' && canSubmit)) ? -1 : 0 }}
            whileTap={{ scale: (!isOpen || (isOpen && submitState === 'idle' && canSubmit)) ? 0.98 : 1 }}
            disabled={isOpen ? (submitState === 'saving' || !canSubmit) : false}
            onClick={async () => {
              if (!isOpen) { setIsOpen(true); return; }
              if (submitState === 'saving') return;
              try {
                setSubmitState('saving');
                const submission = enableDate ? form : (() => {
                  const { fecha, fechaModo, diaSemana, ...rest } = form;
                  return rest as CrearClaseValue;
                })();
                await Promise.resolve(onSubmit?.(submission));
                setSubmitState('success');
                // Reiniciar siempre después de éxito (tanto crear como editar)
                resetForm();
                setTimeout(() => { setSubmitState('idle'); setIsOpen(false); }, 2200);
              } catch (e) {
                setSubmitState('error');
                setTimeout(() => setSubmitState('idle'), 2500);
              }
            }}
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              border: `1px solid ${colors.line}`,
              background: submitState === 'saving' ? colors.soft : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.text,
              fontWeight: 800,
              cursor: (!isOpen || (isOpen && submitState === 'idle' && canSubmit)) ? 'pointer' : (submitState === 'saving' ? 'wait' : 'not-allowed'),
              boxShadow: (submitState === 'saving') ? 'none' : '0 10px 24px rgba(30,136,229,0.35)'
            }}
          >
            {(() => {
              if (!isOpen) return 'Crear clase →';
              if (submitState === 'saving') return isEditing ? 'Guardando...' : 'Creando...';
              if (submitState === 'success') return isEditing ? '✅ Clase actualizada' : '✅ Clase creada';
              if (submitState === 'error') return isEditing ? '❌ Error al actualizar' : '❌ Error al crear';
              return isEditing ? 'Guardar cambios' : 'Crear clase →';
            })()}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
