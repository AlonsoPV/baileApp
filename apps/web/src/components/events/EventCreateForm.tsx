import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useCreateParent } from "../../hooks/useEvents";
import { useTags } from "../../hooks/useTags";
import { useToast } from "../Toast";
import { useHydratedForm } from "../../hooks/useHydratedForm";
import FAQEditor from "../common/FAQEditor";
import ScheduleEditor from "./ScheduleEditor";
import DateFlyerUploader from "./DateFlyerUploader";
import { MediaGrid } from "../MediaGrid";
import { MediaUploader } from "../MediaUploader";
import { useEventParentMedia } from "../../hooks/useEventParentMedia";
import RitmosChips from "../RitmosChips";
import { RITMOS_CATALOG } from "../../lib/ritmosCatalog";
import UbicacionesEditor from "../academy/UbicacionesEditor";
import ZonaGroupedChips from "../profile/ZonaGroupedChips";
import { useOrganizerLocations, type OrganizerLocation } from "../../hooks/useOrganizerLocations";
import type { AcademyLocation } from "../../types/academy";
import OrganizerLocationPicker from "../locations/OrganizerLocationPicker";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

type EventCreateFormProps =
  | {
    mode: 'parent';
    parent?: any;
    onSubmit: (values: any) => Promise<void>;
    onSuccess?: (eventId: number) => void;
    onCancel?: () => void;
    showHeader?: boolean;
    style?: React.CSSProperties;
    className?: string;
  }
  | {
    mode: 'date';
    date?: any;
    parentId: number;
    onSubmit: (values: any) => Promise<void>;
    onSuccess?: (eventId: number) => void;
    onCancel?: () => void;
    showHeader?: boolean;
    style?: React.CSSProperties;
    className?: string;
  };

export default function EventCreateForm(props: EventCreateFormProps) {
  const navigate = useNavigate();
  const { data: organizer } = useMyOrganizer();
  const { showToast } = useToast();
  const { data: orgLocations = [] } = useOrganizerLocations(organizer?.id);

  const clearLocationSelection = () => {
    setSelectedLocationId('');
    setValue('lugar', '');
    setValue('direccion', '');
    setValue('ciudad', '');
    setValue('referencias', '');
    setValue('ubicaciones' as any, [] as any);
  };

  const updateManualLocationField = (field: 'lugar' | 'direccion' | 'ciudad' | 'referencias', value: string) => {
    setSelectedLocationId('');
    setValue(field, value);
    const current = ((values as any)?.ubicaciones || []) as AcademyLocation[];
    const base: AcademyLocation = {
      sede: (values as any)?.lugar || '',
      direccion: (values as any)?.direccion || '',
      ciudad: (values as any)?.ciudad || '',
      referencias: (values as any)?.referencias || '',
      zona_id: typeof (values as any)?.zona === 'number' ? (values as any).zona : null,
    };
    const next = current.length ? [...current] : [base];
    const primary = { ...base, ...(next[0] || {}) };
    if (field === 'lugar') primary.sede = value;
    if (field === 'direccion') primary.direccion = value;
    if (field === 'ciudad') primary.ciudad = value;
    if (field === 'referencias') primary.referencias = value;
    next[0] = primary;
    setValue('ubicaciones' as any, next as any);
  };

  const handleUbicacionesChange = (list: AcademyLocation[]) => {
    setValue('ubicaciones' as any, list as any);
    const primary = list[0];
    if (primary) {
      setValue('lugar', primary.sede || '');
      setValue('direccion', primary.direccion || '');
      setValue('ciudad', primary.ciudad || '');
      setValue('referencias', primary.referencias || '');
      if (typeof primary.zona_id === 'number') {
        setValue('zona' as any, primary.zona_id as any);
      }
    } else {
      setValue('lugar', '');
      setValue('direccion', '');
      setValue('ciudad', '');
      setValue('referencias', '');
    }
    const match = primary
      ? orgLocations.find(
        (loc) =>
          (loc.nombre || '') === (primary.sede || '') &&
          (loc.direccion || '') === (primary.direccion || '') &&
          (loc.ciudad || '') === (primary.ciudad || '') &&
          (loc.referencias || '') === (primary.referencias || '')
      )
      : undefined;
    setSelectedLocationId(match?.id ? String(match.id) : '');
  };
  const isParent = props.mode === 'parent';
  const isEditing = isParent ? !!props.parent : !!props.date;
  const initialData = isParent ? props.parent : props.date;
  
  // Mantener el estado de edición basado en si tenemos un ID
  const hasId = initialData?.id;
  const isActuallyEditing = isEditing && hasId;

  // Media para parent (social) cuando estamos editando un existente
  const parentMedia = isParent && isActuallyEditing && initialData?.id
    ? useEventParentMedia(initialData.id)
    : null;

  // Safety check para evitar errores de undefined
  if (!initialData && isEditing) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  const { form: values, setField: setValue, dirty: isDirty, setFromServer: reset } = useHydratedForm({
    // Configuración del formulario
    draftKey: isParent
      ? `event-parent-${props.parent?.id || 'new'}-${isActuallyEditing ? 'edit' : 'create'}`
      : `event-date-${props.date?.id || 'new'}-${props.parentId}-${isActuallyEditing ? 'edit' : 'create'}`,
    serverData: initialData,
    defaults: {
      // Campos comunes
      nombre: '',
      biografia: '',
      estilos: [],
      ritmos_seleccionados: [] as string[],
      zonas: [],
      media: [],

      // Campos específicos de parent
      sede_general: '',
      faq: [],

      // Campos específicos de date
      fecha: '',
      hora_inicio: '',
      hora_fin: '',
      lugar: '',
      direccion: '',
      ciudad: '',
      zona: null,
      referencias: '',
      cronograma: [],
      costos: [],
      flyer_url: null,
      estado_publicacion: 'borrador',
      ubicaciones: [] as any[],
      // Repetición semanal
      repetir_semanal: false,
      semanas_repetir: 4,
      fecha_fin_repetir: '',
    }
  });
  const initialUbicaciones = React.useMemo(
    () =>
      Array.isArray((initialData as any)?.ubicaciones)
        ? ((initialData as any)?.ubicaciones as AcademyLocation[])
        : [],
    [initialData]
  );
  const hasExistingUbicaciones = initialUbicaciones.length > 0;
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const hasPrefilledLocations = useRef(false);
  const selectedLocation = React.useMemo(() => {
    if (!selectedLocationId) return null;
    return orgLocations.find((loc) => String(loc.id ?? '') === selectedLocationId) || null;
  }, [selectedLocationId, orgLocations]);
  const selectedLocationZonaIds = React.useMemo(() => {
    if (!selectedLocation) return [];
    const ids = Array.isArray((selectedLocation as any)?.zona_ids)
      ? ((selectedLocation as any).zona_ids as number[]).filter((id) => typeof id === 'number')
      : Array.isArray((selectedLocation as any)?.zonas)
      ? ((selectedLocation as any).zonas as number[]).filter((id) => typeof id === 'number')
      : typeof selectedLocation.zona_id === 'number'
      ? [selectedLocation.zona_id]
      : [];
    return ids;
  }, [selectedLocation]);
  const manualZonaIds = React.useMemo(() => {
    if (selectedLocationZonaIds.length > 0) return [];
    return Array.isArray((values as any)?.zonas)
      ? ((values as any).zonas as number[]).filter((id) => typeof id === 'number')
      : [];
  }, [selectedLocationZonaIds, values]);
  const [zonesExpanded, setZonesExpanded] = useState(false);
  useEffect(() => {
    setZonesExpanded(false);
  }, [selectedLocationId, (values as any)?.zonas]);

  const mapOrganizerLocationToUbicacion = React.useCallback((loc?: OrganizerLocation | null) => {
    if (!loc) return null;
    const zonaIds = Array.isArray((loc as any)?.zona_ids)
      ? ((loc as any).zona_ids as number[]).filter((id) => typeof id === 'number')
      : typeof loc.zona_id === 'number'
        ? [loc.zona_id]
        : [];

    return {
      sede: loc.nombre || (loc as any)?.sede || '',
      nombre: loc.nombre || (loc as any)?.sede || '',
      direccion: loc.direccion || '',
      ciudad: loc.ciudad || '',
      referencias: loc.referencias || '',
      zona_id: zonaIds.length ? zonaIds[0] : null,
      zonas: zonaIds,
      zonaIds,
    } as AcademyLocation;
  }, []);

  const applyOrganizerLocationToForm = React.useCallback(
    (loc?: OrganizerLocation | null) => {
      if (!loc) return;
      setSelectedLocationId(loc.id ? String(loc.id) : '');
      setValue('lugar', loc.nombre || '');
      setValue('direccion', loc.direccion || '');
      setValue('ciudad', loc.ciudad || '');
      setValue('referencias', loc.referencias || '');
      if (typeof loc.zona_id === 'number') {
        setValue('zona' as any, loc.zona_id as any);
      }
      const zonaIds = Array.isArray((loc as any)?.zona_ids)
        ? ((loc as any).zona_ids as number[]).filter((id) => typeof id === 'number')
        : typeof loc.zona_id === 'number'
          ? [loc.zona_id]
          : [];
      if (zonaIds.length) {
        setValue('zonas' as any, zonaIds as any);
      }
      const ubicacion = mapOrganizerLocationToUbicacion(loc);
      if (ubicacion) {
        setValue('ubicaciones' as any, [ubicacion] as any);
      }
    },
    [mapOrganizerLocationToUbicacion, setValue]
  );

  useEffect(() => {
    if (!orgLocations.length) {
      if (selectedLocationId) setSelectedLocationId('');
      return;
    }
    const match = orgLocations.find((loc) =>
      (loc.nombre || '') === ((values as any)?.lugar || '') &&
      (loc.direccion || '') === ((values as any)?.direccion || '') &&
      (loc.ciudad || '') === ((values as any)?.ciudad || '') &&
      (loc.referencias || '') === ((values as any)?.referencias || '')
    );
    if (match) {
      if (selectedLocationId !== String(match.id)) {
        setSelectedLocationId(String(match.id));
      }
    } else if (selectedLocationId) {
      setSelectedLocationId('');
    }
  }, [orgLocations, (values as any)?.lugar, (values as any)?.direccion, (values as any)?.ciudad, (values as any)?.referencias, selectedLocationId]);

  useEffect(() => {
    if (!isParent) return;
    if (!orgLocations.length) return;
    if (hasPrefilledLocations.current) return;
    const currentUbicaciones = Array.isArray((values as any)?.ubicaciones)
      ? ((values as any)?.ubicaciones as AcademyLocation[])
      : [];
    if (isActuallyEditing && (hasExistingUbicaciones || currentUbicaciones.length > 0)) return;
    if (!isActuallyEditing && currentUbicaciones.length > 0) return;

    const mapped = orgLocations.map((loc) => ({
      sede: loc.nombre || (loc as any).sede || '',
      direccion: loc.direccion || '',
      ciudad: loc.ciudad || '',
      referencias: loc.referencias || '',
      zona_id: typeof loc.zona_id === 'number' ? loc.zona_id : null,
      zonaIds:
        Array.isArray((loc as any)?.zona_ids) && (loc as any)?.zona_ids?.length
          ? ((loc as any).zona_ids as number[]).filter((n) => typeof n === 'number')
          : typeof loc.zona_id === 'number'
          ? [loc.zona_id]
          : [],
    }));

    if (mapped.length) {
      setValue('ubicaciones' as any, mapped as any);
      const first = orgLocations[0];
      if (first) {
        setSelectedLocationId(first.id ? String(first.id) : '');
        setValue('lugar', first.nombre || '');
        setValue('direccion', first.direccion || '');
        setValue('ciudad', first.ciudad || '');
        setValue('referencias', first.referencias || '');
        if (typeof first.zona_id === 'number') {
          setValue('zona' as any, first.zona_id as any);
        }
        if (Array.isArray(first.zona_ids) && first.zona_ids.length) {
          setValue('zonas' as any, first.zona_ids as any);
        }
      }
      hasPrefilledLocations.current = true;
    }
  }, [isParent, isActuallyEditing, hasExistingUbicaciones, orgLocations, values, setValue]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  // Simplificar la lógica de editMode - solo usar isActuallyEditing

  // Obtener tags para mapear ritmos
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter(tag => tag.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter(tag => tag.tipo === 'zona') || [];
  // Limitar ritmos permitidos según configuración del organizador
  const { data: myOrg } = useMyOrganizer();
  const allowedCatalogIds = ((myOrg as any)?.ritmos_seleccionados || []) as string[];

  // Efecto: si hay allowed, purgar selecciones no permitidas
  useEffect(() => {
    if (!allowedCatalogIds || allowedCatalogIds.length === 0) return;
    const current = ((values as any)?.ritmos_seleccionados || []) as string[];
    const filtered = current.filter((id) => allowedCatalogIds.includes(id));
    if (filtered.length !== current.length) {
      setValue('ritmos_seleccionados' as any, filtered as any);
    }
  }, [allowedCatalogIds]);
  const editMode = isActuallyEditing;

  const handleZonaToggle = (id: number) => {
    const current = (((values as any)?.zonas || []) as number[]).filter(
      (z) => typeof z === "number"
    );
    const exists = current.includes(id);
    let next: number[];
    if (exists) {
      next = current.filter((z) => z !== id);
    } else {
      next = [...current, id];
    }
    setValue("zonas" as any, next as any);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await props.onSubmit(values);

      // Solo llamar reset si tenemos datos del servidor
      if (result !== undefined && result !== null && typeof result === 'object' && 'updated_at' in (result as any)) {
        reset(result as any);
      }

      // Mostrar mensaje de éxito
      showToast(
        isActuallyEditing
          ? `${isParent ? 'Social' : 'Fecha'} actualizado exitosamente`
          : `${isParent ? 'Social' : 'Fecha'} creado exitosamente`,
        'success'
      );

      if (props.onSuccess) {
        const createdId =
          (result as any)?.id ??
          (result as any)?.parent_id ??
          (result as any)?.parentId ??
          initialData?.id ??
          null;
        if (createdId) {
          props.onSuccess(createdId);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showToast('Error al guardar', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (props.onCancel) {
      props.onCancel();
    } else {
      navigate(-1);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
      padding: '24px 0',
      ...props.style
    }} className={props.className}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
        {props.showHeader && (
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              background: `linear-gradient(135deg, ${colors.coral}, ${colors.blue})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}>
              {isParent ? (editMode ? '🎭 Editar Social' : '🎭 Crear Social') : (editMode ? '📅 Editar Fecha' : '📅 Crear Fecha')}
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: colors.light,
              opacity: 0.8,
            }}>
              {isParent
                ? 'Información general del evento social'
                : 'Detalles específicos de la fecha del evento'
              }
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Información Básica */}
          <div style={{
            padding: '24px',
            background: `${colors.dark}66`,
            borderRadius: '16px',
            border: `1px solid ${colors.light}22`,
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: colors.light,
              marginBottom: '20px',
            }}>
              📝 Información Básica
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: colors.light,
                }}>
                  Nombre del {isParent ? 'Social' : 'Evento'} *
                </label>
                <input
                  type="text"
                  value={values?.nombre || ''}
                  onChange={(e) => setValue('nombre', e.target.value)}
                  placeholder={`Nombre del ${isParent ? 'social' : 'evento'}`}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: `${colors.dark}cc`,
                    border: `2px solid ${colors.light}33`,
                    color: colors.light,
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: colors.light,
                }}>
                  Biografía
                </label>
                <textarea
                  value={values?.biografia || ''}
                  onChange={(e) => setValue('biografia', e.target.value)}
                  placeholder="Describe el evento, su propósito, qué esperar..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: `${colors.dark}cc`,
                    border: `2px solid ${colors.light}33`,
                    color: colors.light,
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                />
              </div>

            </div>
          </div>

          {/* Ritmos */}
          <div style={{
            padding: '24px',
            background: `${colors.dark}66`,
            borderRadius: '16px',
            border: `1px solid ${colors.light}22`,
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: colors.light,
              marginBottom: '20px',
            }}>
              🎵 Ritmos de Baile
            </h2>

            <div style={{ marginTop: 8 }}>
              <RitmosChips
                selected={(() => {
                  const selected = ((values as any)?.ritmos_seleccionados || []) as string[];
                  return (allowedCatalogIds && allowedCatalogIds.length)
                    ? selected.filter(id => allowedCatalogIds.includes(id))
                    : selected;
                })()}
                allowedIds={allowedCatalogIds}
                onChange={(ids) => {
                  const next = (allowedCatalogIds && allowedCatalogIds.length)
                    ? ids.filter(id => allowedCatalogIds.includes(id))
                    : ids;
                  setValue('ritmos_seleccionados' as any, next as any);
                  // Mapear también a estilos (tag IDs) si es posible
                  try {
                    const labelByCatalogId = new Map<string, string>();
                    RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
                    const nameToTagId = new Map<string, number>(
                      ritmoTags.map((t: any) => [t.nombre, t.id])
                    );
                    const mappedTagIds = next
                      .map(cid => labelByCatalogId.get(cid))
                      .filter(Boolean)
                      .map((label: any) => nameToTagId.get(label as string))
                      .filter((n): n is number => typeof n === 'number');
                    setValue('estilos' as any, mappedTagIds as any);
                  } catch { }
                }}
              />
            </div>
          </div>

          {/* Zonas */}
        {/*   <div style={{
            padding: '24px',
            background: `${colors.dark}66`,
            borderRadius: '16px',
            border: `1px solid ${colors.light}22`,
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: colors.light,
              marginBottom: '12px',
            }}>
              📍 Zonas de la Ciudad
            </h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '12px', color: colors.light }}>
              Elige las zonas donde se realizará este social (puedes seleccionar varias).
            </p>
            <ZonaGroupedChips
              mode="edit"
              selectedIds={((values as any)?.zonas || []) as number[]}
              allTags={zonaTags as any}
              onToggle={handleZonaToggle}
              autoExpandSelectedParents={false}
            />
          </div> */}

          {/* Campos específicos de parent */}
          {isParent && (
            <>
              {/* Ubicaciones del Social */}
              <div style={{
                padding: '24px',
                background: `${colors.dark}66`,
                borderRadius: '16px',
                border: `1px solid ${colors.light}22`,
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: colors.light,
                  marginBottom: '12px',
                }}>
                  🗺️ Ubicaciones del Social
                </h2>
                <p style={{ fontSize: '0.9rem', opacity: 0.75, marginBottom: '16px', color: colors.light }}>
                  Agrega cada sede o punto de encuentro para este social. Puedes reutilizar ubicaciones guardadas o capturarlas manualmente.
                </p>
                <UbicacionesEditor
                  value={((values as any)?.ubicaciones || []) as AcademyLocation[]}
                  onChange={(ubicaciones) => handleUbicacionesChange(ubicaciones as AcademyLocation[])}
                  allowedZoneIds={Array.isArray((values as any)?.zonas) ? ((values as any)?.zonas as number[]).filter((n) => typeof n === 'number') : undefined}
                  savedLocations={orgLocations as any}
                />
              </div>

              {/* Galería de Medios (opcional) */}
              <div style={{
                padding: '24px',
                background: `${colors.dark}66`,
                borderRadius: '16px',
                border: `1px solid ${colors.light}22`,
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: colors.light,
                  marginBottom: '20px',
                }}>
                  📷 Galería de Medios
                </h2>
                <MediaUploader onPick={(files) => {
                  // Si estamos editando un parent existente, subir directo al storage y persistir en DB
                  if (parentMedia) {
                    Array.from(files).forEach((file, idx) => {
                      parentMedia.add.mutate({ file, slot: `p${idx + 1}` });
                    });
                  } else {
                    // Fallback para modo creación: previsualizar en estado local
                    const now = Date.now();
                    const picked = Array.from(files).map((f, i) => ({
                      id: `${now}-${i}`,
                      type: f.type.startsWith('video') ? 'video' : 'image',
                      url: URL.createObjectURL(f)
                    }));
                    const current = (values?.media as any[]) || [];
                    setValue('media', [...picked, ...current]);
                  }
                }} />

                <div style={{ marginTop: 16 }}>
                  <MediaGrid
                    items={parentMedia ? (parentMedia.media as any[]) : ((values?.media as any[]) || [])}
                    onRemove={(id) => {
                      if (parentMedia) {
                        parentMedia.remove.mutate(id as string);
                      } else {
                        const next = ((values?.media as any[]) || []).filter((m: any) => m.id !== id);
                        setValue('media', next);
                      }
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Campos específicos de date */}
          {!isParent && (
            <>
              {/* Fecha y Hora */}
              <div style={{
                padding: '24px',
                background: `${colors.dark}66`,
                borderRadius: '16px',
                border: `1px solid ${colors.light}22`,
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: colors.light,
                  marginBottom: '20px',
                }}>
                  📅 Fecha y Hora
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.light,
                    }}>
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={values?.fecha || ''}
                      onChange={(e) => setValue('fecha', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: `${colors.dark}cc`,
                        border: `2px solid ${colors.light}33`,
                        color: colors.light,
                        fontSize: '1rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.light,
                    }}>
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      value={values?.hora_inicio || ''}
                      onChange={(e) => setValue('hora_inicio', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: `${colors.dark}cc`,
                        border: `2px solid ${colors.light}33`,
                        color: colors.light,
                        fontSize: '1rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.light,
                    }}>
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      value={values?.hora_fin || ''}
                      onChange={(e) => setValue('hora_fin', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: `${colors.dark}cc`,
                        border: `2px solid ${colors.light}33`,
                        color: colors.light,
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                </div>

                {/* Repetición Semanal */}
                <div style={{ marginTop: '24px', padding: '20px', background: `${colors.dark}44`, borderRadius: '12px', border: `1px solid ${colors.light}22` }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: (values as any)?.repetir_semanal ? '16px' : '0' }}>
                    <input
                      type="checkbox"
                      checked={(values as any)?.repetir_semanal || false}
                      onChange={(e) => setValue('repetir_semanal', e.target.checked)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '1rem', fontWeight: '600', color: colors.light }}>
                      🔁 Repetir semanalmente
                    </span>
                  </label>

                  {(values as any)?.repetir_semanal && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: colors.light,
                        }}>
                          Número de semanas
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="52"
                          value={(values as any)?.semanas_repetir || 4}
                          onChange={(e) => setValue('semanas_repetir', parseInt(e.target.value) || 4)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: `${colors.dark}cc`,
                            border: `2px solid ${colors.light}33`,
                            color: colors.light,
                            fontSize: '1rem',
                          }}
                        />
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '4px', color: colors.light }}>
                          Se crearán fechas cada semana durante {((values as any)?.semanas_repetir || 4)} semana{((values as any)?.semanas_repetir || 4) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ubicación del Evento */}
              <div style={{
                padding: '24px',
                background: `${colors.dark}66`,
                borderRadius: '16px',
                border: `1px solid ${colors.light}22`,
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: colors.light,
                  marginBottom: '20px',
                }}>
                  📍 Ubicación del Evento
                </h2>
                {orgLocations.length > 0 && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: colors.light,
                      }}>
                        Elegir ubicación existente o ingresa una nueva
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={selectedLocationId}
                          onChange={(e) => {
                            const nextId = e.target.value;
                            if (!nextId) {
                              clearLocationSelection();
                              return;
                            }
                            const found = orgLocations.find((loc) => String(loc.id ?? '') === nextId);
                            applyOrganizerLocationToForm(found);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            background: '#2b2b2b',
                            border: '1px solid rgba(255,255,255,0.25)',
                            color: '#FFFFFF',
                            outline: 'none',
                            fontSize: 14,
                            borderRadius: 12,
                            appearance: 'none',
                            WebkitAppearance: 'none',
                          }}
                        >
                          <option value="" style={{ background: '#2b2b2b', color: '#FFFFFF' }}>
                            — Escribir manualmente —
                          </option>
                          {orgLocations.map((loc) => (
                            <option
                              key={loc.id}
                              value={String(loc.id)}
                              style={{ color: '#FFFFFF', background: '#2b2b2b' }}
                            >
                              {loc.nombre || loc.direccion || 'Ubicación'}
                            </option>
                          ))}
                        </select>
                        <span
                          style={{
                            position: 'absolute',
                            right: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: 'rgba(255,255,255,0.6)',
                          }}
                        >
                          ▼
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {/* Formulario de ubicación manual (como en OrganizerProfileEditor) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.light,
                    }}>
                      Nombre de la ubicación
                    </label>
                    <input
                      type="text"
                      value={values?.lugar || ''}
                      onChange={(e) => updateManualLocationField('lugar', e.target.value)}
                      placeholder="Ej: Sede Central / Salón Principal"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: `${colors.dark}cc`,
                        border: `2px solid ${colors.light}33`,
                        color: colors.light,
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.light,
                    }}>
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={values?.direccion || ''}
                      onChange={(e) => updateManualLocationField('direccion', e.target.value)}
                      placeholder="Calle, número, colonia"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: `${colors.dark}cc`,
                        border: `2px solid ${colors.light}33`,
                        color: colors.light,
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.light,
                    }}>
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={values?.ciudad || ''}
                      onChange={(e) => updateManualLocationField('ciudad', e.target.value)}
                      placeholder="Ciudad"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: `${colors.dark}cc`,
                        border: `2px solid ${colors.light}33`,
                        color: colors.light,
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.light,
                    }}>
                      Notas o referencias
                    </label>
                    <input
                      type="text"
                      value={values?.referencias || ''}
                      onChange={(e) => updateManualLocationField('referencias', e.target.value)}
                      placeholder="Ej. Entrada lateral, 2do piso"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: `${colors.dark}cc`,
                        border: `2px solid ${colors.light}33`,
                        color: colors.light,
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Cronograma */}
              <div style={{
                padding: '24px',
                background: `${colors.dark}66`,
                borderRadius: '16px',
                border: `1px solid ${colors.light}22`,
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: colors.light,
                  marginBottom: '20px',
                }}>
                  📅 Cronograma del Evento
                </h2>
                <ScheduleEditor
                  schedule={values?.cronograma || []}
                  onChangeSchedule={(cronograma) => setValue('cronograma', cronograma)}
                  costos={values?.costos || []}
                  onChangeCostos={(costos) => setValue('costos', costos)}
                  ritmos={ritmoTags}
                  zonas={zonaTags}
                  eventFecha={values?.fecha || ''}
                  onSaveCosto={() => {
                    showToast('💰 Costo guardado en el formulario. Recuerda hacer click en "✨ Crear" para guardar la fecha completa.', 'info');
                  }}
                />
              </div>

              {/* Flyer - Solo para fechas */}
              {!isParent && (
                <div style={{
                  padding: '24px',
                  background: `${colors.dark}66`,
                  borderRadius: '16px',
                  border: `1px solid ${colors.light}22`,
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: colors.light,
                    marginBottom: '20px',
                  }}>
                    🖼️ Flyer del Evento
                  </h2>
                  <DateFlyerUploader
                    value={values?.flyer_url || null}
                    onChange={(url) => setValue('flyer_url', url)}
                    dateId={initialData?.id}
                    parentId={props.parentId}
                  />
                </div>
              )}

              {/* Estado de Publicación */}
              <div style={{
                padding: '24px',
                background: `${colors.dark}66`,
                borderRadius: '16px',
                border: `1px solid ${colors.light}22`,
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: colors.light,
                  marginBottom: '20px',
                }}>
                  🌐 Estado de Publicación
                </h2>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="radio"
                      name="estado_publicacion"
                      value="borrador"
                      checked={values?.estado_publicacion === 'borrador'}
                      onChange={(e) => setValue('estado_publicacion', e.target.value)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span style={{ color: colors.light, fontSize: '1rem' }}>
                      📝 Borrador (solo tú puedes verlo)
                    </span>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="radio"
                      name="estado_publicacion"
                      value="publicado"
                      checked={values?.estado_publicacion === 'publicado'}
                      onChange={(e) => setValue('estado_publicacion', e.target.value)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span style={{ color: colors.light, fontSize: '1rem' }}>
                      🌐 Público (visible para todos)
                    </span>
                  </label>
                  <span style={{ fontSize: '0.9rem', opacity: 0.8, color: colors.light }}>
                    Visible públicamente y permite RSVP
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Botones de Acción */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            background: `${colors.dark}66`,
            borderRadius: '16px',
            border: `1px solid ${colors.light}22`,
          }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              style={{
                padding: '12px 24px',
                borderRadius: '25px',
                border: `2px solid ${colors.light}33`,
                background: 'transparent',
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              ❌ Cancelar
            </motion.button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isDirty && (
                <span style={{
                  fontSize: '0.9rem',
                  color: colors.orange,
                  fontWeight: '600',
                }}>
                  💾 Cambios sin guardar
                </span>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={isSubmitting || !values?.nombre?.trim()}
                style={{
                  padding: '12px 24px',
                  borderRadius: '25px',
                  border: 'none',
                  background: isSubmitting || !values?.nombre?.trim()
                    ? `${colors.light}33`
                    : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                  color: colors.light,
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: isSubmitting || !values?.nombre?.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || !values?.nombre?.trim() ? 0.6 : 1,
                }}
              >
                {isSubmitting ? '⏳ Guardando...' : editMode ? '💾 Actualizar' : '✨ Crear'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}