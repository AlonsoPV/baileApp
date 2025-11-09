import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTeacherMy, useUpsertTeacher } from "../../hooks/useTeacher";
import { useTeacherMedia } from "../../hooks/useTeacherMedia";
import { useTags } from "../../hooks/useTags";
import RitmosChips from "@/components/RitmosChips";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { useHydratedForm } from "../../hooks/useHydratedForm";
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { PhotoManagementSection } from "../../components/profile/PhotoManagementSection";
import { VideoManagementSection } from "../../components/profile/VideoManagementSection";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import FAQEditor from "../../components/common/FAQEditor";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import EventScheduleEditor from "../../components/events/ScheduleEditor";
import EventCostsEditor from "../../components/events/CostsEditor";
// import CostosyHorarios from './CostosyHorarios';
import ClasesLive from '../../components/events/ClasesLive';
import UbicacionesEditor from "../../components/locations/UbicacionesEditor";
import CrearClase from "../../components/events/CrearClase";
import { getDraftKey } from "../../utils/draftKeys";
import { useRoleChange } from "../../hooks/useRoleChange";
import { useAuth } from "@/contexts/AuthProvider";
import '@/styles/organizer.css';

const colors = {
  primary: '#E53935',
  secondary: '#FB8C00',
  blue: '#1E88E5',
  coral: '#FF7043',
  light: '#F5F5F5',
  dark: '#1A1A1A',
  orange: '#FF9800'
};

export default function TeacherProfileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: teacher, isLoading } = useTeacherMy();
  const { data: allTags } = useTags();
  const { media, add, remove } = useTeacherMedia();
  const upsert = useUpsertTeacher();
  const [editingIndex, setEditingIndex] = React.useState<number|null>(null);
  const [editInitial, setEditInitial] = React.useState<any>(undefined);
  const [statusMsg, setStatusMsg] = React.useState<{ type: 'ok'|'err'; text: string }|null>(null);

  // Hook para cambio de rol
  useRoleChange();

  const { form, setField, setNested, setAll } = useHydratedForm({
    draftKey: getDraftKey(user?.id, 'teacher'),
    serverData: teacher,
    defaults: {
      nombre_publico: "",
      bio: "",
      ritmos_seleccionados: [] as string[],
      ritmos: [] as number[],
      zonas: [] as number[],
      cronograma: [] as any[],
      costos: [] as any[],
      ubicaciones: [] as any[],
      redes_sociales: {
        instagram: "",
        facebook: "",
        whatsapp: ""
      },
      respuestas: {
        redes: {
          instagram: "",
          facebook: "",
          whatsapp: ""
        },
        dato_curioso: "",
        gusta_bailar: ""
      },
      faq: [] as any[]
    } as any
  });

  const handleSave = async () => {
    try {
      console.log("🚀 [teacherProfileEditor] ===== INICIANDO GUARDADO =====");
      console.log("📤 [teacherProfileEditor] Datos a enviar:", form);
      console.log("📱 [teacherProfileEditor] Redes sociales:", form.redes_sociales);
      console.log("📝 [teacherProfileEditor] Nombre público:", form.nombre_publico);
      console.log("📄 [teacherProfileEditor] Bio:", form.bio);
      console.log("🎵 [TeacherProfileEditor] Ritmos:", (form as any).ritmos);

      const selectedCatalogIds = ((form as any)?.ritmos_seleccionados || []) as string[];
      
      // Crear payload limpio con SOLO los campos que existen en profiles_teacher
      const payload: any = {
        nombre_publico: form.nombre_publico,
        bio: form.bio,
        zonas: (form as any).zonas || [],
        ubicaciones: (form as any).ubicaciones || [],
        cronograma: (form as any).cronograma || [],
        costos: (form as any).costos || [],
        redes_sociales: form.redes_sociales,
        estado_aprobacion: 'aprobado'  // Marcar como aprobado al guardar
      };

      // Agregar ritmos_seleccionados solo si hay selección
      if (selectedCatalogIds && selectedCatalogIds.length > 0) {
        payload.ritmos_seleccionados = selectedCatalogIds;
      }

      // Solo incluir id si existe (para updates)
      if ((form as any)?.id) {
        payload.id = (form as any).id;
      }

      console.log("📦 [TeacherProfileEditor] Payload limpio:", payload);
      await upsert.mutateAsync(payload);
      console.log("✅ [teacherProfileEditor] Guardado exitoso");
      
      // Mostrar mensaje de éxito
      setStatusMsg({ type: 'ok', text: '✅ Perfil guardado exitosamente' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (error) {
      console.error("❌ [teacherProfileEditor] Error guardando:", error);
      setStatusMsg({ type: 'err', text: '❌ Error al guardar el perfil' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const toggleRitmo = (ritmoId: number) => {
    const current = (form as any).ritmos || [];
    const next = current.includes(ritmoId)
      ? current.filter((id: number) => id !== ritmoId)
      : [...current, ritmoId];
    setField('ritmos' as any, next as any);
  };

  const toggleZona = (zonaId: number) => {
    const currentZonas = (form as any).zonas || [];
    const newZonas = currentZonas.includes(zonaId)
      ? currentZonas.filter((id: number) => id !== zonaId)
      : [...currentZonas, zonaId];
    setField('zonas' as any, newZonas as any);
  };

  const uploadFile = async (file: File, slot: string) => {
    try {
      await add.mutateAsync({ file, slot });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const removeFile = async (slot: string) => {
    try {
      const mediaItem = getMediaBySlot(media as unknown as MediaSlotItem[], slot);
      if (mediaItem && 'id' in mediaItem) {
        await remove.mutateAsync((mediaItem as any).id);
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  if (isLoading) {
  return (
    <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>Cargando Maestro...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .academy-editor-container {
          min-height: 100vh;
          padding: 2rem 1rem;
        }
        .academy-editor-inner {
          max-width: 800px;
          margin: 0 auto;
        }
        .academy-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .academy-editor-card {
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 3rem;
        }
        .academy-editor-grid {
          display: grid;
          gap: 1.5rem;
        }
        .academy-social-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .academy-editor-container {
            padding: 1rem 0.75rem !important;
          }
          .academy-editor-inner {
            max-width: 100% !important;
            padding: 0 0.5rem !important;
          }
          .academy-editor-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
          .academy-editor-card {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 12px !important;
          }
          .academy-editor-card h2 {
            font-size: 1.25rem !important;
            margin-bottom: 1rem !important;
          }
          .academy-editor-grid {
            gap: 1rem !important;
          }
          .academy-social-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .org-editor__header {
            flex-direction: column !important;
            gap: 0.75rem !important;
            text-align: center !important;
          }
          .org-editor__back {
            align-self: flex-start !important;
          }
          .org-editor__title {
            font-size: 1.5rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .academy-editor-container {
            padding: 0.75rem 0.5rem !important;
          }
          .academy-editor-inner {
            padding: 0 0.25rem !important;
          }
          .academy-editor-card {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 10px !important;
          }
          .academy-editor-card h2 {
            font-size: 1.1rem !important;
            margin-bottom: 0.75rem !important;
          }
          .org-editor__title {
            font-size: 1.25rem !important;
          }
          input, textarea {
            font-size: 0.9rem !important;
            padding: 0.625rem !important;
          }
          label {
            font-size: 0.875rem !important;
            margin-bottom: 0.375rem !important;
          }
          /* Chips responsive */
          .academy-chips-container {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          /* Class buttons responsive */
          .academy-class-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .academy-class-buttons {
            width: 100% !important;
            display: flex !important;
            gap: 0.5rem !important;
          }
          .academy-class-buttons button {
            flex: 1 !important;
            padding: 0.5rem !important;
            font-size: 0.875rem !important;
          }
        }
      `}</style>
      <div className="academy-editor-container org-editor" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div className="academy-editor-inner" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header con botón volver + título centrado + toggle (diseño organizer) */}
        <div className="org-editor__header">
          <button className="org-editor__back" onClick={() => navigate(-1)}>← Volver</button>
          <h1 className="org-editor__title">✏️ Editar Maestro</h1>
          <div style={{ width: 100 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
          <ProfileNavigationToggle
            currentView="edit"
            profileType="teacher"
            onSave={handleSave}
            isSaving={upsert.isPending}
            saveDisabled={!form.nombre_publico?.trim()}
            editHref="/profile/teacher/edit"
            liveHref="/profile/teacher"
          />
        </div>

        {/* Mensaje de estado global */}
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginBottom: '1.5rem',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              border: statusMsg.type === 'ok' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)',
              background: statusMsg.type === 'ok' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              textAlign: 'center',
              boxShadow: statusMsg.type === 'ok' 
                ? '0 4px 12px rgba(16,185,129,0.2)' 
                : '0 4px 12px rgba(239,68,68,0.2)'
            }}
          >
            {statusMsg.text}
          </motion.div>
        )}

        {/* Banner de Bienvenida (solo para perfiles nuevos) */}
        {!teacher && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '1.5rem',
              marginBottom: '2rem',
              background: 'linear-gradient(135deg, rgba(229, 57, 53, 0.2) 0%, rgba(251, 140, 0, 0.2) 100%)',
              border: '2px solid rgba(229, 57, 53, 0.4)',
              borderRadius: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎓</div>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700',
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ¡Bienvenido, Maestro!
            </h3>
            <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1rem' }}>
              Completa tu información básica y haz clic en <strong>💾 Guardar</strong> arriba para crear tu perfil
            </p>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              👆 Mínimo requerido: <strong>Nombre del Maestro</strong>
            </div>
          </motion.div>
        )}

        {/* Información Básica */}
        <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            📚 Información Básica
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                🎓 Nombre de la Maestro *
              </label>
              <input
                type="text"
                value={form.nombre_publico}
                onChange={(e) => setField('nombre_publico', e.target.value)}
                placeholder="Ej: Maestro de Baile Moderno"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                📝 Descripción
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setField('bio', e.target.value)}
                placeholder="Cuéntanos sobre tus inicios dando clases, su historia, metodología y lo que la hace especial..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
      color: colors.light,
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        </div>

        {/* Estilos & Zonas - tarjeta mejorada */}
        <div className="org-editor__card academy-editor-card" style={{ marginBottom: '3rem', position: 'relative', overflow: 'hidden', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(19,21,27,0.85), rgba(16,18,24,0.85))' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)' }} />

          {/* Header Estilos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1.25rem 1.25rem 0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1E88E5,#7C4DFF)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(30,136,229,0.35)' }}>🎵</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Estilos que Enseñamos</h2>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Selecciona los ritmos que enseñas</div>
            </div>
          </div>

          {/* Chips Estilos */}
          {/* <div className="academy-chips-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', padding: '0 1.25rem 1rem' }}>
            {allTags?.filter(tag => tag.tipo === 'ritmo').map(tag => (
              <Chip
                key={tag.id}
                label={tag.nombre}
                active={(form as any).ritmos?.includes(tag.id) || false}
                onClick={() => toggleRitmo(tag.id)}
                variant="ritmo"
                style={{
                  background: ((form as any).ritmos?.includes(tag.id) ? 'rgba(229, 57, 53, 0.2)' : 'rgba(255,255,255,0.04)'),
                  border: ((form as any).ritmos?.includes(tag.id) ? '1px solid #E53935' : '1px solid rgba(255,255,255,0.15)'),
                  color: ((form as any).ritmos?.includes(tag.id) ? '#E53935' : 'rgba(255,255,255,0.9)'),
                  fontWeight: 600
                }}
              />
            ))}
          </div> */}

          {/* Catálogo agrupado (independiente de DB) */}
          <div style={{ padding: '0 1.25rem 1.25rem' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Catálogo agrupado</div>
            {(() => {
              // Derivar selección inicial: usar ritmos_seleccionados si existe; si no, mapear desde ritmos numéricos
              let selectedCatalogIds = (((form as any)?.ritmos_seleccionados) || []) as string[];
              if ((!selectedCatalogIds || selectedCatalogIds.length === 0) && Array.isArray((form as any)?.ritmos)) {
                const labelToItemId = new Map<string, string>();
                RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelToItemId.set(i.id, i.label)));
                const names = ((form as any).ritmos as number[])
                  .map(id => (allTags || []).find((t: any) => t.id === id && t.tipo === 'ritmo')?.nombre)
                  .filter(Boolean) as string[];
                const mapped = names
                  .map(n => {
                    // invertir labelToItemId: label -> id
                    for (const [itemId, label] of Array.from(labelToItemId.entries())) {
                      if (label === n) return itemId;
                    }
                    return undefined;
                  })
                  .filter(Boolean) as string[];
                if (mapped.length > 0) selectedCatalogIds = mapped;
              }
              const onChangeCatalog = (ids: string[]) => {
                // Guardar selección de catálogo directamente
                setField('ritmos_seleccionados' as any, ids as any);
                // Intentar mapear también a ids de tags si existen (no bloqueante)
                try {
                  const labelByCatalogId = new Map<string, string>();
                  RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
                  const nameToTagId = new Map<string, number>(
                    (allTags || []).filter((t: any) => t.tipo === 'ritmo').map((t: any) => [t.nombre, t.id])
                  );
                  const mappedTagIds = ids
                    .map(cid => labelByCatalogId.get(cid))
                    .filter(Boolean)
                    .map((label: any) => nameToTagId.get(label as string))
                    .filter((n): n is number => typeof n === 'number');
                  setField('ritmos', mappedTagIds as any);
                } catch {}
              };

              return (
                <RitmosChips selected={selectedCatalogIds} onChange={onChangeCatalog} />
              );
            })()}
          </div>

          {/* Header Zonas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.5rem 1.25rem 0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1976D2,#00BCD4)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(25,118,210,0.35)' }}>🗺️</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, background: 'linear-gradient(135deg, #90CAF9 0%, #BBDEFB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Zonas</h2>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Indica las zonas donde opera la Maestro</div>
            </div>
          </div>

          {/* Chips Zonas */}
          <div className="academy-chips-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', padding: '0 1.25rem 1.25rem' }}>
            {allTags?.filter(tag => tag.tipo === 'zona').map(tag => (
              <Chip
                key={tag.id}
                label={tag.nombre}
                active={(form as any).zonas?.includes(tag.id) || false}
                onClick={() => toggleZona(tag.id)}
                variant="zona"
                style={{
                  background: ((form as any).zonas?.includes(tag.id) ? 'rgba(25,118,210,0.2)' : 'rgba(255,255,255,0.04)'),
                  border: ((form as any).zonas?.includes(tag.id) ? '1px solid #1976D2' : '1px solid rgba(255,255,255,0.15)'),
                  color: ((form as any).zonas?.includes(tag.id) ? '#90CAF9' : 'rgba(255,255,255,0.9)'),
                  fontWeight: 600
                }}
              />
            ))}
          </div>
        </div>

     

        {/* Horarios, Costos y Ubicación (unificado) */}
        <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            🗓️ Horarios, Costos y Ubicación
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Ubicaciones */}
            <UbicacionesEditor
              value={(form as any).ubicaciones || []}
              onChange={(v) => setField('ubicaciones' as any, v as any)}
              title="Ubicaciones"
            />
            {/* Crear Clase rápida */}
            <div>
              {statusMsg && (
                <div style={{
                  marginBottom: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: statusMsg.type === 'ok' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)',
                  background: statusMsg.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: '#fff',
                  fontSize: 14
                }}>
                  {statusMsg.text}
                </div>
              )}

              {/* Mensaje si no tiene perfil guardado */}
              {!teacher && (
                <div style={{
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  background: 'rgba(255, 140, 66, 0.15)',
                  border: '2px solid rgba(255, 140, 66, 0.3)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                  <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                    Debes guardar el perfil del maestro primero antes de crear clases
                  </p>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: '0.5rem 0 0 0' }}>
                    Completa el nombre del maestro y haz clic en 💾 Guardar arriba
                  </p>
                </div>
              )}

              {teacher && (
                <CrearClase
                ritmos={(() => {
                  const ritmoTags = (allTags || []).filter((t: any) => t.tipo === 'ritmo');
                  const labelByCatalogId = new Map<string, string>();
                  RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
                  // 1) Priorizar selección local del formulario (sin guardar)
                  const localSelected: string[] = ((form as any)?.ritmos_seleccionados || []) as string[];
                  if (Array.isArray(localSelected) && localSelected.length > 0) {
                    const localLabels = new Set(localSelected.map(id => labelByCatalogId.get(id)).filter(Boolean));
                    const filtered = ritmoTags.filter((t: any) => localLabels.has(t.nombre));
                    if (filtered.length > 0) return filtered.map((t: any) => ({ id: t.id, nombre: t.nombre }));
                  }
                  // 2) Fallback: todos
                  return ritmoTags.map((t: any) => ({ id: t.id, nombre: t.nombre }));
                })()}
                zonas={(allTags || []).filter((t: any) => t.tipo === 'zona').map((t: any) => ({ id: t.id, nombre: t.nombre }))}
                locations={((form as any).ubicaciones || []).map((u: any, i: number) => ({ id: u?.id || String(i), nombre: u?.nombre, direccion: u?.direccion, referencias: u?.referencias }))}
                editIndex={editingIndex}
                editValue={editInitial}
                title={editingIndex !== null ? 'Editar Clase' : 'Crear Clase'}
                onCancel={() => { setEditingIndex(null); setEditInitial(undefined); setStatusMsg(null); }}
                onSubmit={(c) => {
                  const currentCrono = ([...((form as any).cronograma || [])] as any[]);
                  const currentCostos = ([...((form as any).costos || [])] as any[]);

                  if (editingIndex !== null && editingIndex >= 0 && editingIndex < currentCrono.length) {
                    const prev = currentCrono[editingIndex];
                    const prevNombre = (prev?.referenciaCosto || prev?.titulo || '') as string;

                    let ubicacionStr = (
                      [c.ubicacionNombre, c.ubicacionDireccion].filter(Boolean).join(' · ')
                    ) + (c.ubicacionNotas ? ` (${c.ubicacionNotas})` : '');
                    const match = c?.ubicacionId
                      ? ((form as any).ubicaciones || []).find((u: any) => (u?.id || '') === c.ubicacionId)
                      : undefined;
                    if (!ubicacionStr.trim() && match) {
                      ubicacionStr = ([match?.nombre, match?.direccion].filter(Boolean).join(' · ')) + (match?.referencias ? ` (${match.referencias})` : '');
                    }

                    const updatedItem = {
                      ...prev,
                      tipo: 'clase',
                      titulo: c.nombre,
                      fecha: c.fechaModo === 'especifica' ? c.fecha : undefined,
                      diaSemana: c.fechaModo === 'semanal' ? c.diaSemana : null,
                      recurrente: c.fechaModo === 'semanal' ? 'semanal' : undefined,
                      inicio: c.inicio,
                      fin: c.fin,
                      nivel: c.nivel || undefined,
                      referenciaCosto: c.nombre,
                      ritmoId: c.ritmoId,
                      zonaId: c.zonaId,
                      ubicacion: (ubicacionStr && ubicacionStr.trim()) || c.ubicacion || ((form as any).ubicaciones || [])[0]?.nombre || '',
                      ubicacionId: c.ubicacionId || (match?.id || null)
                    };
                    currentCrono[editingIndex] = updatedItem;

                    const costoIdx = currentCostos.findIndex((x: any) => (x?.nombre || '').trim().toLowerCase() === (prevNombre || '').trim().toLowerCase());
                    const updatedCosto = {
                      nombre: c.nombre,
                      tipo: c.tipo,
                      precio: c.precio ?? null,
                      regla: c.regla || ''
                    } as any;
                    if (costoIdx >= 0) currentCostos[costoIdx] = updatedCosto; else currentCostos.push(updatedCosto);

                    setField('cronograma' as any, currentCrono as any);
                    setField('costos' as any, currentCostos as any);

                    const payload: any = { id: (form as any)?.id, cronograma: currentCrono, costos: currentCostos };
                    return upsert
                      .mutateAsync(payload)
                      .then(() => {
                        setStatusMsg({ type: 'ok', text: '✅ Clase actualizada' });
                        setTimeout(() => setStatusMsg(null), 2400);
                        setEditingIndex(null);
                        setEditInitial(undefined);
                        // eslint-disable-next-line no-console
                        console.log('[teacherProfileEditor] Clase editada y guardada');
                      })
                      .catch((e) => {
                        setStatusMsg({ type: 'err', text: '❌ Error al actualizar clase' });
                        // eslint-disable-next-line no-console
                        console.error('[teacherProfileEditor] Error editando clase', e);
                        throw e;
                      });
                  } else {
                    let ubicacionStr = (
                      [c.ubicacionNombre, c.ubicacionDireccion].filter(Boolean).join(' · ')
                    ) + (c.ubicacionNotas ? ` (${c.ubicacionNotas})` : '');
                    const match = c?.ubicacionId
                      ? ((form as any).ubicaciones || []).find((u: any) => (u?.id || '') === c.ubicacionId)
                      : undefined;
                    if (!ubicacionStr.trim() && match) {
                      ubicacionStr = ([match?.nombre, match?.direccion].filter(Boolean).join(' · ')) + (match?.referencias ? ` (${match.referencias})` : '');
                    }

                    const nextCrono = ([...currentCrono, {
                      tipo: 'clase',
                      titulo: c.nombre,
                      fecha: c.fechaModo === 'especifica' ? c.fecha : undefined,
                      diaSemana: c.fechaModo === 'semanal' ? c.diaSemana : null,
                      recurrente: c.fechaModo === 'semanal' ? 'semanal' : undefined,
                      inicio: c.inicio,
                      fin: c.fin,
                      nivel: c.nivel || undefined,
                      referenciaCosto: c.nombre,
                      ritmoId: c.ritmoId,
                      zonaId: c.zonaId,
                      ubicacion: (ubicacionStr && ubicacionStr.trim()) || c.ubicacion || ((form as any).ubicaciones || [])[0]?.nombre || '',
                      ubicacionId: c.ubicacionId || (match?.id || null)
                    }] as any);
                    const nextCostos = ([...currentCostos, {
                      nombre: c.nombre,
                      tipo: c.tipo,
                      precio: c.precio ?? null,
                      regla: c.regla || ''
                    }] as any);
                    setField('cronograma' as any, nextCrono as any);
                    setField('costos' as any, nextCostos as any);

                    const payload: any = { id: (form as any)?.id, cronograma: nextCrono, costos: nextCostos };
                    return upsert
                      .mutateAsync(payload)
                      .then(() => {
                        setStatusMsg({ type: 'ok', text: '✅ Clase creada' });
                        setTimeout(() => setStatusMsg(null), 2400);
                        // eslint-disable-next-line no-console
                        console.log('[teacherProfileEditor] Clase creada y guardada');
                      })
                      .catch((e) => {
                        setStatusMsg({ type: 'err', text: '❌ Error al crear clase' });
                        // eslint-disable-next-line no-console
                        console.error('[teacherProfileEditor] Error guardando clase', e);
                        throw e;
                      });
                  }
                }}
              />
              )}

              {teacher && Array.isArray((form as any)?.cronograma) && (form as any).cronograma.length > 0 && (
                <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                  {(form as any).cronograma.map((it: any, idx: number) => (
                    <div key={idx} className="academy-class-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#fff' }}>{it.titulo || 'Clase'}</strong>
                        <span style={{ fontSize: 12, opacity: 0.8 }}>🕒 {it.inicio || '—'} – {it.fin || '—'} {it.fecha ? `· 📅 ${it.fecha}` : ''}</span>
                      </div>
                      <div className="academy-class-buttons" style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const costo = ((form as any)?.costos || []).find((c: any) => (c?.nombre || '').trim().toLowerCase() === ((it?.referenciaCosto || it?.titulo || '') as string).trim().toLowerCase());
                            setEditingIndex(idx);
                            setEditInitial({
                              nombre: it.titulo || '',
                              tipo: (costo?.tipo as any) || 'clases sueltas',
                              precio: costo?.precio ?? null,
                              regla: costo?.regla || '',
                              fechaModo: it.fecha ? 'especifica' : 'semanal',
                              fecha: it.fecha || '',
                          diaSemana: (it as any)?.diaSemana ?? null,
                              inicio: it.inicio || '',
                              fin: it.fin || '',
                              ritmoId: it.ritmoId ?? null,
                              zonaId: it.zonaId ?? null,
                          ubicacion: it.ubicacion || '',
                          ubicacionId: (it as any)?.ubicacionId || null
                            });
                            setStatusMsg(null);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const ok = window.confirm('¿Eliminar esta clase? Esta acción no se puede deshacer.');
                            if (!ok) return;

                            const currentCrono = ([...((form as any).cronograma || [])] as any[]);
                            const currentCostos = ([...((form as any).costos || [])] as any[]);

                            const refKey = ((it?.referenciaCosto || it?.titulo || '') as string).trim().toLowerCase();
                            const nextCrono = currentCrono.filter((_: any, i: number) => i !== idx);
                            const nextCostos = refKey
                              ? currentCostos.filter((c: any) => (c?.nombre || '').trim().toLowerCase() !== refKey)
                              : currentCostos;

                            setField('cronograma' as any, nextCrono as any);
                            setField('costos' as any, nextCostos as any);

                            const payload: any = { id: (form as any)?.id, cronograma: nextCrono, costos: nextCostos };
                            upsert
                              .mutateAsync(payload)
                              .then(() => {
                                setStatusMsg({ type: 'ok', text: '✅ Clase eliminada' });
                                if (editingIndex !== null && editingIndex === idx) {
                                  setEditingIndex(null);
                                  setEditInitial(undefined);
                                }
                              })
                              .catch((e) => {
                                setStatusMsg({ type: 'err', text: '❌ Error al eliminar clase' });
                                // eslint-disable-next-line no-console
                                console.error('[teacherProfileEditor] Error eliminando clase', e);
                              });
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 10,
                            border: '1px solid rgba(229,57,53,0.35)',
                            background: 'rgba(229,57,53,0.12)',
                            color: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vista previa dentro del mismo contenedor */}
            {/* <div style={{ padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span>👀</span>
                <strong style={{ color: '#fff' }}>Vista previa</strong>
              </div>
              <ClasesLive
                cronograma={(form as any)?.cronograma || []}
                costos={(form as any)?.costos || []}
                ubicacion={{
                  nombre: (form as any)?.ubicaciones?.[0]?.nombre,
                  direccion: (form as any)?.ubicaciones?.[0]?.direccion,
                  referencias: (form as any)?.ubicaciones?.[0]?.referencias,
                }}
              />
            </div> */}
          </div>
        </div>

        {/* Redes Sociales */}
        <div
          id="organizer-social-networks"
          data-test-id="organizer-social-networks"
          style={{
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            📱 Redes Sociales
          </h2>

          <div className="academy-social-grid">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                📸 Instagram
              </label>
              <input
                type="text"
                value={form.redes_sociales.instagram}
                onChange={(e) => setNested('redes_sociales.instagram', e.target.value)}
                placeholder="@tu_organizacion"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: colors.light,
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                👥 Facebook
              </label>
              <input
                type="text"
                value={form.redes_sociales.facebook}
                onChange={(e) => setNested('redes_sociales.facebook', e.target.value)}
                placeholder="Página o perfil"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: colors.light,
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                💬 WhatsApp
              </label>
              <input
                type="text"
                value={form.redes_sociales.whatsapp}
                onChange={(e) => setNested('redes_sociales.whatsapp', e.target.value)}
                placeholder="Número de teléfono"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: colors.light,
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Maestros Invitados */}
        {/* <InvitedMastersSection
          masters={[]} // TODO: Conectar con datos reales en el siguiente sprint
          title="🎭 Maestros Invitados"
          showTitle={true}
          isEditable={true}
          availableUserMasters={[]} // TODO: Obtener usuarios con perfil de maestro
          onAddMaster={() => {
            // TODO: Implementar modal para agregar maestro externo
            console.log('Agregar maestro externo');
          }}
          onAssignUserMaster={() => {
            // TODO: Implementar modal para asignar usuario maestro
            console.log('Asignar usuario maestro');
          }}
          onEditMaster={(master) => {
            // TODO: Implementar modal para editar maestro
            console.log('Editar maestro:', master);
          }}
          onRemoveMaster={(masterId) => {
            // TODO: Implementar confirmación y eliminación
            console.log('Eliminar maestro:', masterId);
          }}
        /> */}

        {/* Información para Estudiantes */}
        <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            💬 Información para Estudiantes
          </h2>

          <FAQEditor value={(form as any).faq || []} onChange={(v: any) => setField('faq' as any, v as any)} />
        </div>

        {/* Gestión de Fotos */}
        <PhotoManagementSection
          media={media}
          uploading={{ p1: add.isPending }}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="📷 Gestión de Fotos"
          description="Sube fotos de tus clases y eventos"
          slots={['p1']}
          isMainPhoto={true}
        />

        {/* Fotos Adicionales */}
        <PhotoManagementSection
          media={media}
          uploading={Object.fromEntries(PHOTO_SLOTS.slice(3).map(slot => [slot, add.isPending]))}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="📷 Fotos Adicionales (p4-p10)"
          description="Más fotos para mostrar diferentes aspectos de tu Maestro"
          slots={PHOTO_SLOTS.slice(3)} // p4-p10
        />

        {/* Gestión de Videos */}
        <VideoManagementSection
          media={media}
          uploading={Object.fromEntries(VIDEO_SLOTS.map(slot => [slot, add.isPending]))}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="🎥 Gestión de Videos"
          description="Videos promocionales, clases de muestra, testimonios"
          slots={[...VIDEO_SLOTS]}
        />
      </div>
    </div>
    </>
  );
}
