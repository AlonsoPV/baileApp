import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAcademyMy, useUpsertAcademy } from "../../hooks/useAcademy";
import { useAcademyMedia } from "../../hooks/useAcademyMedia";
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
import TeacherCard from "../../components/explore/cards/TeacherCard";
import FAQEditor from "../../components/common/FAQEditor";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
// import CostosyHorarios from './CostosyHorarios';
import ClasesLive from '../../components/events/ClasesLive';
import UbicacionesEditor from "../../components/locations/UbicacionesEditor";
import CrearClase from "../../components/events/CrearClase";
import { useAllowedRitmos } from "@/hooks/useAllowedRitmos";
import { getDraftKey } from "../../utils/draftKeys";
import { useRoleChange } from "../../hooks/useRoleChange";
import { useAuth } from "@/contexts/AuthProvider";
import '@/styles/organizer.css';
import CostsPromotionsEditor from "../../components/events/CostsPromotionsEditor";
import { generateClassId, ensureClassId } from "../../utils/classIdGenerator";
import { useAvailableTeachers, useAcceptedTeachers, useSendInvitation, useCancelInvitation } from "../../hooks/useAcademyTeacherInvitations";
import { supabase } from "@/lib/supabase";
import { AcademyMetricsPanel } from "../../components/profile/AcademyMetricsPanel";

const colors = {
  primary: '#E53935',
  secondary: '#FB8C00',
  blue: '#1E88E5',
  coral: '#FF7043',
  light: '#F5F5F5',
  dark: '#1A1A1A',
  orange: '#FF9800'
};

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return 'Gratis';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (numeric === null || Number.isNaN(numeric)) return `$${String(value)}`;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `$${Number(numeric).toLocaleString('en-US')}`;
  }
};

const formatDateOrDay = (fecha?: string, diaSemana?: number | null) => {
  if (fecha) {
    const parsed = new Date(fecha);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  if (typeof diaSemana === 'number' && diaSemana >= 0 && diaSemana <= 6) {
    return dayNames[diaSemana];
  }
  return null;
};

export default function AcademyProfileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: academy, isLoading } = useAcademyMy();
  const { data: allTags } = useTags();
  const { allowedIds, isLoading: allowedLoading } = useAllowedRitmos();
  const { media, add, remove } = useAcademyMedia();
  const upsert = useUpsertAcademy();
  const [editingIndex, setEditingIndex] = React.useState<number|null>(null);
  const [editInitial, setEditInitial] = React.useState<any>(undefined);
  const [statusMsg, setStatusMsg] = React.useState<{ type: 'ok'|'err'; text: string }|null>(null);
  const [activeTab, setActiveTab] = React.useState<"perfil" | "metricas">("perfil");

  // Hook para cambio de rol
  useRoleChange();

  const { form, setField, setNested, setAll } = useHydratedForm({
    draftKey: getDraftKey(user?.id, 'academy'),
    serverData: academy,
    defaults: {
      nombre_publico: "",
      bio: "",
      ritmos_seleccionados: [] as string[],
      zonas: [] as number[],
      cronograma: [] as any[],
      costos: [] as any[],
      promociones: [] as any[],
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

  const supportsPromotions = React.useMemo(() => {
    if (!academy) return false;
    return Object.prototype.hasOwnProperty.call(academy, 'promociones');
  }, [academy]);

  // Hooks para invitaciones
  const academyId = (academy as any)?.id;
  const { data: availableTeachers, isLoading: loadingTeachers, refetch: refetchAvailable } = useAvailableTeachers(academyId);
  const { data: acceptedTeachers, refetch: refetchAccepted } = useAcceptedTeachers(academyId);
  const sendInvitation = useSendInvitation();
  const cancelInvitation = useCancelInvitation();
  const [showTeacherModal, setShowTeacherModal] = React.useState(false);

  // Asegurar que redes_sociales siempre sea un objeto, no null
  React.useEffect(() => {
    if (form.redes_sociales === null || typeof form.redes_sociales !== 'object') {
      setField('redes_sociales', {
        instagram: "",
        facebook: "",
        whatsapp: ""
      });
    }
  }, [form.redes_sociales, setField]);

  // Debug: Log de maestros aceptados
  React.useEffect(() => {
    if (academyId) {
      console.log('[AcademyProfileEditor] academyId:', academyId);
      console.log('[AcademyProfileEditor] acceptedTeachers:', acceptedTeachers);
    }
  }, [academyId, acceptedTeachers]);

  // Asegurar que todas las clases tengan un ID único (solo una vez al cargar)
  const hasEnsuredIds = React.useRef(false);
  React.useEffect(() => {
    if (hasEnsuredIds.current) return; // Ya se aseguraron los IDs
    const cronograma = (form as any)?.cronograma;
    if (Array.isArray(cronograma) && cronograma.length > 0 && (form as any)?.id) {
      const needsUpdate = cronograma.some((it: any) => !it.id || typeof it.id !== 'number');
      if (needsUpdate) {
        hasEnsuredIds.current = true;
        const updatedCrono = cronograma.map((it: any) => ({
          ...it,
          id: ensureClassId(it)
        }));
        setField('cronograma' as any, updatedCrono as any);
        // Actualizar también en la base de datos silenciosamente
        const payload: any = { id: (form as any)?.id, cronograma: updatedCrono };
        upsert.mutateAsync(payload).catch((e) => {
          console.error('[AcademyProfileEditor] Error actualizando IDs de clases', e);
          hasEnsuredIds.current = false; // Reset si falla para intentar de nuevo
        });
      } else {
        hasEnsuredIds.current = true; // Todas las clases ya tienen IDs
      }
    }
  }, [academy, (form as any)?.cronograma, (form as any)?.id, setField, upsert]);

  const handleSave = async () => {
    try {
      console.log("🚀 [AcademyProfileEditor] ===== INICIANDO GUARDADO =====");
      console.log("📤 [AcademyProfileEditor] Datos a enviar:", form);
      console.log("📱 [AcademyProfileEditor] Redes sociales:", form.redes_sociales);
      console.log("📝 [AcademyProfileEditor] Nombre público:", form.nombre_publico);
      console.log("📄 [AcademyProfileEditor] Bio:", form.bio);

      const selectedCatalogIds = ((form as any)?.ritmos_seleccionados || []) as string[];
      
      // Crear payload limpio con SOLO los campos que existen en profiles_academy
      const payload: any = {
        nombre_publico: form.nombre_publico,
        bio: form.bio,
        zonas: (form as any).zonas || [],
        ubicaciones: (form as any).ubicaciones || [],
        horarios: (form as any).cronograma || [],     // Guardar en horarios
        cronograma: (form as any).cronograma || [],   // También en cronograma para compatibilidad
        costos: (form as any).costos || [],           // Guardar costos
        redes_sociales: form.redes_sociales,
        estado_aprobacion: 'aprobado'  // Marcar como aprobado al guardar
      };

      if (supportsPromotions) {
        payload.promociones = (form as any).promociones || [];
      }

      // Agregar ritmos_seleccionados solo si hay selección (requiere ejecutar SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_ACADEMY.sql)
      if (selectedCatalogIds && selectedCatalogIds.length > 0) {
        payload.ritmos_seleccionados = selectedCatalogIds;
      }

      // Solo incluir id si existe (para updates)
      if ((form as any)?.id) {
        payload.id = (form as any).id;
      }

      console.log("📦 [AcademyProfileEditor] Payload limpio:", payload);
      await upsert.mutateAsync(payload);
      console.log("✅ [AcademyProfileEditor] Guardado exitoso");
      
      // Mostrar mensaje de éxito
      setStatusMsg({ type: 'ok', text: '✅ Perfil guardado exitosamente' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (error) {
      console.error("❌ [AcademyProfileEditor] Error guardando:", error);
      setStatusMsg({ type: 'err', text: '❌ Error al guardar el perfil' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Ya no se usa toggleEstilo, ahora se maneja directamente en RitmosChips
  // const toggleEstilo = (estiloId: number) => {
  //   const currentEstilos = form.estilos || [];
  //   const newEstilos = currentEstilos.includes(estiloId)
  //     ? currentEstilos.filter(id => id !== estiloId)
  //     : [...currentEstilos, estiloId];
  //   setField('estilos', newEstilos);
  // };

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
        <p>Cargando academia...</p>
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
          <h1 className="org-editor__title">✏️ Editar Academia</h1>
          <div style={{ width: 100 }} />
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '2rem',
          borderBottom: '2px solid rgba(255,255,255,0.1)',
          paddingBottom: '0.5rem'
        }}>
          <button
            onClick={() => setActiveTab("perfil")}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px 12px 0 0',
              border: 'none',
              background: activeTab === "perfil" 
                ? 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(245,87,108,0.2))'
                : 'transparent',
              color: '#fff',
              fontWeight: activeTab === "perfil" ? 800 : 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderBottom: activeTab === "perfil" ? '2px solid rgba(240,147,251,0.5)' : '2px solid transparent',
            }}
          >
            📝 Perfil
          </button>
          <button
            onClick={() => setActiveTab("metricas")}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px 12px 0 0',
              border: 'none',
              background: activeTab === "metricas" 
                ? 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(245,87,108,0.2))'
                : 'transparent',
              color: '#fff',
              fontWeight: activeTab === "metricas" ? 800 : 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderBottom: activeTab === "metricas" ? '2px solid rgba(240,147,251,0.5)' : '2px solid transparent',
            }}
          >
            📊 Métricas clases
          </button>
        </div>

        {activeTab === "metricas" && academyId && (
          <AcademyMetricsPanel academyId={academyId} />
        )}

        {activeTab === "perfil" && (
          <>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
          <ProfileNavigationToggle
            currentView="edit"
            profileType="academy"
            onSave={handleSave}
            isSaving={upsert.isPending}
            saveDisabled={!form.nombre_publico?.trim()}
            editHref="/profile/academy/edit"
            liveHref="/profile/academy"
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
        {!academy && (
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
              ¡Bienvenido, Academia!
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
              👆 Mínimo requerido: <strong>Nombre de la Academia</strong>
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
                🎓 Nombre de la Academia *
              </label>
              <input
                type="text"
                value={form.nombre_publico}
                onChange={(e) => setField('nombre_publico', e.target.value)}
                placeholder="Ej: Academia de Baile Moderno"
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
                placeholder="Cuéntanos sobre tu academia, su historia, metodología y lo que la hace especial..."
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
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Selecciona los ritmos que enseña la academia</div>
            </div>
          </div>

          {/* Chips Estilos */}
          {  /* <div className="academy-chips-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', padding: '0 1.25rem 1rem' }}>
            {allTags?.filter(tag => tag.tipo === 'ritmo').map(tag => (
              <Chip
                key={tag.id}
                label={tag.nombre}
                active={form.estilos?.includes(tag.id) || false}
                onClick={() => toggleEstilo(tag.id)}
                variant="ritmo"
                style={{
                  background: (form.estilos?.includes(tag.id) ? 'rgba(229, 57, 53, 0.2)' : 'rgba(255,255,255,0.04)'),
                  border: (form.estilos?.includes(tag.id) ? '1px solid #E53935' : '1px solid rgba(255,255,255,0.15)'),
                  color: (form.estilos?.includes(tag.id) ? '#E53935' : 'rgba(255,255,255,0.9)'),
                  fontWeight: 600
                }}
              />
            ))}
          </div>*/}

          {/* Catálogo agrupado (independiente de DB) */}
          <div style={{ padding: '0 1.25rem 1.25rem' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Catálogo agrupado</div>
            {(() => {
              const selectedCatalogIds = (((form as any)?.ritmos_seleccionados) || []) as string[];
              const onChangeCatalog = (ids: string[]) => {
                // Guardar selección de catálogo directamente
                setField('ritmos_seleccionados' as any, ids as any);
                // Ya no necesitamos mapear a 'estilos' porque ese campo no existe en la tabla
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
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Indica las zonas donde opera la academia</div>
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
            {/* Crear Clase rápida  */}
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
              {!academy && (
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
                    Debes guardar el perfil de la academia primero antes de crear clases
                  </p>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: '0.5rem 0 0 0' }}>
                    Completa el nombre de la academia y haz clic en 💾 Guardar arriba
                  </p>
                </div>
              )}

              {academy && (
                <CrearClase
                  ritmos={(() => {
                    const ritmoTags = (allTags || []).filter((t: any) => t.tipo === 'ritmo');
                    
                    // Crear mapeo de slug → label del catálogo
                    const labelByCatalogId = new Map<string, string>();
                    RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
                    
                    // Obtener ritmos seleccionados (slugs)
                    const localSelected: string[] = ((form as any)?.ritmos_seleccionados || []) as string[];
                    const savedSelected: string[] = ((academy as any)?.ritmos_seleccionados || []) as string[];
                    const combinedSelected = [...new Set([...localSelected, ...savedSelected])];
                    
                    console.log('[AcademyProfileEditor] 🎵 Ritmos seleccionados (slugs):', combinedSelected);
                    console.log('[AcademyProfileEditor] 🏷️  Tags disponibles:', ritmoTags.map((t: any) => ({ id: t.id, nombre: t.nombre })));
                    
                    if (combinedSelected.length > 0) {
                      // Mapear slugs → labels del catálogo
                      const selectedLabels = combinedSelected
                        .map(slug => labelByCatalogId.get(slug))
                        .filter(Boolean);
                      
                      console.log('[AcademyProfileEditor] 📋 Labels del catálogo:', selectedLabels);
                      
                      // Filtrar tags que coincidan con los labels (case-insensitive)
                      const filtered = ritmoTags.filter((t: any) => 
                        selectedLabels.some(label => 
                          label && t.nombre && 
                          label.toLowerCase().trim() === t.nombre.toLowerCase().trim()
                        )
                      );
                      
                      console.log('[AcademyProfileEditor] ✅ Ritmos filtrados:', filtered.map((t: any) => ({ id: t.id, nombre: t.nombre })));
                      
                      // Mostrar labels que NO se encontraron
                      const foundLabels = new Set(filtered.map((t: any) => t.nombre.toLowerCase().trim()));
                      const notFound = selectedLabels.filter(label => 
                        !foundLabels.has(label.toLowerCase().trim())
                      );
                      
                      if (notFound.length > 0) {
                        console.warn('[AcademyProfileEditor] ⚠️  Labels NO encontrados en tags:', notFound);
                        console.warn('[AcademyProfileEditor] 💡 Posibles coincidencias:', 
                          ritmoTags
                            .filter((t: any) => notFound.some(nf => 
                              t.nombre.toLowerCase().includes(nf.toLowerCase().substring(0, 4))
                            ))
                            .map((t: any) => t.nombre)
                        );
                      }
                      
                      if (filtered.length > 0) {
                        return filtered.map((t: any) => ({ id: t.id, nombre: t.nombre }));
                      }
                      
                      console.warn('[AcademyProfileEditor] ⚠️  No se encontraron coincidencias, usando todos los ritmos');
                    }
                    
                    // Fallback: todos los ritmos
                    console.log('[AcademyProfileEditor] 🔄 Usando todos los ritmos como fallback');
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

                    const ritmoIds = c.ritmoIds && c.ritmoIds.length
                      ? c.ritmoIds
                      : (c.ritmoId !== null && c.ritmoId !== undefined ? [c.ritmoId] : (prev?.ritmoIds || []));
                    const updatedItem = {
                      ...prev,
                      id: ensureClassId(prev), // Preservar ID existente o generar uno nuevo si no existe
                      tipo: 'clase',
                      titulo: c.nombre,
                      fecha: c.fechaModo === 'especifica' ? c.fecha : undefined,
                      diaSemana: c.fechaModo === 'semanal' ? c.diaSemana : null,
                      recurrente: c.fechaModo === 'semanal' ? 'semanal' : undefined,
                      inicio: c.inicio,
                      fin: c.fin,
                      nivel: c.nivel || undefined,
                      referenciaCosto: c.nombre,
                      ritmoId: ritmoIds.length ? ritmoIds[0] ?? null : null,
                      ritmoIds,
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
                        console.log('[AcademyProfileEditor] Clase editada y guardada');
                      })
                      .catch((e) => {
                        setStatusMsg({ type: 'err', text: '❌ Error al actualizar clase' });
                        // eslint-disable-next-line no-console
                        console.error('[AcademyProfileEditor] Error editando clase', e);
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

                    const ritmoIds = c.ritmoIds && c.ritmoIds.length
                      ? c.ritmoIds
                      : (c.ritmoId !== null && c.ritmoId !== undefined ? [c.ritmoId] : []);
                    const nextCrono = ([...currentCrono, {
                      id: generateClassId(), // Generar ID único para la nueva clase
                      tipo: 'clase',
                      titulo: c.nombre,
                      fecha: c.fechaModo === 'especifica' ? c.fecha : undefined,
                      diaSemana: c.fechaModo === 'semanal' ? c.diaSemana : null,
                      recurrente: c.fechaModo === 'semanal' ? 'semanal' : undefined,
                      inicio: c.inicio,
                      fin: c.fin,
                      nivel: c.nivel || undefined,
                      referenciaCosto: c.nombre,
                      ritmoId: ritmoIds.length ? ritmoIds[0] ?? null : null,
                      ritmoIds,
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
                        console.log('[AcademyProfileEditor] Clase creada y guardada');
                      })
                      .catch((e) => {
                        setStatusMsg({ type: 'err', text: '❌ Error al crear clase' });
                        // eslint-disable-next-line no-console
                        console.error('[AcademyProfileEditor] Error guardando clase', e);
                        throw e;
                      });
                  }
                }}
              />
              )}

              {academy && Array.isArray((form as any)?.cronograma) && (form as any).cronograma.length > 0 && (
                <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                  {(form as any).cronograma.map((it: any, idx: number) => {
                    const refKey = ((it?.referenciaCosto || it?.titulo || '') as string).trim().toLowerCase();
                    const costo = ((form as any)?.costos || []).find((c: any) => (c?.nombre || '').trim().toLowerCase() === refKey);
                    const costoLabel = costo ? formatCurrency(costo.precio) : null;
                    const fechaLabel = formatDateOrDay(it.fecha, (it as any)?.diaSemana ?? null);
                    return (
                    <div key={idx} className="academy-class-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <strong style={{ color: '#fff' }}>{it.titulo || 'Clase'}</strong>
                          <span style={{ fontSize: 12, opacity: 0.8 }}>🕒 {it.inicio || '—'} – {it.fin || '—'}</span>
                          {(fechaLabel || costoLabel) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {fechaLabel && (
                                <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, background: 'rgba(240,147,251,0.15)', border: '1px solid rgba(240,147,251,0.28)' }}>
                                  📅 {fechaLabel}
                                </span>
                              )}
                              {costoLabel && (
                                <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, background: 'rgba(30,136,229,0.15)', border: '1px solid rgba(30,136,229,0.28)' }}>
                                  💰 {costoLabel}
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                      <div className="academy-class-buttons" style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
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
                                ritmoIds: it.ritmoIds ?? (typeof it.ritmoId === 'number' ? [it.ritmoId] : []),
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
                                console.error('[AcademyProfileEditor] Error eliminando clase', e);
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
                    );
                  })}
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
                value={form.redes_sociales?.instagram || ""}
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
                value={form.redes_sociales?.facebook || ""}
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
                value={form.redes_sociales?.whatsapp || ""}
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
        {academyId && (
          <>
            <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: colors.light, margin: 0 }}>
                  🎭 Maestros Invitados
                </h2>
                <button
                  onClick={() => setShowTeacherModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  👥 Invitar Maestro
                </button>
              </div>

              {acceptedTeachers && acceptedTeachers.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {acceptedTeachers.map((t: any) => {
                    // Mapear datos de la vista a formato de TeacherCard
                    const teacherData = {
                      id: t.teacher_id,
                      nombre_publico: t.teacher_name,
                      bio: t.teacher_bio || '',
                      avatar_url: t.teacher_avatar || null,
                      portada_url: t.teacher_portada || null,
                      banner_url: t.teacher_portada || t.teacher_avatar || null,
                      ritmos: Array.isArray(t.teacher_ritmos) ? t.teacher_ritmos : [],
                      zonas: Array.isArray(t.teacher_zonas) ? t.teacher_zonas : [],
                      media: t.teacher_portada 
                        ? [{ url: t.teacher_portada, type: 'image', slot: 'cover' }]
                        : t.teacher_avatar 
                        ? [{ url: t.teacher_avatar, type: 'image', slot: 'avatar' }]
                        : []
                    };
                    return (
                      <div key={t.teacher_id} style={{ position: 'relative' }}>
                        <TeacherCard item={teacherData} />
                        <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const ok = window.confirm('¿Eliminar este maestro de tu academia?');
                              if (!ok) return;

                              try {
                                const { data: { user } } = await supabase.auth.getUser();
                                if (!user) return;

                                const { data: invitations } = await supabase
                                  .from('academy_teacher_invitations')
                                  .select('id')
                                  .eq('academy_id', academyId)
                                  .eq('teacher_id', t.teacher_id)
                                  .eq('status', 'accepted')
                                  .maybeSingle();

                                if (invitations) {
                                  await cancelInvitation.mutateAsync(invitations.id);
                                  setStatusMsg({ type: 'ok', text: '✅ Maestro eliminado. Puedes volver a invitarlo si lo deseas.' });
                                  setTimeout(() => setStatusMsg(null), 4000);
                                  // Refetch para actualizar las listas
                                  await refetchAccepted();
                                  await refetchAvailable();
                                }
                              } catch (error: any) {
                                setStatusMsg({ type: 'err', text: `❌ Error: ${error.message}` });
                                setTimeout(() => setStatusMsg(null), 3000);
                              }
                            }}
                            style={{
                              position: 'absolute',
                              top: '0.5rem',
                              right: '0.5rem',
                              padding: '0.5rem',
                              background: 'rgba(239, 68, 68, 0.9)',
                              border: '1px solid #EF4444',
                              borderRadius: '8px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              zIndex: 10
                            }}
                          >
                            🗑️
                          </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: colors.light, opacity: 0.7 }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎭</div>
                  <p>No hay maestros invitados aún</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Haz clic en "Invitar Maestro" para agregar maestros a tu academia
                  </p>
                </div>
              )}
            </div>

            {/* Modal para seleccionar maestro */}
            {showTeacherModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem'
              }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    background: colors.dark,
                    borderRadius: '20px',
                    padding: '2rem',
                    maxWidth: '600px',
                    width: '100%',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: colors.light, margin: 0 }}>
                      👥 Seleccionar Maestro
                    </h2>
                    <button
                      onClick={() => {
                        setShowTeacherModal(false);
                        setStatusMsg(null);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: colors.light,
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '0.5rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Mensaje de éxito/error dentro del modal */}
                  {statusMsg && statusMsg.text.includes('Invitación enviada') && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        marginBottom: '1.5rem',
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(16,185,129,0.4)',
                        background: 'rgba(16,185,129,0.15)',
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: '600',
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                      }}
                    >
                      {statusMsg.text}
                    </motion.div>
                  )}

                  {loadingTeachers ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: colors.light }}>
                      Cargando maestros...
                    </div>
                  ) : !availableTeachers || availableTeachers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: colors.light }}>
                      <p>No hay maestros disponibles para invitar</p>
                      <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem' }}>
                        Todos los maestros aprobados ya tienen una invitación pendiente o aceptada
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {availableTeachers.map((teacher: any) => (
                        <div
                          key={teacher.id}
                          style={{
                            padding: '1rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                          }}
                        >
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: teacher.avatar_url 
                              ? `url(${teacher.avatar_url}) center/cover`
                              : 'linear-gradient(135deg, #E53935, #FB8C00)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '1.25rem',
                            flexShrink: 0
                          }}>
                            {!teacher.avatar_url && (teacher.nombre_publico?.[0]?.toUpperCase() || '👤')}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, color: colors.light, fontSize: '1.1rem' }}>
                              {teacher.nombre_publico}
                            </h3>
                            {teacher.bio && (
                              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.7, color: colors.light }}>
                                {teacher.bio.substring(0, 100)}{teacher.bio.length > 100 ? '...' : ''}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              if (!academyId) return;
                              try {
                                await sendInvitation.mutateAsync({
                                  academyId,
                                  teacherId: teacher.id
                                });
                                
                                // Mostrar mensaje de éxito dentro del modal
                                setStatusMsg({ type: 'ok', text: `✅ Invitación enviada exitosamente a ${teacher.nombre_publico}` });
                                
                                // Cerrar el modal después de mostrar el mensaje
                                setTimeout(() => {
                                  setShowTeacherModal(false);
                                  // Mantener el mensaje visible en el componente principal
                                  setTimeout(() => {
                                    setStatusMsg({ type: 'ok', text: `✅ Invitación enviada a ${teacher.nombre_publico}. El maestro recibirá una notificación.` });
                                    setTimeout(() => setStatusMsg(null), 5000);
                                  }, 300);
                                }, 1500);
                                
                                // Forzar refetch después de un breve delay
                                setTimeout(async () => {
                                  await refetchAvailable();
                                  await refetchAccepted();
                                }, 500);
                              } catch (error: any) {
                                setStatusMsg({ type: 'err', text: `❌ Error al enviar invitación: ${error.message}` });
                                setTimeout(() => setStatusMsg(null), 4000);
                              }
                            }}
                            disabled={sendInvitation.isPending}
                            style={{
                              padding: '0.5rem 1rem',
                              background: sendInvitation.isPending 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'linear-gradient(135deg, #10B981, #059669)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white',
                              fontWeight: '600',
                              cursor: sendInvitation.isPending ? 'not-allowed' : 'pointer',
                              opacity: sendInvitation.isPending ? 0.6 : 1
                            }}
                          >
                            {sendInvitation.isPending ? 'Enviando...' : '📤 Invitar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </>
        )}

        {/* Promociones y paquetes */}
        {supportsPromotions && (
          <div className="org-editor-card" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: colors.light }}>
              💸 Promociones y Paquetes
            </h2>
            <p style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '0.95rem', color: 'rgba(255,255,255,0.72)', maxWidth: 560 }}>
              Define paquetes, membresías o descuentos especiales para tu academia y controla su vigencia.
            </p>
            <CostsPromotionsEditor
              value={(form as any).promociones || []}
              onChange={(items) => setField('promociones' as any, items as any)}
            />
          </div>
        )}

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
          description="Sube fotos de tu academia, instalaciones, clases y eventos"
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
          description="Más fotos para mostrar diferentes aspectos de tu academia"
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
          </>
        )}

      </div>
    </div>
    </>
  );
}
