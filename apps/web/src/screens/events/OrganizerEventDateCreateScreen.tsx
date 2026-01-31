import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateEventDate } from "../../hooks/useEventDate";
import { useEventParent } from "../../hooks/useEventParent";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useOrganizerLocations, type OrganizerLocation } from "../../hooks/useOrganizerLocations";
import { useTags } from "../../hooks/useTags";
import { useToast } from "../../components/Toast";
import RitmosChips from "../../components/RitmosChips";
import { RITMOS_CATALOG } from "../../lib/ritmosCatalog";
import ScheduleEditor from "../../components/events/ScheduleEditor";
import DateFlyerUploader from "../../components/events/DateFlyerUploader";
import type { AcademyLocation } from "../../types/academy";
import { supabase } from "../../lib/supabase";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

const toAcademyLocation = (loc?: OrganizerLocation | null): AcademyLocation | null => {
  if (!loc) return null;
  return {
    sede: loc.nombre || '',
    direccion: loc.direccion || '',
    ciudad: loc.ciudad || '',
    referencias: loc.referencias || '',
    zona_id: typeof loc.zona_id === 'number'
      ? loc.zona_id
      : Array.isArray(loc.zona_ids) && loc.zona_ids.length
        ? loc.zona_ids[0] ?? null
        : null,
  };
};

export default function OrganizerEventDateCreateScreen() {
  const navigate = useNavigate();
  const { parentId } = useParams<{ parentId: string }>();
  const parentIdNum = parentId ? parseInt(parentId) : undefined;
  
  const { data: parent, isLoading } = useEventParent(parentIdNum);
  const { data: org } = useMyOrganizer();
  const { data: orgLocations = [] } = useOrganizerLocations((org as any)?.id);
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter(tag => tag.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter(tag => tag.tipo === 'zona') || [];
  const { showToast } = useToast();
  const createDate = useCreateEventDate();
  
  const [selectedDateLocationId, setSelectedDateLocationId] = useState<string>('');
  const [dateForm, setDateForm] = useState({
    nombre: '',
    biografia: '',
    djs: '',
    telefono_contacto: '',
    mensaje_contacto: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    lugar: '',
    ciudad: '',
    direccion: '',
    referencias: '',
    requisitos: '',
    ubicaciones: [] as AcademyLocation[],
    zona: null as number | null,
    estilos: [] as number[],
    ritmos_seleccionados: [] as string[],
    zonas: [] as number[],
    cronograma: [] as any[],
    costos: [] as any[],
    flyer_url: null as string | null,
    estado_publicacion: 'borrador' as 'borrador' | 'publicado',
    repetir_semanal: false,
    semanas_repetir: 4
  });

  const handleDateUbicacionesChange = (list: AcademyLocation[]) => {
    const zonasSet = new Set<number>();
    list.forEach((loc) => {
      if (typeof loc?.zona_id === 'number') zonasSet.add(loc.zona_id);
    });
    const primary = list[0];
    setDateForm((prev) => ({
      ...prev,
      ubicaciones: list,
      lugar: primary?.sede || '',
      direccion: primary?.direccion || '',
      ciudad: primary?.ciudad || '',
      referencias: primary?.referencias || '',
      zona: typeof primary?.zona_id === 'number' ? primary.zona_id : null,
      zonas: zonasSet.size ? Array.from(zonasSet) : prev.zonas,
    }));
  };

  // Obtener zonas de la ubicación seleccionada
  const getZonasFromSelectedLocation = (): number[] => {
    if (!selectedDateLocationId) return [];
    const selectedLoc = orgLocations.find((loc) => String(loc.id ?? '') === selectedDateLocationId);
    if (!selectedLoc) return [];
    const zonas: number[] = [];
    if (typeof selectedLoc.zona_id === 'number') zonas.push(selectedLoc.zona_id);
    if (Array.isArray(selectedLoc.zona_ids)) {
      selectedLoc.zona_ids.forEach((z) => {
        if (typeof z === 'number') zonas.push(z);
      });
    }
    return zonas;
  };

  const toggleZona = (id: number) => {
    setDateForm((prev) => {
      const newZonas = prev.zonas.includes(id)
        ? prev.zonas.filter(z => z !== id)
        : [...prev.zonas, id];
      return { ...prev, zonas: newZonas };
    });
  };

  const applyOrganizerLocationToDateForm = (loc?: OrganizerLocation | null) => {
    const converted = toAcademyLocation(loc);
    if (!converted) return;
    setSelectedDateLocationId(loc?.id ? String(loc.id) : '');
    handleDateUbicacionesChange([converted]);
    
    // Actualizar zonas desde la ubicación del organizador
    const zonasFromOrgLoc: number[] = [];
    if (typeof loc?.zona_id === 'number') zonasFromOrgLoc.push(loc.zona_id);
    if (Array.isArray(loc?.zona_ids)) {
      loc.zona_ids.forEach((z) => {
        if (typeof z === 'number') zonasFromOrgLoc.push(z);
      });
    }
    if (zonasFromOrgLoc.length > 0) {
      setDateForm((prev) => ({ ...prev, zonas: zonasFromOrgLoc }));
    }
  };

  const updateManualDateLocationField = (
    key: 'lugar' | 'direccion' | 'ciudad' | 'referencias',
    value: string
  ) => {
    setSelectedDateLocationId('');
    setDateForm((prev) => ({
      ...prev,
      [key]: value,
      ubicaciones: [],
    }));
  };

  useEffect(() => {
    if (!selectedDateLocationId) return;
    const exists = orgLocations.some((loc) => String(loc.id ?? '') === selectedDateLocationId);
    if (!exists) {
      setSelectedDateLocationId('');
    }
  }, [orgLocations, selectedDateLocationId]);

  const handleCreateDate = async () => {
    if (!dateForm.fecha) {
      showToast('La fecha es obligatoria', 'error');
      return;
    }

    try {
      const selectedOrganizerLocation = selectedDateLocationId
        ? orgLocations.find((loc) => String(loc.id ?? '') === selectedDateLocationId)
        : undefined;

      const primaryLocation = (dateForm.ubicaciones && dateForm.ubicaciones[0]) || undefined;
      const resolvedLugar = primaryLocation?.sede || dateForm.lugar || selectedOrganizerLocation?.nombre || null;
      const resolvedDireccion = primaryLocation?.direccion || dateForm.direccion || selectedOrganizerLocation?.direccion || null;
      const resolvedCiudad = primaryLocation?.ciudad || dateForm.ciudad || selectedOrganizerLocation?.ciudad || null;
      const resolvedReferencias = primaryLocation?.referencias || dateForm.referencias || selectedOrganizerLocation?.referencias || null;

      const resolvedZonaFromLocation = () => {
        if (typeof dateForm.zona === 'number') return dateForm.zona;
        if (typeof primaryLocation?.zona_id === 'number') return primaryLocation.zona_id;
        if (typeof selectedOrganizerLocation?.zona_id === 'number') return selectedOrganizerLocation.zona_id;
        if (Array.isArray(selectedOrganizerLocation?.zona_ids) && selectedOrganizerLocation.zona_ids.length) {
          return selectedOrganizerLocation.zona_ids[0] ?? null;
        }
        return null;
      };

      const resolvedZonasFromLocations = () => {
        if (dateForm.zonas && dateForm.zonas.length) return dateForm.zonas;
        const set = new Set<number>();
        (dateForm.ubicaciones || []).forEach((loc) => {
          if (typeof loc?.zona_id === 'number') set.add(loc.zona_id);
        });
        if (Array.isArray(selectedOrganizerLocation?.zona_ids) && selectedOrganizerLocation.zona_ids.length) {
          selectedOrganizerLocation.zona_ids.forEach((z) => {
            if (typeof z === 'number') set.add(z);
          });
        }
        return set.size ? Array.from(set) : [];
      };

      const resolvedZona = resolvedZonaFromLocation();
      const resolvedZonas = resolvedZonasFromLocations();

      const basePayload = {
        parent_id: parentIdNum ? Number(parentIdNum) : null,
        nombre: dateForm.nombre || null,
        biografia: dateForm.biografia || null,
        djs: dateForm.djs || null,
        telefono_contacto: dateForm.telefono_contacto || null,
        mensaje_contacto: dateForm.mensaje_contacto || null,
        hora_inicio: dateForm.hora_inicio || null,
        hora_fin: dateForm.hora_fin || null,
        lugar: resolvedLugar,
        direccion: resolvedDireccion,
        ciudad: resolvedCiudad,
        zona: resolvedZona,
        referencias: resolvedReferencias,
        requisitos: dateForm.requisitos || null,
        estilos: dateForm.estilos || [],
        ritmos_seleccionados: dateForm.ritmos_seleccionados || [],
        zonas: resolvedZonas,
        cronograma: dateForm.cronograma || [],
        costos: dateForm.costos || [],
        flyer_url: dateForm.flyer_url || null,
        estado_publicacion: dateForm.estado_publicacion || 'borrador'
      };

      const parseYMD = (s: string) => {
        const [y, m, d] = String(s || '').split('-').map((x) => parseInt(x, 10));
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d);
      };

      const dt = parseYMD(dateForm.fecha);
      const dia_semana = dateForm.repetir_semanal ? (dt ? dt.getDay() : null) : null;

      const created = await createDate.mutateAsync({
        ...basePayload,
        fecha: dateForm.fecha,
        dia_semana,
      } as any);

      showToast('Fecha creada ✅', 'success');

      if ((created as any)?.id) {
        navigate(`/social/fecha/${(created as any).id}`);
      } else {
        navigate(`/social/${parentIdNum}`);
      }
    } catch (err: any) {
      console.error('Error creating date:', err);
      showToast('Error al crear fecha', 'error');
    }
  };

  const handleCancel = () => {
    if (parentIdNum) {
      navigate(`/social/${parentIdNum}`);
    } else {
      navigate('/profile/organizer/edit');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Cargando social...</p>
        </div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
            Social no encontrado
          </h2>
          <p style={{ marginBottom: '24px', opacity: 0.7 }}>
            El social que buscas no existe o no tienes permisos para crear fechas
          </p>
          <button
            onClick={() => navigate('/profile/organizer/edit')}
            style={{
              padding: '14px 28px',
              borderRadius: '50px',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(30,136,229,0.5)',
            }}
          >
            ← Volver al Organizador
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .org-editor-card {
          margin-bottom: 2rem;
          padding: 1.2rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }
        
        .org-editor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        
        .org-editor-field {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #FFFFFF;
          font-size: 0.95rem;
        }
        
        .org-editor-input {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 1rem;
        }
        
        .org-editor-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
          opacity: 1;
        }
        
        .org-editor-input:focus {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          outline: none;
          color: #FFFFFF;
        }
        
        .org-editor-textarea {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 1rem;
          resize: vertical;
        }
        
        .org-editor-textarea::placeholder {
          color: rgba(255, 255, 255, 0.5);
          opacity: 1;
        }
        
        .org-editor-textarea:focus {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          outline: none;
          color: #FFFFFF;
        }
        
        @media (max-width: 768px) {
          .org-editor-card {
            padding: 1.5rem !important;
            margin-bottom: 2rem !important;
            border-radius: 12px !important;
          }
          
          .org-editor-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        padding: '24px',
        color: colors.light,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header con info del social */}
          <div style={{
            marginBottom: '2rem',
            padding: '20px',
            background: `${colors.dark}33`,
            borderRadius: '12px',
            color: colors.light,
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>
              📅 Nueva Fecha para: {parent.nombre}
            </h2>
            <p style={{ opacity: 0.7, margin: 0 }}>
              {parent.descripcion || 'Sin descripción'}
            </p>
          </div>

          {/* Formulario completo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}
          >
            {/* Información Básica */}
            <div className="org-editor-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                📝 Información Básica
              </h3>
              <div className="org-editor-grid">
                <div>
                  <label className="org-editor-field">
                    Nombre del Evento *
                  </label>
                  <input
                    type="text"
                    value={dateForm.nombre}
                    onChange={(e) => setDateForm({ ...dateForm, nombre: e.target.value })}
                    placeholder="Nombre del evento"
                    className="org-editor-input"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="org-editor-field">
                    Biografía
                  </label>
                  <textarea
                    value={dateForm.biografia}
                    onChange={(e) => setDateForm({ ...dateForm, biografia: e.target.value })}
                    placeholder="Describe el evento, su propósito, qué esperar..."
                    rows={2}
                    className="org-editor-textarea"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="org-editor-field">
                    DJs presentes
                  </label>
                  <textarea
                    value={dateForm.djs}
                    onChange={(e) => setDateForm({ ...dateForm, djs: e.target.value })}
                    placeholder="Ejemplo: DJ Juan | DJ María | DJ Invitado Especial"
                    rows={2}
                    className="org-editor-textarea"
                  />
                </div>
                <div>
                  <label className="org-editor-field">
                    Teléfono / WhatsApp para más información
                  </label>
                  <input
                    type="tel"
                    value={dateForm.telefono_contacto}
                    onChange={(e) => setDateForm({ ...dateForm, telefono_contacto: e.target.value })}
                    placeholder="Ejemplo: 55 1234 5678"
                    className="org-editor-input"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="org-editor-field">
                    Mensaje de saludo para WhatsApp
                  </label>
                  <textarea
                    value={dateForm.mensaje_contacto}
                    onChange={(e) => setDateForm({ ...dateForm, mensaje_contacto: e.target.value })}
                    onFocus={(e) => {
                      if (!dateForm.mensaje_contacto) {
                        const nombre = dateForm.nombre || 'este evento';
                        const template = `me interesa el evento "${nombre}".`;
                        setDateForm(prev => ({ ...prev, mensaje_contacto: template }));
                      }
                    }}
                    placeholder='Ejemplo: "me interesa el evento de esta fecha..."'
                    rows={2}
                    className="org-editor-textarea"
                  />
                </div>
              </div>
            </div>

            {/* Ritmos */}
            <div className="org-editor-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                🎵 Ritmos de Baile
              </h3>
              <div style={{ marginTop: 8 }}>
                <RitmosChips
                  selected={dateForm.ritmos_seleccionados || []}
                  allowedIds={((parent as any)?.ritmos_seleccionados || []) as string[]}
                  onChange={(ids) => {
                    setDateForm({ ...dateForm, ritmos_seleccionados: ids });
                    // Mapear también a estilos (tag IDs) si es posible
                    try {
                      const labelByCatalogId = new Map<string, string>();
                      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
                      const nameToTagId = new Map<string, number>(
                        ritmoTags.map((t: any) => [t.nombre, t.id])
                      );
                      const mappedTagIds = ids
                        .map(cid => labelByCatalogId.get(cid))
                        .filter(Boolean)
                        .map((label: any) => nameToTagId.get(label as string))
                        .filter((n): n is number => typeof n === 'number');
                      setDateForm(prev => ({ ...prev, estilos: mappedTagIds }));
                    } catch { }
                  }}
                />
              </div>
            </div>

            {/* Fecha y Hora */}
            <div className="org-editor-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                📅 Fecha y Hora
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="org-editor-field">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={dateForm.fecha}
                    onChange={(e) => setDateForm({ ...dateForm, fecha: e.target.value })}
                    required
                    className="org-editor-input"
                    style={{ color: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label className="org-editor-field">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={dateForm.hora_inicio}
                    onChange={(e) => setDateForm({ ...dateForm, hora_inicio: e.target.value })}
                    className="org-editor-input"
                    style={{ color: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label className="org-editor-field">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={dateForm.hora_fin}
                    onChange={(e) => setDateForm({ ...dateForm, hora_fin: e.target.value })}
                    className="org-editor-input"
                    style={{ color: '#FFFFFF' }}
                  />
                </div>
              </div>

              {/* Repetición Semanal */}
              <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: dateForm.repetir_semanal ? '16px' : '0' }}>
                  <input
                    type="checkbox"
                    checked={dateForm.repetir_semanal || false}
                    onChange={(e) => setDateForm({ ...dateForm, repetir_semanal: e.target.checked })}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: '#FFFFFF' }}>
                    🔁 Repetir semanalmente
                  </span>
                </label>

                {dateForm.repetir_semanal && (
                  <div style={{ marginTop: '16px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#FFFFFF',
                    }}>
                      Número de semanas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={dateForm.semanas_repetir || 4}
                      onChange={(e) => setDateForm({ ...dateForm, semanas_repetir: parseInt(e.target.value) || 4 })}
                      className="org-editor-input"
                      style={{ color: '#FFFFFF' }}
                    />
                    <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '4px', color: '#FFFFFF' }}>
                      Se crearán fechas cada semana durante {dateForm.semanas_repetir || 4} semana{(dateForm.semanas_repetir || 4) !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ubicaciones */}
            <div className="org-editor-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                📍 Ubicación del Evento
              </h3>
              {orgLocations.length > 0 && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label className="org-editor-field">Elegir ubicación existente o ingresa una nueva</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={selectedDateLocationId}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          if (!nextId) {
                            setSelectedDateLocationId('');
                            handleDateUbicacionesChange([]);
                            return;
                          }
                          const found = orgLocations.find((loc) => String(loc.id ?? '') === nextId);
                          applyOrganizerLocationToDateForm(found);
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
              {/* Formulario de ubicación manual */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="org-editor-field">Nombre de la ubicación</label>
                  <input
                    type="text"
                    value={dateForm.lugar || ''}
                    onChange={(e) => updateManualDateLocationField('lugar', e.target.value)}
                    placeholder="Ej: Sede Central / Salón Principal"
                    className="org-editor-input"
                  />
                </div>
                <div>
                  <label className="org-editor-field">Dirección</label>
                  <input
                    type="text"
                    value={dateForm.direccion || ''}
                    onChange={(e) => updateManualDateLocationField('direccion', e.target.value)}
                    placeholder="Calle, número, colonia"
                    className="org-editor-input"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label className="org-editor-field">Ciudad</label>
                  <input
                    type="text"
                    value={dateForm.ciudad || ''}
                    onChange={(e) => updateManualDateLocationField('ciudad', e.target.value)}
                    placeholder="Ciudad"
                    className="org-editor-input"
                  />
                </div>
                <div>
                  <label className="org-editor-field">Notas o referencias</label>
                  <input
                    type="text"
                    value={dateForm.referencias || ''}
                    onChange={(e) => updateManualDateLocationField('referencias', e.target.value)}
                    placeholder="Ej. Entrada lateral, 2do piso"
                    className="org-editor-input"
                  />
                </div>
              </div>

              {/* Zonas - Visualización cuando hay ubicación seleccionada */}
              {selectedDateLocationId && (() => {
                const zonasFromLocation = getZonasFromSelectedLocation();
                if (zonasFromLocation.length === 0) return null;
                return (
                  <div style={{ marginTop: '16px' }}>
                    <label className="org-editor-field" style={{ marginBottom: '8px', display: 'block' }}>
                      Zonas de la ubicación seleccionada
                    </label>
                    <ZonaGroupedChips
                      selectedIds={zonasFromLocation}
                      allTags={zonaTags}
                      mode="display"
                      autoExpandSelectedParents={true}
                      size="compact"
                      style={{
                        gap: '4px',
                        fontSize: 12,
                      }}
                    />
                  </div>
                );
              })()}

              {/* Zonas - Selección cuando se ingresa manualmente */}
              {!selectedDateLocationId && (
                <div style={{ marginTop: '16px' }}>
                  <label className="org-editor-field" style={{ marginBottom: '8px', display: 'block' }}>
                    Zonas de la Ciudad
                  </label>
                  <ZonaGroupedChips
                    selectedIds={dateForm.zonas}
                    allTags={zonaTags}
                    mode="edit"
                    onToggle={toggleZona}
                    size="compact"
                    style={{
                      gap: '4px',
                      fontSize: 12,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Cronograma */}
            <div className="org-editor-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                📅 Cronograma del Evento
              </h3>
              <ScheduleEditor
                schedule={dateForm.cronograma || []}
                onChangeSchedule={(cronograma) => setDateForm({ ...dateForm, cronograma })}
                costos={dateForm.costos || []}
                onChangeCostos={(costos) => setDateForm({ ...dateForm, costos })}
                ritmos={ritmoTags}
                zonas={zonaTags}
                eventFecha={dateForm.fecha}
                onSaveCosto={() => {
                  showToast('💰 Costo guardado en el formulario. Recuerda hacer click en "✨ Crear" para guardar la fecha completa.', 'info');
                }}
              />
            </div>

            {/* Flyer */}
            <div className="org-editor-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                🖼️ Flyer del Evento
              </h3>
              <DateFlyerUploader
                value={dateForm.flyer_url || null}
                onChange={(url) => setDateForm({ ...dateForm, flyer_url: url })}
                dateId={null}
                parentId={parentIdNum || undefined}
              />
            </div>

            {/* Estado de Publicación */}
            <div className="org-editor-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                🌐 Estado de Publicación
              </h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
                    checked={dateForm.estado_publicacion === 'borrador'}
                    onChange={(e) => setDateForm({ ...dateForm, estado_publicacion: e.target.value as 'borrador' | 'publicado' })}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span style={{ color: '#FFFFFF', fontSize: '1rem' }}>
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
                    checked={dateForm.estado_publicacion === 'publicado'}
                    onChange={(e) => setDateForm({ ...dateForm, estado_publicacion: e.target.value as 'borrador' | 'publicado' })}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span style={{ color: '#FFFFFF', fontSize: '1rem' }}>
                    🌐 Público (visible para todos)
                  </span>
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="org-editor-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'transparent',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateDate}
                disabled={createDate.isPending || !dateForm.fecha}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: createDate.isPending || !dateForm.fecha ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(30, 136, 229, 0.3)',
                  opacity: createDate.isPending || !dateForm.fecha ? 0.6 : 1
                }}
              >
                {createDate.isPending ? '⏳ Creando...' : '✨ Crear'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
