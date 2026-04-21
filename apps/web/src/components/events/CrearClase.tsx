import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  Calendar,
  MapPin,
  Music,
  Save,
  Tag,
  X,
} from 'lucide-react';
import '@/styles/crearClase.css';
import ZonaGroupedChips from '../profile/ZonaGroupedChips';
import RitmosChips from '../RitmosChips';
import { RITMOS_CATALOG } from '@/lib/ritmosCatalog';

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

export type CrearClaseValue = {
  nombre?: string;
  tipo?: 'clases sueltas' | 'paquetes' | 'coreografia' | 'entrenamiento' | 'otro' | 'personalizado';
  precio?: number | null;
  regla?: string;
  /** Niveles elegidos en el formulario (solo etiquetas del catálogo). */
  niveles?: string[];
  /** Valor persistido / legado: uno o varios niveles unidos con " · ". */
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
  /** Perfil editor: el formulario inicia colapsado; al editar una clase se expande solo. */
  defaultExpanded?: boolean;
};

const normalizeTime = (t?: string) => {
  if (!t) return '';
  const [hh = '', mm = ''] = t.split(':');
  return `${hh.padStart(2, '0')}:${(mm || '00').padStart(2, '0')}`;
};

const tipos: Array<NonNullable<CrearClaseValue['tipo']>> = [
  'clases sueltas', 'paquetes', 'coreografia', 'entrenamiento', 'otro', 'personalizado'
];

/** Solo tiene sentido persistir precio cuando el tipo es "clases sueltas". */
export function normalizePrecioForTipo(
  tipo: CrearClaseValue['tipo'] | undefined,
  precio: number | null | undefined
): number | null {
  if (tipo !== 'clases sueltas') return null;
  if (precio === null || precio === undefined) return null;
  return precio === 0 ? 0 : precio;
}

const diasSemana = [
  { id: 0, nombre: 'Domingo' },
  { id: 1, nombre: 'Lunes' },
  { id: 2, nombre: 'Martes' },
  { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' },
  { id: 5, nombre: 'Viernes' },
  { id: 6, nombre: 'Sábado' },
];

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

type NivelChip = (typeof niveles)[number];

const NIVEL_CODES: Record<string, NivelChip> = {
  '0': 'Todos los niveles',
  '1': 'Principiante',
  '2': 'Intermedio',
  '3': 'Avanzado',
};

const nivelesSet = new Set<string>(niveles);

function nivelesToNivelString(arr: string[] | undefined | null): string | null {
  if (!arr || arr.length === 0) return null;
  return arr.join(' · ');
}

/** Interpreta nivel guardado o array explícito hacia chips seleccionables. */
function parseNivelesFromStored(
  nivel: string | number | null | undefined,
  nivelesArr: string[] | undefined | null
): string[] {
  if (nivelesArr && nivelesArr.length) {
    return nivelesArr.filter((x) => nivelesSet.has(x));
  }
  if (nivel === null || nivel === undefined) return [];
  const raw = String(nivel).trim();
  if (!raw) return [];
  if (NIVEL_CODES[raw]) return [NIVEL_CODES[raw]];
  const parts = raw.split(/\s*·\s*|\s*,\s*|\s*\/\s*/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    if (nivelesSet.has(part)) {
      out.push(part);
      continue;
    }
    const byLower = niveles.find((n) => n.toLowerCase() === part.toLowerCase());
    if (byLower) out.push(byLower);
  }
  return [...new Set(out)];
}

const CrearClase = React.memo(function CrearClase({
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
  enableDate = true,
  defaultExpanded = false,
}: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(defaultExpanded);
  const prevEditingRef = useRef(false);

  /** Al entrar en edición (índice o datos) se expande; al salir se colapsa de nuevo. */
  useEffect(() => {
    const editing =
      (editIndex !== null && editIndex !== undefined) || Boolean(editValue);
    if (editing && !prevEditingRef.current) {
      setIsOpen(true);
    }
    if (!editing && prevEditingRef.current) {
      setIsOpen(false);
    }
    prevEditingRef.current = editing;
  }, [editIndex, editValue]);
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
    precio: normalizePrecioForTipo(value?.tipo, value?.precio),
    regla: value?.regla || '',
    niveles: parseNivelesFromStored(value?.nivel, value?.niveles),
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

  // Usar refs para comparar valores anteriores y evitar loops infinitos
  const prevValueRef = useRef<CrearClaseValue | undefined>(undefined);
  const prevEditValueRef = useRef<CrearClaseValue | undefined>(undefined);

  // Synchronize form when editing value changes
  useEffect(() => {
    const effective = editValue || value;
    
    // Comparar si realmente cambió el valor para evitar loops
    const prevEffective = editValue ? prevEditValueRef.current : prevValueRef.current;
    const hasChanged = !prevEffective || 
      prevEffective.nombre !== effective?.nombre ||
      prevEffective.tipo !== effective?.tipo ||
      prevEffective.precio !== effective?.precio ||
      prevEffective.regla !== effective?.regla ||
      JSON.stringify(parseNivelesFromStored(prevEffective?.nivel, prevEffective?.niveles)) !==
        JSON.stringify(parseNivelesFromStored(effective?.nivel, effective?.niveles)) ||
      prevEffective.descripcion !== effective?.descripcion ||
      prevEffective.fechaModo !== effective?.fechaModo ||
      prevEffective.fecha !== effective?.fecha ||
      prevEffective.diaSemana !== effective?.diaSemana ||
      JSON.stringify(prevEffective.diasSemana) !== JSON.stringify(effective?.diasSemana) ||
      prevEffective.horarioModo !== effective?.horarioModo ||
      prevEffective.inicio !== effective?.inicio ||
      prevEffective.fin !== effective?.fin ||
      prevEffective.duracionHoras !== effective?.duracionHoras ||
      prevEffective.ritmoId !== effective?.ritmoId ||
      JSON.stringify(prevEffective.ritmoIds) !== JSON.stringify(effective?.ritmoIds) ||
      prevEffective.zonaId !== effective?.zonaId ||
      prevEffective.ubicacion !== effective?.ubicacion ||
      prevEffective.ubicacionNombre !== effective?.ubicacionNombre ||
      prevEffective.ubicacionDireccion !== effective?.ubicacionDireccion ||
      prevEffective.ubicacionNotas !== effective?.ubicacionNotas ||
      prevEffective.ubicacionId !== effective?.ubicacionId;

    if (effective && hasChanged) {
      setForm({
        nombre: effective?.nombre || '',
        tipo: effective?.tipo || 'clases sueltas',
        precio: normalizePrecioForTipo(effective?.tipo, effective?.precio),
        regla: effective?.regla || '',
        niveles: parseNivelesFromStored(effective?.nivel, effective?.niveles),
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
      setSelectedLocationId((effective?.ubicacionId as any) || '');
      
      // Actualizar refs
      if (editValue) {
        prevEditValueRef.current = { ...effective };
      } else {
        prevValueRef.current = { ...effective };
      }
    }
  }, [value, editValue, enableDate]);

  // Memoizar locations para evitar recreación en cada render
  const locationsMemo = useMemo(() => {
    if (!locations || !Array.isArray(locations)) return locations;
    return locations;
  }, [
    locations?.length,
    // Crear una clave estable basada en el contenido
    locations ? JSON.stringify(locations.map(l => ({ id: l.id, nombre: l.nombre, direccion: l.direccion }))) : null
  ]);

  // Sincronizar campos de ubicación cuando cambia la selección del dropdown
  useEffect(() => {
    if (!locationsMemo || !Array.isArray(locationsMemo)) return;
    if (selectedLocationId) {
      const sel = locationsMemo.find(l => (l.id || '') === selectedLocationId);
      if (sel) {
        setForm(prev => {
          // Solo actualizar si realmente cambió algo
          if (prev.ubicacionId === selectedLocationId && 
              prev.ubicacionNombre === (sel.nombre || '') &&
              prev.ubicacionDireccion === (sel.direccion || '') &&
              prev.ubicacionNotas === (sel.referencias || '')) {
            return prev;
          }
          return {
            ...prev,
            ubicacionId: selectedLocationId,
            ubicacionNombre: sel.nombre || '',
            ubicacionDireccion: sel.direccion || '',
            ubicacionNotas: sel.referencias || ''
          };
        });
      }
    } else {
      // Modo manual - solo actualizar si ubicacionId no es null
      setForm(prev => {
        if (prev.ubicacionId === null) return prev;
        return {
          ...prev,
          ubicacionId: null
        };
      });
    }
  }, [selectedLocationId, locationsMemo]);

  const updateForm = useCallback((updater: (prev: CrearClaseValue) => CrearClaseValue) => {
    setForm(prev => {
      const next = updater(prev);
      onChange?.({ ...next, nivel: nivelesToNivelString(next.niveles) });
      return next;
    });
  }, [onChange]);

  // Temporal: UI sin "Por agendar" ni modo horario "Duracion" — normalizar datos legacy al cargar / al cambiar modo
  useEffect(() => {
    if (!enableDate) return;
    setForm(prev => {
      let fechaModo = prev.fechaModo;
      let horarioModo = prev.horarioModo;
      if (fechaModo === 'por_agendar') fechaModo = 'semanal';
      if (fechaModo !== 'por_agendar' && horarioModo === 'duracion') horarioModo = 'especifica';
      if (fechaModo === prev.fechaModo && horarioModo === prev.horarioModo) return prev;
      const next = { ...prev, fechaModo, horarioModo };
      onChangeRef.current?.({ ...next, nivel: nivelesToNivelString(next.niveles) });
      return next;
    });
  }, [enableDate, form.fechaModo, form.horarioModo]);

  const setField = useCallback((k: keyof CrearClaseValue, v: any) => {
    updateForm(prev => ({ ...prev, [k]: v }));
  }, [updateForm]);

  const toggleNivelChip = useCallback((n: NivelChip) => {
    updateForm(prev => {
      const cur = prev.niveles ?? [];
      const TODOS: NivelChip = 'Todos los niveles';
      if (n === TODOS) {
        const next = cur.includes(TODOS) ? [] : [TODOS];
        return { ...prev, niveles: next };
      }
      let next = cur.filter((x) => x !== TODOS);
      if (next.includes(n)) next = next.filter((x) => x !== n);
      else next = [...next, n];
      return { ...prev, niveles: next };
    });
  }, [updateForm]);

  const allowedRitmoSlugs = useMemo(() => {
    if (!ritmos || ritmos.length === 0) return undefined;

    const nameToSlug = new Map<string, string>();
    RITMOS_CATALOG.forEach((g) => {
      g.items.forEach((item) => {
        nameToSlug.set(item.label, item.id);
        nameToSlug.set(item.label.toLowerCase().trim(), item.id);
      });
    });

    Object.entries(TAG_NAME_TO_SLUG_MAP).forEach(([name, slug]) => {
      nameToSlug.set(name, slug);
      nameToSlug.set(name.toLowerCase().trim(), slug);
    });

    const slugs = ritmos
      .map((r) => {
        if (!r?.nombre) return null;
        let slug = nameToSlug.get(r.nombre);
        if (slug) return slug;
        slug = nameToSlug.get(r.nombre.toLowerCase().trim());
        if (slug) return slug;
        const catalogItem = RITMOS_CATALOG.flatMap((g) => g.items).find(
          (item) => item.label.toLowerCase().trim() === r.nombre.toLowerCase().trim(),
        );
        return catalogItem?.id || null;
      })
      .filter(Boolean) as string[];

    return slugs.length === 0 ? undefined : slugs;
  }, [ritmos]);

  const selectedCatalogIds = useMemo(() => {
    const ritmoIds = form.ritmoIds && form.ritmoIds.length
      ? form.ritmoIds
      : (form.ritmoId !== null && form.ritmoId !== undefined ? [form.ritmoId] : []);

    if (ritmoIds.length === 0 || !ritmos || ritmos.length === 0) return [];

    const tagIdToName = new Map<number, string>();
    ritmos.forEach((r) => {
      if (r?.id && r?.nombre) {
        tagIdToName.set(r.id, r.nombre);
        tagIdToName.set(r.id, r.nombre.toLowerCase().trim());
      }
    });

    const nameToSlug = new Map<string, string>();
    RITMOS_CATALOG.forEach((g) => {
      g.items.forEach((item) => {
        nameToSlug.set(item.label, item.id);
        nameToSlug.set(item.label.toLowerCase().trim(), item.id);
      });
    });

    Object.entries(TAG_NAME_TO_SLUG_MAP).forEach(([name, slug]) => {
      nameToSlug.set(name, slug);
      nameToSlug.set(name.toLowerCase().trim(), slug);
    });

    return ritmoIds
      .map((id) => {
        const tagName = tagIdToName.get(id);
        if (!tagName) return null;
        let slug = nameToSlug.get(tagName);
        if (slug) return slug;
        slug = nameToSlug.get(tagName.toLowerCase().trim());
        if (slug) return slug;
        const catalogItem = RITMOS_CATALOG.flatMap((g) => g.items).find(
          (item) => item.label.toLowerCase().trim() === tagName.toLowerCase().trim(),
        );
        return catalogItem?.id || null;
      })
      .filter(Boolean) as string[];
  }, [form.ritmoIds, form.ritmoId, ritmos]);

  const onChangeCatalog = useCallback((slugs: string[]) => {
    if (!ritmos || ritmos.length === 0) {
      updateForm((prev) => ({
        ...prev,
        ritmoIds: [],
        ritmoId: null,
      }));
      return;
    }

    const slugToName = new Map<string, string>();
    RITMOS_CATALOG.forEach((g) => {
      g.items.forEach((item) => {
        slugToName.set(item.id, item.label);
      });
    });

    const nameToTagId = new Map<string, number>();
    ritmos.forEach((r) => {
      if (r?.nombre && r?.id) {
        nameToTagId.set(r.nombre, r.id);
        nameToTagId.set(r.nombre.toLowerCase().trim(), r.id);
      }
    });

    const tagIds = slugs
      .map((slug) => {
        const catalogLabel = slugToName.get(slug);
        if (!catalogLabel) return null;
        let tagId = nameToTagId.get(catalogLabel);
        if (tagId) return tagId;
        tagId = nameToTagId.get(catalogLabel.toLowerCase().trim());
        if (tagId) return tagId;
        const matchingRitmo = ritmos.find(
          (r) => r.nombre && r.nombre.toLowerCase().trim() === catalogLabel.toLowerCase().trim(),
        );
        return matchingRitmo?.id || null;
      })
      .filter((id): id is number => typeof id === 'number');

    updateForm((prev) => ({
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
    const nextHorarioModo = form.horarioModo || (porAgendar ? 'duracion' : 'especifica');
    const horarioOk = porAgendar
      ? Boolean(form.duracionHoras && form.duracionHoras > 0)
      : nextHorarioModo === 'duracion'
        ? Boolean(form.duracionHoras && form.duracionHoras > 0)
        : Boolean(form.inicio && form.fin);
    const fechaOk = enableDate
      ? form.fechaModo === 'por_agendar'
        ? true
        : form.fechaModo === 'especifica'
          ? Boolean(form.fecha)
          : (form.diasSemana && form.diasSemana.length > 0) || form.diaSemana !== null
      : true;
    return nombreOk && horarioOk && fechaOk;
  }, [enableDate, form]);

  const porAgendar = form.fechaModo === 'por_agendar';
  const horarioModo = form.horarioModo || (porAgendar ? 'duracion' : 'especifica');
  const isTipoClase = form.tipo === 'clases sueltas';
  const invalid = {
    nombre: !(form.nombre || '').trim(),
    fecha: enableDate && form.fechaModo === 'especifica' && !form.fecha,
    dia: enableDate && form.fechaModo === 'semanal' && (!form.diasSemana || form.diasSemana.length === 0) && form.diaSemana === null,
    inicio: porAgendar ? false : (horarioModo === 'especifica' ? !form.inicio : false),
    fin: porAgendar ? false : (horarioModo === 'especifica' ? !form.fin : false),
    duracion: (porAgendar || horarioModo === 'duracion') ? !(form.duracionHoras && form.duracionHoras > 0) : false,
  };

  const isEditing = (editIndex !== null && editIndex !== undefined) || Boolean(editValue);

  const resetForm = () => {
    const base: CrearClaseValue = {
      nombre: '',
      tipo: 'clases sueltas',
      precio: null,
      regla: '',
      niveles: [],
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
    onChange?.({ ...base, nivel: null });
    setSelectedLocationId('');
  };

  const normalizeComparable = useCallback((source?: CrearClaseValue | null) => ({
    nombre: source?.nombre || '',
    tipo: source?.tipo || 'clases sueltas',
    precio: normalizePrecioForTipo(source?.tipo, source?.precio),
    regla: source?.regla || '',
    niveles: parseNivelesFromStored(source?.nivel, source?.niveles),
    descripcion: source?.descripcion || '',
    fechaModo: enableDate ? (source?.fechaModo || 'especifica') : undefined,
    fecha: enableDate ? (source?.fecha || '') : undefined,
    diaSemana: enableDate ? (source?.diaSemana ?? null) : null,
    diasSemana: enableDate && Array.isArray(source?.diasSemana)
      ? source!.diasSemana!.map((d: string | number) => typeof d === 'number' ? d : dayNameToNumber(d)).filter((d: number | null) => d !== null)
      : (source?.diaSemana !== null && source?.diaSemana !== undefined ? [source.diaSemana] : []),
    horarioModo: source?.horarioModo || (source?.duracionHoras ? 'duracion' : (source?.fechaModo === 'por_agendar' ? 'duracion' : 'especifica')),
    inicio: normalizeTime(source?.inicio),
    fin: normalizeTime(source?.fin),
    duracionHoras: source?.duracionHoras ?? null,
    ritmoId: source?.ritmoId ?? (source?.ritmoIds && source.ritmoIds.length ? source.ritmoIds[0] ?? null : null),
    ritmoIds: source?.ritmoIds ? [...source.ritmoIds] : (source?.ritmoId ? [source.ritmoId] : []),
    zonaId: source?.zonaId ?? null,
    ubicacionNombre: source?.ubicacionNombre || '',
    ubicacionDireccion: source?.ubicacionDireccion || '',
    ubicacionNotas: source?.ubicacionNotas || '',
    ubicacionId: source?.ubicacionId ?? null,
  }), [enableDate]);

  const initialComparable = useMemo(
    () => normalizeComparable(editValue || value),
    [editValue, normalizeComparable, value],
  );

  const currentComparable = useMemo(
    () => normalizeComparable(form),
    [form, normalizeComparable],
  );

  const isDirty = useMemo(
    () => JSON.stringify(initialComparable) !== JSON.stringify(currentComparable),
    [currentComparable, initialComparable],
  );

  const toggleDia = useCallback((dayId: number) => {
    const diasActuales = form.diasSemana || [];
    const exists = diasActuales.includes(dayId);
    const next = exists ? diasActuales.filter((dia) => dia !== dayId) : [...diasActuales, dayId].sort((a, b) => a - b);
    setField('diasSemana', next);
    setField('diaSemana', next.length > 0 ? next[0] : null);
  }, [form.diasSemana, setField]);

  const handleFechaModoChange = useCallback((modo: NonNullable<CrearClaseValue['fechaModo']>) => {
    setField('fechaModo', modo);
    // if (modo === 'por_agendar') { setField('horarioModo', 'duracion'); return; } // opcion oculta temporalmente
    if (!form.horarioModo || form.horarioModo === 'duracion') {
      setField('horarioModo', 'especifica');
    }
  }, [form.horarioModo, setField]);

  const handleCancel = useCallback(() => {
    setSubmitState('idle');
    resetForm();
    setIsOpen(false);
    onCancel?.();
  }, [onCancel]);

  const handleSubmit = useCallback(async () => {
    if (submitState === 'saving' || !canSubmit) return;
    try {
      setSubmitState('saving');
      const submissionBase = enableDate ? form : (() => {
        const { fecha, fechaModo, diaSemana, ...rest } = form;
        return rest as CrearClaseValue;
      })();
      const submission = {
        ...submissionBase,
        precio: normalizePrecioForTipo(submissionBase.tipo, submissionBase.precio),
        nivel: nivelesToNivelString(submissionBase.niveles),
      };
      await Promise.resolve(onSubmit?.(submission));
      setSubmitState('success');
      resetForm();
      setIsOpen(false);
      setTimeout(() => setSubmitState('idle'), 2200);
    } catch {
      setSubmitState('error');
      setTimeout(() => setSubmitState('idle'), 2500);
    }
  }, [canSubmit, enableDate, form, onSubmit, submitState]);

  const submitLabel = useMemo(() => {
    if (submitState === 'saving') return isEditing ? 'Guardando...' : 'Creando...';
    if (submitState === 'success') return isEditing ? 'Clase actualizada' : 'Clase creada';
    if (submitState === 'error') return isEditing ? 'Error al actualizar' : 'Error al crear';
    return isEditing ? 'Guardar cambios' : 'Guardar clase';
  }, [isEditing, submitState]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={style}
      className={className}
    >
      <div className="cc">
        <div className="cc__card cc__card--collapse">
          <button
            type="button"
            className="cc__collapse-trigger"
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
            aria-controls="crear-clase-form-panel"
            id="crear-clase-collapse-toggle"
          >
            <div className="cc__hd cc__hd--collapse">
              <div className="cc__icon cc__icon--teal">
                <Tag />
              </div>
              <div className="cc__collapse-text">
                <h3 className="cc__hd-title">{title}</h3>
                <p className="cc__hd-sub">
                  {isOpen
                    ? "Completa nombre, horario, ritmos y ubicación."
                    : "Pulsa para desplegar el formulario de la clase."}
                </p>
              </div>
              <ChevronDown
                className={`cc__collapse-chev${isOpen ? " cc__collapse-chev--open" : ""}`}
                aria-hidden
              />
            </div>
          </button>
          {!isOpen && isDirty && (
            <div className="cc__collapse-dirty">
              <span>Cambios sin guardar.</span>{" "}
              <button
                type="button"
                className="cc__collapse-dirty-btn"
                onClick={() => setIsOpen(true)}
              >
                Continuar editando
              </button>
            </div>
          )}
        </div>

        <div
          id="crear-clase-form-panel"
          role="region"
          aria-labelledby="crear-clase-collapse-toggle"
        >
          {isOpen ? (
            <>
        <div className="cc__card">
          <div className="cc__hd">
            <div className="cc__icon cc__icon--teal">
              <Tag />
            </div>
            <div>
              <h3 className="cc__hd-title">Informacion basica</h3>
              <p className="cc__hd-sub">{title}</p>
            </div>
          </div>
          <div className="cc__body">
            <div className="cc__field">
              <label className="cc__label">
                Nombre de la clase<span className="cc__req">*</span>
              </label>
              <input
                type="text"
                className={`cc__input${invalid.nombre ? ' cc__input--invalid' : ''}`}
                value={form.nombre || ''}
                onChange={(e) => setField('nombre', e.target.value)}
                placeholder="Ej. Salsa On2 - nivel intermedio"
              />
              {invalid.nombre && <span className="cc__hint cc__hint--danger">Agrega un nombre.</span>}
            </div>

            <div className="cc__field">
              <label className="cc__label">Descripcion</label>
              <textarea
                className="cc__textarea"
                value={form.descripcion || ''}
                onChange={(e) => setField('descripcion', e.target.value)}
                placeholder="Que aprenderan, requisitos y enfoque de la clase."
                rows={3}
              />
            </div>

            <div className="cc__grid-2">
              <div className="cc__field">
                <label className="cc__label">Tipo</label>
                <div className="cc__select-wrap">
                  <select
                    className="cc__select cc__select--tipo"
                    value={form.tipo || 'clases sueltas'}
                    onChange={(e) => {
                      const nextTipo = e.target.value as CrearClaseValue['tipo'];
                      updateForm((prev) => ({
                        ...prev,
                        tipo: nextTipo,
                        precio: nextTipo === 'clases sueltas' ? (prev.precio ?? null) : null,
                      }));
                    }}
                  >
                    {tipos.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                  <div className="cc__chev">
                    <ChevronDown />
                  </div>
                </div>
              </div>

              <div className="cc__field">
                <label className="cc__label">Niveles</label>
                <div className="cc__chips">
                  {niveles.map((nivel) => {
                    const active = (form.niveles ?? []).includes(nivel);
                    return (
                      <button
                        key={nivel}
                        type="button"
                        className={`cc__chip${active ? ' cc__chip--nivel' : ''}`}
                        onClick={() => toggleNivelChip(nivel)}
                      >
                        {nivel}
                        {active && (
                          <span className="cc__chip-x">
                            <X />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="cc__field">
              <label className="cc__label">Costo (MXN)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="cc__input"
                value={form.precio ?? ''}
                onChange={(e) => {
                  if (!isTipoClase) return;
                  const raw = e.target.value;
                  setField('precio', raw === '' ? null : Number(raw));
                }}
                placeholder={isTipoClase ? 'Ej. 200' : 'Disponible solo para tipo clase'}
                disabled={!isTipoClase}
              />
              {!isTipoClase && (
                <span className="cc__hint">El costo solo se habilita para tipo "clases sueltas".</span>
              )}
            </div>
          </div>
        </div>

        <div className="cc__card">
          <div className="cc__hd">
            <div className="cc__icon cc__icon--purple">
              <Music />
            </div>
            <div>
              <h3 className="cc__hd-title">Ritmos</h3>
              <p className="cc__hd-sub">Selecciona los ritmos que cubre esta clase.</p>
            </div>
          </div>
          <div className="cc__body">
            <div>
              <RitmosChips
                selected={selectedCatalogIds}
                onChange={onChangeCatalog}
                allowedIds={allowedRitmoSlugs}
              />
            </div>
            {selectedCatalogIds.length === 0 && (
              <span className="cc__hint">Opcional, pero ayuda a mejorar el descubrimiento de la clase.</span>
            )}
          </div>
        </div>

        <div className="cc__card">
          <div className="cc__hd">
            <div className="cc__icon cc__icon--blue">
              <Calendar />
            </div>
            <div>
              <h3 className="cc__hd-title">Horario</h3>
              <p className="cc__hd-sub">Define fecha, dias y horario.</p>
            </div>
          </div>
          <div className="cc__body">
            {enableDate && (
              <div className="cc__field">
                <label className="cc__label">Modalidad de fecha</label>
                <div className="cc__period-group">
                  <button type="button" className={`cc__period${form.fechaModo === 'especifica' ? ' cc__period--active' : ''}`} onClick={() => handleFechaModoChange('especifica')}>
                    <span className="cc__period-dot" />
                    Fecha especifica
                  </button>
                  <button type="button" className={`cc__period${form.fechaModo === 'semanal' ? ' cc__period--active' : ''}`} onClick={() => handleFechaModoChange('semanal')}>
                    <span className="cc__period-dot" />
                    Semanal
                  </button>
                  {/* Temporalmente oculto: modalidad "Por agendar"
                  <button type="button" className={`cc__period${form.fechaModo === 'por_agendar' ? ' cc__period--active' : ''}`} onClick={() => handleFechaModoChange('por_agendar')}>
                    <span className="cc__period-dot" />
                    Por agendar
                  </button>
                  */}
                </div>
              </div>
            )}

            {enableDate && form.fechaModo === 'especifica' && (
              <div className="cc__field">
                <label className="cc__label">
                  Fecha<span className="cc__req">*</span>
                </label>
                <input
                  type="date"
                  className={`cc__input${invalid.fecha ? ' cc__input--invalid' : ''}`}
                  value={form.fecha || ''}
                  onChange={(e) => setField('fecha', e.target.value)}
                />
                {invalid.fecha && <span className="cc__hint cc__hint--danger">Selecciona una fecha.</span>}
              </div>
            )}

            {enableDate && form.fechaModo === 'semanal' && (
              <div className="cc__field">
                <label className="cc__label">
                  Dias de la semana<span className="cc__req">*</span>
                </label>
                <div className="cc__days">
                  {[
                    { id: 1, short: 'L', label: 'Lunes' },
                    { id: 2, short: 'M', label: 'Martes' },
                    { id: 3, short: 'X', label: 'Miercoles' },
                    { id: 4, short: 'J', label: 'Jueves' },
                    { id: 5, short: 'V', label: 'Viernes' },
                    { id: 6, short: 'S', label: 'Sabado' },
                    { id: 0, short: 'D', label: 'Domingo' },
                  ].map((day) => {
                    const active = (form.diasSemana || []).includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        className={`cc__day${active ? ' cc__day--active' : ''}`}
                        onClick={() => toggleDia(day.id)}
                        aria-pressed={active}
                        aria-label={day.label}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
                {invalid.dia && <span className="cc__hint cc__hint--danger">Elige al menos un dia.</span>}
              </div>
            )}

            {porAgendar && (
              <span className="cc__hint">La fecha y hora se acordaran directamente con la academia o maestro.</span>
            )}

            {/* Temporalmente oculto: selector "Modo de horario" (Hora especifica / Duracion). Solo aplica hora inicio/fin salvo datos legacy por_agendar.
            <div className="cc__field">
              <label className="cc__label">Modo de horario</label>
              <div className="cc__period-group">
                <button
                  type="button"
                  className={`cc__period${horarioModo === 'especifica' ? ' cc__period--active' : ''}`}
                  onClick={() => setField('horarioModo', 'especifica')}
                  disabled={porAgendar}
                >
                  <span className="cc__period-dot" />
                  Hora especifica
                </button>
                <button
                  type="button"
                  className={`cc__period${horarioModo === 'duracion' ? ' cc__period--active' : ''}`}
                  onClick={() => setField('horarioModo', 'duracion')}
                >
                  <span className="cc__period-dot" />
                  Duracion
                </button>
              </div>
            </div>
            */}

            {horarioModo === 'especifica' && !porAgendar ? (
              <div className="cc__grid-2">
                <div className="cc__field">
                  <label className="cc__label">
                    Hora inicio<span className="cc__req">*</span>
                  </label>
                  <input
                    type="time"
                    step={60}
                    className={`cc__input${invalid.inicio ? ' cc__input--invalid' : ''}`}
                    value={form.inicio || ''}
                    onChange={(e) => setField('inicio', normalizeTime(e.target.value))}
                  />
                  {invalid.inicio && <span className="cc__hint cc__hint--danger">Indica la hora de inicio.</span>}
                </div>

                <div className="cc__field">
                  <label className="cc__label">
                    Hora fin<span className="cc__req">*</span>
                  </label>
                  <input
                    type="time"
                    step={60}
                    className={`cc__input${invalid.fin ? ' cc__input--invalid' : ''}`}
                    value={form.fin || ''}
                    onChange={(e) => setField('fin', normalizeTime(e.target.value))}
                  />
                  {invalid.fin && <span className="cc__hint cc__hint--danger">Indica la hora de fin.</span>}
                </div>
              </div>
            ) : (
              <div className="cc__field">
                <label className="cc__label">
                  Duracion en horas<span className="cc__req">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className={`cc__input${invalid.duracion ? ' cc__input--invalid' : ''}`}
                  value={form.duracionHoras ?? ''}
                  onChange={(e) => setField('duracionHoras', e.target.value === '' ? null : parseFloat(e.target.value))}
                  placeholder="Ej. 1.5"
                />
                {invalid.duracion && <span className="cc__hint cc__hint--danger">Indica la duracion en horas.</span>}
              </div>
            )}
          </div>
        </div>

        <div className="cc__card">
          <div className="cc__hd">
            <div className="cc__icon cc__icon--coral">
              <MapPin />
            </div>
            <div>
              <h3 className="cc__hd-title">Ubicacion</h3>
              <p className="cc__hd-sub">Selecciona una sede guardada o captura la ubicacion manualmente.</p>
            </div>
          </div>
          <div className="cc__body">
            {Array.isArray(locations) && locations.length > 0 && (
              <div className="cc__field">
                <label className="cc__label">Usar sede guardada</label>
                <div className="cc__select-wrap">
                  <select
                    className="cc__select"
                    value={selectedLocationId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setSelectedLocationId(nextId);
                      setField('ubicacionId', nextId || null);
                      const sel = locations.find((l) => (l.id || '') === nextId);
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
                    <option value="">Ingresar manualmente</option>
                    {locations.map((location, index) => (
                      <option key={location.id || index} value={location.id || ''}>
                        {location.nombre || location.direccion || 'Ubicacion'}
                      </option>
                    ))}
                  </select>
                  <div className="cc__chev">
                    <ChevronDown />
                  </div>
                </div>
              </div>
            )}

            <div className="cc__divider" />

            <div className="cc__grid-2">
              <div className="cc__field">
                <label className="cc__label">Nombre del lugar</label>
                <input
                  type="text"
                  className="cc__input"
                  value={form.ubicacionNombre || ''}
                  onChange={(e) => setField('ubicacionNombre', e.target.value)}
                  placeholder="Ej. Sede centro"
                />
              </div>

              <div className="cc__field">
                <label className="cc__label">Direccion</label>
                <input
                  type="text"
                  className="cc__input"
                  value={form.ubicacionDireccion || ''}
                  onChange={(e) => setField('ubicacionDireccion', e.target.value)}
                  placeholder="Calle, numero, colonia"
                />
              </div>
            </div>

            <div className="cc__field">
              <label className="cc__label">Notas o referencias</label>
              <input
                type="text"
                className="cc__input"
                value={form.ubicacionNotas || ''}
                onChange={(e) => setField('ubicacionNotas', e.target.value)}
                placeholder="Ej. Entrada lateral, segundo piso"
              />
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
                <div className="cc__field">
                  <button
                    type="button"
                    className={`cc__chip${zonesExpanded ? ' cc__chip--zona' : ''}`}
                    onClick={() => setZonesExpanded((prev) => !prev)}
                    style={{ width: 'fit-content' }}
                  >
                    {isLocationDriven ? 'Zonas (ubicacion)' : 'Zonas (perfil)'}
                    <span>{zonesExpanded ? '▾' : '▸'}</span>
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
          </div>
        </div>

        <div className="cc__card">
          <div className="cc__footer">
            <button type="button" className="cc__btn" onClick={handleCancel}>
              Cancelar
            </button>
            <div className="cc__footer-right">
              {isDirty && <span className="cc__dirty">Cambios sin guardar</span>}
              <button
                type="button"
                className="cc__btn cc__btn--primary"
                onClick={handleSubmit}
                disabled={submitState === 'saving' || !canSubmit}
              >
                <Save />
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
            </>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
});

export default CrearClase;
