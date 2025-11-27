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
import ReviewsEditor from "../../components/common/ReviewsEditor";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
// import CostosyHorarios from './CostosyHorarios';
import ClasesLive from '../../components/events/ClasesLive';
import UbicacionesEditor from "../../components/locations/UbicacionesEditor";
import BankAccountEditor, { type BankAccountData } from "../../components/profile/BankAccountEditor";
import CrearClase from "../../components/events/CrearClase";
import { useAllowedRitmos } from "@/hooks/useAllowedRitmos";
import { getDraftKey } from "../../utils/draftKeys";
import { useRoleChange } from "../../hooks/useRoleChange";
import { useAuth } from "@/contexts/AuthProvider";
import { validateZonasAgainstCatalog } from "../../utils/validateZonas";
import '@/styles/organizer.css';
import CostsPromotionsEditor from "../../components/events/CostsPromotionsEditor";
import { generateClassId, ensureClassId } from "../../utils/classIdGenerator";
import { useAvailableTeachers, useAcceptedTeachers, useSendInvitation, useCancelInvitation } from "../../hooks/useAcademyTeacherInvitations";
import { supabase } from "@/lib/supabase";
import { AcademyMetricsPanel } from "../../components/profile/AcademyMetricsPanel";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import { useMyCompetitionGroups, useDeleteCompetitionGroup } from "../../hooks/useCompetitionGroups";
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaWhatsapp, FaGlobe, FaTelegram } from 'react-icons/fa';

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
  // Si es null/undefined/vacío, retornar null para no mostrar nada
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (numeric === null || Number.isNaN(numeric)) return null;
  // Si es 0, retornar "Gratis"
  if (numeric === 0) return 'Gratis';
  // Si es > 0, formatear como precio
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

const formatDateOrDay = (fecha?: string, diaSemana?: number | null, diasSemana?: Array<string | number> | null) => {
  if (fecha) {
    try {
      // Parsear fecha como hora local para evitar problemas de zona horaria
      const fechaOnly = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      const [year, month, day] = fechaOnly.split('-').map(Number);
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        const parsed = new Date(year, month - 1, day);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
    } catch (e) {
      console.error('[AcademyProfileEditor] Error formatting date:', e);
    }
  }
  // Si tiene múltiples días (diasSemana), formatear todos
  if (diasSemana && Array.isArray(diasSemana) && diasSemana.length > 0) {
    const dayNameMap: Record<string, string> = {
      'domingo': 'Domingo', 'dom': 'Domingo',
      'lunes': 'Lunes', 'lun': 'Lunes',
      'martes': 'Martes', 'mar': 'Martes',
      'miércoles': 'Miércoles', 'miercoles': 'Miércoles', 'mié': 'Miércoles', 'mie': 'Miércoles',
      'jueves': 'Jueves', 'jue': 'Jueves',
      'viernes': 'Viernes', 'vie': 'Viernes',
      'sábado': 'Sábado', 'sabado': 'Sábado', 'sáb': 'Sábado', 'sab': 'Sábado',
    };
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasLegibles = diasSemana.map((d: string | number) => {
      if (typeof d === 'number' && d >= 0 && d <= 6) {
        return dayNames[d];
      }
      if (typeof d === 'string') {
        return dayNameMap[d.toLowerCase()] || d;
      }
      return null;
    }).filter((d: string | null) => d !== null);
    return diasLegibles.length > 0 ? diasLegibles.join(', ') : null;
  }
  // Si tiene un solo día (diaSemana)
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
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editInitial, setEditInitial] = React.useState<any>(undefined);
  const [statusMsg, setStatusMsg] = React.useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [activeTab, setActiveTab] = React.useState<"perfil" | "metricas">("perfil");

  // Scroll al top cuando cambia la pestaña
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

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
        whatsapp: "",
        tiktok: "",
        youtube: "",
        email: "",
        web: "",
        telegram: ""
      },
      respuestas: {
        redes: {
          instagram: "",
          facebook: "",
          whatsapp: "",
          tiktok: "",
          youtube: "",
          email: "",
          web: "",
          telegram: ""
        },
        dato_curioso: "",
        gusta_bailar: "",
        ver_mas_link: ""
      },
      faq: [] as any[],
      reseñas: [] as any[],
      cuenta_bancaria: {} as BankAccountData
    } as any
  });

  const supportsPromotions = React.useMemo(() => {
    if (typeof (form as any)?.promociones !== 'undefined') return true;
    if (academy) {
      return Object.prototype.hasOwnProperty.call(academy, 'promociones');
    }
    return false;
  }, [academy, (form as any)?.promociones]);

  const profileId = (form as any)?.id;

  // Hooks para invitaciones
  const academyId = (academy as any)?.id;
  const { data: availableTeachers, isLoading: loadingTeachers, refetch: refetchAvailable } = useAvailableTeachers(academyId);
  const { data: acceptedTeachers, refetch: refetchAccepted } = useAcceptedTeachers(academyId);
  const sendInvitation = useSendInvitation();
  const cancelInvitation = useCancelInvitation();
  const [showTeacherModal, setShowTeacherModal] = React.useState(false);
  const classFormRef = React.useRef<HTMLDivElement | null>(null);

  // Hooks para grupos de competencia
  const { data: myCompetitionGroups, isLoading: loadingGroups, refetch: refetchGroups } = useMyCompetitionGroups();
  const deleteGroup = useDeleteCompetitionGroup();

  // Asegurar que redes_sociales siempre sea un objeto, no null
  React.useEffect(() => {
    if (form.redes_sociales === null || typeof form.redes_sociales !== 'object') {
      setField('redes_sociales', {
        instagram: "",
        facebook: "",
        whatsapp: "",
        tiktok: "",
        youtube: "",
        email: "",
        web: "",
        telegram: ""
      });
    }
  }, [form.redes_sociales, setField]);

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
      const selectedCatalogIds = ((form as any)?.ritmos_seleccionados || []) as string[];

      // Validar zonas contra el catálogo
      const validatedZonas = validateZonasAgainstCatalog((form as any).zonas || [], allTags);

      // Crear payload limpio con SOLO los campos que existen en profiles_academy
      // Preparar respuestas con estructura válida
      const respuestasData = (form as any).respuestas || {};
      const respuestasPayload: any = {};
      
      // Solo incluir campos válidos en respuestas
      if (respuestasData.dato_curioso) {
        respuestasPayload.dato_curioso = respuestasData.dato_curioso;
      }
      if (respuestasData.ver_mas_link) {
        respuestasPayload.ver_mas_link = respuestasData.ver_mas_link;
      }
      if (respuestasData.gusta_bailar) {
        respuestasPayload.gusta_bailar = respuestasData.gusta_bailar;
      }
      if (respuestasData.redes) {
        respuestasPayload.redes = respuestasData.redes;
      }

      const payload: any = {
        nombre_publico: form.nombre_publico,
        bio: form.bio,
        zonas: validatedZonas,
        ubicaciones: (form as any).ubicaciones || [],
        horarios: (form as any).cronograma || [],     // Guardar en horarios
        cronograma: (form as any).cronograma || [],   // También en cronograma para compatibilidad
        costos: (form as any).costos || [],           // Guardar costos
        redes_sociales: form.redes_sociales,
        cuenta_bancaria: (form as any).cuenta_bancaria || {},
        estado_aprobacion: 'aprobado'  // Marcar como aprobado al guardar
      };

      // Solo incluir respuestas si tiene contenido
      if (Object.keys(respuestasPayload).length > 0) {
        payload.respuestas = respuestasPayload;
      }

      if (supportsPromotions) {
        payload.promociones = (form as any).promociones || [];
      }

      // Agregar ritmos_seleccionados solo si hay selección (requiere ejecutar SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_ACADEMY.sql)
      if (selectedCatalogIds && selectedCatalogIds.length > 0) {
        payload.ritmos_seleccionados = selectedCatalogIds;
      }

      // Solo incluir id si existe (para updates)
      if (profileId) {
        payload.id = profileId;
      }

      console.log("[AcademyProfileEditor] 📤 Payload a enviar:", JSON.stringify(payload, null, 2));
      
      await upsert.mutateAsync(payload);

      // Mostrar mensaje de éxito
      setStatusMsg({ type: 'ok', text: '✅ Perfil guardado exitosamente' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (error: any) {
      console.error("❌ [AcademyProfileEditor] Error guardando:", error);
      console.error("❌ [AcademyProfileEditor] Detalles del error:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        response: error?.response
      });
      const errorMessage = error?.message || error?.details || 'Error desconocido al guardar el perfil';
      setStatusMsg({ type: 'err', text: `❌ Error al guardar: ${errorMessage}` });
      setTimeout(() => setStatusMsg(null), 5000);
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

  const autoSavePromociones = React.useCallback(async (items: any[]) => {
    setField('promociones' as any, items as any);
    if (!profileId) {
      setStatusMsg({ type: 'err', text: '💾 Guarda el perfil una vez para activar las promociones' });
      setTimeout(() => setStatusMsg(null), 3200);
      return;
    }
    try {
      await upsert.mutateAsync({ id: profileId, promociones: items });
      setStatusMsg({ type: 'ok', text: '✅ Promociones guardadas automáticamente' });
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (error) {
      console.error('[AcademyProfileEditor] Error al guardar promociones auto', error);
      setStatusMsg({ type: 'err', text: '❌ No se pudieron guardar las promociones' });
      setTimeout(() => setStatusMsg(null), 3200);
    }
  }, [profileId, setField, upsert]);

  const autoSaveClasses = React.useCallback(
    async (cronogramaItems: any[], costosItems: any[], successText: string) => {
      if (!profileId) {
        setStatusMsg({ type: 'err', text: '💾 Guarda el perfil una vez para activar el guardado de clases' });
        setTimeout(() => setStatusMsg(null), 3200);
        return;
      }
      try {
        await upsert.mutateAsync({
          id: profileId,
          cronograma: cronogramaItems,
          horarios: cronogramaItems,
          costos: costosItems,
        });
        setStatusMsg({ type: 'ok', text: successText });
        setTimeout(() => setStatusMsg(null), 2400);
      } catch (error) {
        console.error('[AcademyProfileEditor] Error guardando clases', error);
        setStatusMsg({ type: 'err', text: '❌ No se pudieron guardar las clases' });
        setTimeout(() => setStatusMsg(null), 3200);
        throw error;
      }
    },
    [profileId, setStatusMsg, upsert],
  );

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
          max-width: 1200px;
          margin: 0 auto;
        }
        .academy-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .academy-editor-inner h2,
        .academy-editor-inner h3,
        .academy-editor-card h2,
        .org-editor__card h2 {
          color: #fff;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
        }
        .photos-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .media-management-section {
          min-height: 400px;
          padding: 2.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }
        .media-management-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #E53935, #FB8C00, #FFD166);
          opacity: 0.9;
          border-radius: 24px 24px 0 0;
        }
        .media-management-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }
        .media-management-icon {
          width: 60px;
          height: 60px;
          border-radius: 20px;
          background: linear-gradient(135deg, #E53935, #FB8C00);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: 0 8px 24px rgba(229, 57, 53, 0.4);
          flex-shrink: 0;
        }
        .media-management-content {
          position: relative;
          z-index: 1;
        }
        .rhythms-zones-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
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
        .academy-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid rgba(255,255,255,0.1);
          padding-bottom: 0.5rem;
        }
        .academy-tab-button {
          padding: 0.75rem 1.5rem;
          border-radius: 12px 12px 0 0;
          border: none;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .teachers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .teacher-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .teacher-modal-content {
          background: ${colors.dark};
          border-radius: 20px;
          padding: 2rem;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .teacher-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .teacher-list-item {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .teacher-invite-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .teacher-card-wrapper {
          position: relative;
        }
        .teacher-delete-button {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          padding: 0.5rem;
          background: rgba(239, 68, 68, 0.9);
          border: 1px solid #EF4444;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 0.875rem;
          z-index: 10;
        }
        
        @media (max-width: 768px) {
          .media-management-section {
            min-height: auto;
            padding: 1.5rem !important;
            border-radius: 20px !important;
          }
          .media-management-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .media-management-icon {
            width: 56px !important;
            height: 56px !important;
            font-size: 1.75rem !important;
            border-radius: 16px !important;
          }
          .photos-two-columns {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .rhythms-zones-two-columns {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
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
          .academy-tabs {
            flex-wrap: wrap !important;
            gap: 0.4rem !important;
          }
          .academy-tab-button {
            flex: 1 1 auto !important;
            min-width: 120px !important;
            padding: 0.6rem 1rem !important;
            font-size: 0.9rem !important;
          }
          .teachers-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .teacher-modal {
            padding: 0.5rem !important;
          }
          .teacher-modal-content {
            padding: 1.5rem !important;
            border-radius: 16px !important;
            max-height: 90vh !important;
          }
          .teacher-modal-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .teacher-list-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .teacher-invite-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .teacher-invite-header button {
            width: 100% !important;
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
          .academy-tabs {
            gap: 0.3rem !important;
          }
          .academy-tab-button {
            flex: 1 1 100% !important;
            min-width: 100% !important;
            padding: 0.5rem 0.75rem !important;
            font-size: 0.85rem !important;
          }
          .teachers-grid {
            gap: 0.75rem !important;
          }
          .teacher-modal-content {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          .teacher-list-item {
            gap: 0.5rem !important;
            padding: 0.75rem !important;
          }
          .teacher-list-item button {
            width: 100% !important;
          }
          .org-editor__card {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
        }
        
        /* Estilos para editor-section y glass-card-container */
        .editor-section {
          margin-bottom: 3rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .editor-section-title {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: ${colors.light};
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
        }
        .editor-field {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: ${colors.light};
        }
        .editor-input {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: ${colors.light};
          font-size: 1rem;
        }
        .editor-textarea {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: ${colors.light};
          font-size: 1rem;
          resize: vertical;
          font-family: inherit;
        }
        .glass-card-container {
          opacity: 1;
          margin-bottom: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px;
          backdrop-filter: blur(10px);
          transform: none;
        }
        .section-content {
          padding: 2rem;
        }
        .question-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: center;
        }
        .section-title {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: ${colors.light};
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
        }
        .info-redes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        
        /* PROFILE SECTION COMPACT */
        .profile-section-compact {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        /* ABAJO: REDES */
        .row-bottom {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .row-bottom-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .subtitle {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: ${colors.light};
        }
        .tag {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        
        /* LISTA DE REDES */
        .social-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .field {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1rem;
        }
        .field-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.9;
          color: ${colors.light};
        }
        
        /* INPUTS COMPACTOS */
        .input-group {
          flex: 1;
          display: flex;
          align-items: center;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .input-group:focus-within {
          border-color: rgba(76, 173, 255, 0.6);
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 2px rgba(76, 173, 255, 0.2);
        }
        .prefix {
          padding: 0.75rem 0.5rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          border-right: 1px solid rgba(255, 255, 255, 0.15);
          white-space: nowrap;
          background: rgba(255, 255, 255, 0.05);
        }
        .input-group input {
          border: none;
          outline: none;
          background: transparent;
          color: ${colors.light};
          font-size: 1rem;
          padding: 0.75rem;
          flex: 1;
          min-width: 0;
        }
        .input-group input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        @media (max-width: 768px) {
          .info-redes-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .editor-section {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 12px !important;
          }
          .editor-section-title {
            font-size: 1.2rem !important;
            margin-bottom: 0.75rem !important;
          }
          .glass-card-container {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 12px !important;
          }
          .profile-section-compact {
            padding: 1rem !important;
            gap: 1rem !important;
          }
          .subtitle {
            font-size: 0.95rem !important;
          }
          .field-icon {
            width: 24px !important;
            height: 24px !important;
          }
          .field {
            font-size: 0.9rem !important;
            gap: 0.5rem !important;
          }
          .input-group input {
            font-size: 0.9rem !important;
            padding: 0.6rem !important;
          }
          .prefix {
            font-size: 0.85rem !important;
            padding: 0.6rem 0.4rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .editor-section {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 10px !important;
          }
          .editor-section-title {
            font-size: 1.1rem !important;
            margin-bottom: 0.5rem !important;
          }
          .editor-input,
          .editor-textarea {
            padding: 0.6rem !important;
            font-size: 0.9rem !important;
          }
          .glass-card-container {
            padding: 0.5rem !important;
            margin-bottom: 0.75rem !important;
            border-radius: 10px !important;
          }
          .profile-section-compact {
            padding: 0.75rem !important;
            gap: 1rem !important;
          }
          .subtitle {
            font-size: 0.9rem !important;
          }
          .tag {
            font-size: 0.7rem !important;
          }
          .field-icon {
            width: 22px !important;
            height: 22px !important;
          }
          .social-list {
            gap: 0.5rem !important;
          }
          .field {
            font-size: 0.85rem !important;
            gap: 0.5rem !important;
          }
          .input-group input {
            font-size: 0.85rem !important;
            padding: 0.5rem !important;
          }
          .prefix {
            font-size: 0.8rem !important;
            padding: 0.5rem 0.4rem !important;
          }
          .question-section {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .section-content {
            padding: 1rem !important;
          }
        }
      `}</style>
      <div className="academy-editor-container org-editor" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
        <div className="academy-editor-inner">
          {/* Header con botón volver + título centrado + toggle (diseño organizer) */}
          <div className="org-editor__header">
            <button className="org-editor__back" onClick={() => navigate(-1)}>← Volver</button>
            <h1 className="org-editor__title">✏️ Editar Academia</h1>
            <div style={{ width: 100 }} />
          </div>

          {/* Toggle de navegación (arriba de las pestañas) */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem' }}>
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

          {/* Tabs */}
          <div className="academy-tabs">
            <button
              className="academy-tab-button"
              onClick={() => setActiveTab("perfil")}
              style={{
                background: activeTab === "perfil"
                  ? 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(245,87,108,0.2))'
                  : 'transparent',
                fontWeight: activeTab === "perfil" ? 800 : 600,
                borderBottom: activeTab === "perfil" ? '2px solid rgba(240,147,251,0.5)' : '2px solid transparent',
              }}
            >
              📝 Perfil
            </button>
            <button
              className="academy-tab-button"
              onClick={() => setActiveTab("metricas")}
              style={{
                background: activeTab === "metricas"
                  ? 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(245,87,108,0.2))'
                  : 'transparent',
                fontWeight: activeTab === "metricas" ? 800 : 600,
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

              {/* Información Personal */}
              <div className="editor-section glass-card-container" style={{ marginBottom: '3rem' }}>
                <h2 className="editor-section-title">
                  👤 Información Personal
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2rem',
                  alignItems: 'start'
                }}
                  className="info-redes-grid">
                  {/* Columna 1: Información Básica */}
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="editor-field">
                        🎓 Nombre de la Academia *
                      </label>
                      <input
                        type="text"
                        value={form.nombre_publico}
                        onChange={(e) => setField('nombre_publico', e.target.value)}
                        placeholder="Ej: Academia de Baile Moderno"
                        className="editor-input"
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label className="editor-field">
                        📝 Descripción
                      </label>
                      <textarea
                        value={form.bio}
                        onChange={(e) => setField('bio', e.target.value)}
                        placeholder="Cuéntanos sobre tu academia, su historia, metodología y lo que la hace especial..."
                        rows={3}
                        className="editor-textarea"
                      />
                    </div>
                  </div>

                  {/* Columna 2: Redes Sociales Compactas */}
                  <div className="profile-section-compact">
                    {/* REDES SOCIALES */}
                    <div className="row-bottom">
                      <div className="row-bottom-header">
                        <h4 className="subtitle">Redes Sociales</h4>
                        <span className="tag">Opcional</span>
                      </div>

                      <div className="social-list">
                        {/* Instagram */}
                        <label className="field">
                          <span className="field-icon">
                            <FaInstagram size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">ig/</span>
                            <input
                              type="text"
                              name="instagram"
                              value={form.redes_sociales?.instagram || ''}
                              onChange={(e) => setNested('redes_sociales.instagram', e.target.value)}
                              placeholder="usuario"
                            />
                          </div>
                        </label>

                        {/* TikTok */}
                        <label className="field">
                          <span className="field-icon">
                            <FaTiktok size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">@</span>
                            <input
                              type="text"
                              name="tiktok"
                              value={form.redes_sociales?.tiktok || ''}
                              onChange={(e) => setNested('redes_sociales.tiktok', e.target.value)}
                              placeholder="usuario"
                            />
                          </div>
                        </label>

                        {/* YouTube */}
                        <label className="field">
                          <span className="field-icon">
                            <FaYoutube size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">yt/</span>
                            <input
                              type="text"
                              name="youtube"
                              value={form.redes_sociales?.youtube || ''}
                              onChange={(e) => setNested('redes_sociales.youtube', e.target.value)}
                              placeholder="canal o handle"
                            />
                          </div>
                        </label>

                        {/* Facebook */}
                        <label className="field">
                          <span className="field-icon">
                            <FaFacebookF size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">fb/</span>
                            <input
                              type="text"
                              name="facebook"
                              value={form.redes_sociales?.facebook || ''}
                              onChange={(e) => setNested('redes_sociales.facebook', e.target.value)}
                              placeholder="usuario o página"
                            />
                          </div>
                        </label>

                        {/* WhatsApp */}
                        <label className="field">
                          <span className="field-icon">
                            <FaWhatsapp size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">+52</span>
                            <input
                              type="tel"
                              name="whatsapp"
                              value={form.redes_sociales?.whatsapp || ''}
                              onChange={(e) => setNested('redes_sociales.whatsapp', e.target.value)}
                              placeholder="55 1234 5678"
                            />
                          </div>
                        </label>

                        {/* Email */}
                        <label className="field">
                          <span className="field-icon">
                            📧
                          </span>
                          <div className="input-group">
                            <span className="prefix">@</span>
                            <input
                              type="email"
                              name="email"
                              value={form.redes_sociales?.email || ''}
                              onChange={(e) => setNested('redes_sociales.email', e.target.value)}
                              placeholder="correo@ejemplo.com"
                            />
                          </div>
                        </label>

                        {/* Sitio Web */}
                        <label className="field">
                          <span className="field-icon">
                            <FaGlobe size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">https://</span>
                            <input
                              type="text"
                              name="web"
                              value={form.redes_sociales?.web || ''}
                              onChange={(e) => setNested('redes_sociales.web', e.target.value)}
                              placeholder="tusitio.com"
                            />
                          </div>
                        </label>

                        {/* Telegram */}
                        <label className="field">
                          <span className="field-icon">
                            <FaTelegram size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">@</span>
                            <input
                              type="text"
                              name="telegram"
                              value={form.redes_sociales?.telegram || ''}
                              onChange={(e) => setNested('redes_sociales.telegram', e.target.value)}
                              placeholder="usuario o canal"
                            />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estilos & Zonas - tarjeta mejorada */}
              <div className="org-editor__card academy-editor-card" style={{ marginBottom: '3rem', position: 'relative', overflow: 'hidden', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(19,21,27,0.85), rgba(16,18,24,0.85))' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)' }} />

                {/* Contenedor de dos columnas: Ritmos y Zonas */}
                <div className="rhythms-zones-two-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.25rem' }}>
                  {/* Columna 1: Ritmos */}
                  <div>
                    {/* Header Estilos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1E88E5,#7C4DFF)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(30,136,229,0.35)' }}>🎵</div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#fff', textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px' }}>Estilos que Enseñamos</h2>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Selecciona los ritmos que enseña la academia</div>
                      </div>
                    </div>

                    {/* Catálogo agrupado */}
                    <div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Catálogo agrupado</div>
                      {(() => {
                        const selectedCatalogIds = (((form as any)?.ritmos_seleccionados) || []) as string[];
                        const onChangeCatalog = (ids: string[]) => {
                          setField('ritmos_seleccionados' as any, ids as any);
                        };

                        return (
                          <RitmosChips selected={selectedCatalogIds} onChange={onChangeCatalog} />
                        );
                      })()}
                    </div>
                  </div>

                  {/* Columna 2: Zonas */}
                  <div>
                    {/* Header Zonas */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1976D2,#00BCD4)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(25,118,210,0.35)' }}>🗺️</div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#fff', textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px' }}>Zonas</h2>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Indica las zonas donde opera la academia</div>
                      </div>
                    </div>

                    {/* Chips Zonas */}
                    <div className="academy-chips-container">
                      <ZonaGroupedChips
                        selectedIds={(form as any).zonas}
                        allTags={allTags}
                        mode="edit"
                        onToggle={toggleZona}
                      />
                    </div>
                  </div>
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
                    allowedZoneIds={((form as any).zonas || []) as number[]}
                  />
                  {/* Crear Clase rápida  */}
                  <div ref={classFormRef}>
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

                          if (combinedSelected.length > 0) {
                            // Mapear slugs → labels del catálogo
                            const selectedLabels = combinedSelected
                              .map(slug => labelByCatalogId.get(slug))
                              .filter(Boolean);

                            // Filtrar tags que coincidan con los labels (case-insensitive)
                            const filtered = ritmoTags.filter((t: any) =>
                              selectedLabels.some(label =>
                                label && t.nombre &&
                                label.toLowerCase().trim() === t.nombre.toLowerCase().trim()
                              )
                            );

                            // Mostrar labels que NO se encontraron
                            const foundLabels = new Set(filtered.map((t: any) => t.nombre.toLowerCase().trim()));
                            const notFound = selectedLabels.filter(label =>
                              !foundLabels.has(label.toLowerCase().trim())
                            );

                            if (filtered.length > 0) {
                              return filtered.map((t: any) => ({ id: t.id, nombre: t.nombre }));
                            }
                          }

                          // Fallback: todos los ritmos
                          return ritmoTags.map((t: any) => ({ id: t.id, nombre: t.nombre }));
                        })()}
                        zonas={(allTags || []).filter((t: any) => t.tipo === 'zona').map((t: any) => ({ id: t.id, nombre: t.nombre }))}
                        zonaTags={(allTags || []).filter((t: any) => t.tipo === 'zona')}
                        selectedZonaIds={((form as any).zonas || []) as number[]}
                        locations={((form as any).ubicaciones || []).map((u: any, i: number) => ({
                          id: u?.id || String(i),
                          nombre: u?.nombre,
                          direccion: u?.direccion,
                          referencias: u?.referencias,
                          zonas: u?.zonaIds || u?.zonas || (typeof u?.zona_id === 'number' ? [u.zona_id] : []),
                        }))}
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
                            const classId = ensureClassId(prev); // Obtener ID de la clase (preservar existente o generar nuevo)

                            // Buscar el costo por ID de clase (más confiable que por nombre)
                            const costoIdx = currentCostos.findIndex((x: any) => {
                              // Buscar por ID de clase (más confiable - no cambia aunque cambie el nombre)
                              if (x?.classId && classId && String(x.classId) === String(classId)) return true;
                              // Buscar por referenciaCosto que sea el ID (para compatibilidad)
                              if (x?.referenciaCosto && String(x.referenciaCosto) === String(classId)) return true;
                              // Buscar por índice del cronograma (fallback)
                              if (x?.cronogramaIndex !== null && x?.cronogramaIndex !== undefined && x.cronogramaIndex === editingIndex) return true;
                              // Buscar por nombre anterior (último fallback para costos antiguos)
                              return (x?.nombre || '').trim().toLowerCase() === (prevNombre || '').trim().toLowerCase();
                            });

                            const costoId = costoIdx >= 0 && currentCostos[costoIdx]?.id
                              ? currentCostos[costoIdx].id
                              : Date.now(); // Generar ID único si no existe
                            const updatedCosto = {
                              id: costoId, // ID único del costo
                              nombre: c.nombre, // Mantener nombre para visualización
                              tipo: c.tipo,
                              precio: c.precio !== null && c.precio !== undefined ? (c.precio === 0 ? 0 : c.precio) : null,
                              regla: c.regla || '',
                              classId: classId, // ID de la clase (referencia principal)
                              referenciaCosto: String(classId), // También guardar como referenciaCosto para compatibilidad
                              cronogramaIndex: editingIndex // Guardar índice para búsqueda futura
                            } as any;
                            if (costoIdx >= 0) currentCostos[costoIdx] = updatedCosto; else currentCostos.push(updatedCosto);

                            const updatedItem = {
                              ...prev,
                              id: classId,
                              tipo: 'clase',
                              titulo: c.nombre,
                              descripcion: c.descripcion || undefined,
                              fechaModo: c.fechaModo || (c.fecha ? 'especifica' : ((c.diaSemana !== null && c.diaSemana !== undefined) || (c.diasSemana && c.diasSemana.length > 0) ? 'semanal' : undefined)),
                              fecha: c.fechaModo === 'especifica' ? c.fecha : (c.fechaModo === 'por_agendar' ? undefined : undefined),
                              diaSemana: c.fechaModo === 'semanal' ? ((c.diasSemana && c.diasSemana.length > 0) ? c.diasSemana[0] : c.diaSemana) : (c.fechaModo === 'por_agendar' ? null : null),
                              diasSemana: c.fechaModo === 'semanal' && c.diasSemana && c.diasSemana.length > 0 ? (() => {
                                // Convertir números a nombres de días
                                const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                                return c.diasSemana.map((dia: number) => dayNames[dia] || null).filter((d: string | null) => d !== null);
                              })() : (c.fechaModo === 'semanal' && c.diaSemana !== null && c.diaSemana !== undefined ? (() => {
                                const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                                return [dayNames[c.diaSemana]] as string[];
                              })() : undefined),
                              recurrente: c.fechaModo === 'semanal' ? 'semanal' : undefined,
                              horarioModo: c.fechaModo === 'por_agendar' ? 'duracion' : (c.horarioModo || (c.duracionHoras ? 'duracion' : 'especifica')),
                              inicio: c.fechaModo === 'por_agendar' ? undefined : (c.horarioModo === 'duracion' ? undefined : c.inicio),
                              fin: c.fechaModo === 'por_agendar' ? undefined : (c.horarioModo === 'duracion' ? undefined : c.fin),
                              duracionHoras: c.fechaModo === 'por_agendar' ? c.duracionHoras : (c.horarioModo === 'duracion' ? c.duracionHoras : undefined),
                              nivel: c.nivel || undefined,
                              referenciaCosto: String(classId), // Usar ID de clase en lugar del nombre
                              costo: updatedCosto, // Incluir costo directamente en el item del cronograma
                              ritmoId: ritmoIds.length ? ritmoIds[0] ?? null : null,
                              ritmoIds,
                              zonaId: c.zonaId,
                              ubicacion: (ubicacionStr && ubicacionStr.trim()) || c.ubicacion || ((form as any).ubicaciones || [])[0]?.nombre || '',
                              ubicacionId: c.ubicacionId || (match?.id || null)
                            };
                            currentCrono[editingIndex] = updatedItem;

                            setField('cronograma' as any, currentCrono as any);
                            setField('costos' as any, currentCostos as any);

                            const payload: any = { id: (form as any)?.id, cronograma: currentCrono, costos: currentCostos };
                            return autoSaveClasses(currentCrono, currentCostos, '✅ Clase actualizada')
                              .then(() => {
                                setEditingIndex(null);
                                setEditInitial(undefined);
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
                            const newClassId = generateClassId(); // Generar ID único para la nueva clase
                            const newClassIndex = currentCrono.length; // Índice de la nueva clase en el cronograma

                            const newCosto = {
                              id: Date.now(), // ID único del costo
                              nombre: c.nombre, // Mantener nombre para visualización
                              tipo: c.tipo,
                              precio: c.precio !== null && c.precio !== undefined ? (c.precio === 0 ? 0 : c.precio) : null,
                              regla: c.regla || '',
                              classId: newClassId, // ID de la clase (referencia principal)
                              referenciaCosto: String(newClassId), // También guardar como referenciaCosto para compatibilidad
                              cronogramaIndex: newClassIndex // Guardar índice para búsqueda futura
                            } as any;

                            const nextCrono = ([...currentCrono, {
                              id: newClassId,
                              tipo: 'clase',
                              titulo: c.nombre,
                              descripcion: c.descripcion || undefined,
                              fechaModo: c.fechaModo || (c.fecha ? 'especifica' : ((c.diaSemana !== null && c.diaSemana !== undefined) || (c.diasSemana && c.diasSemana.length > 0) ? 'semanal' : undefined)),
                              fecha: c.fechaModo === 'especifica' ? c.fecha : (c.fechaModo === 'por_agendar' ? undefined : undefined),
                              diaSemana: c.fechaModo === 'semanal' ? ((c.diasSemana && c.diasSemana.length > 0) ? c.diasSemana[0] : c.diaSemana) : (c.fechaModo === 'por_agendar' ? null : null),
                              diasSemana: c.fechaModo === 'semanal' && c.diasSemana && c.diasSemana.length > 0 ? (() => {
                                // Convertir números a nombres de días
                                const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                                return c.diasSemana.map((dia: number) => dayNames[dia] || null).filter((d: string | null) => d !== null);
                              })() : (c.fechaModo === 'semanal' && c.diaSemana !== null && c.diaSemana !== undefined ? (() => {
                                const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                                return [dayNames[c.diaSemana]] as string[];
                              })() : undefined),
                              recurrente: c.fechaModo === 'semanal' ? 'semanal' : undefined,
                              horarioModo: c.fechaModo === 'por_agendar' ? 'duracion' : (c.horarioModo || (c.duracionHoras ? 'duracion' : 'especifica')),
                              inicio: c.fechaModo === 'por_agendar' ? undefined : (c.horarioModo === 'duracion' ? undefined : c.inicio),
                              fin: c.fechaModo === 'por_agendar' ? undefined : (c.horarioModo === 'duracion' ? undefined : c.fin),
                              duracionHoras: c.fechaModo === 'por_agendar' ? c.duracionHoras : (c.horarioModo === 'duracion' ? c.duracionHoras : undefined),
                              nivel: c.nivel || undefined,
                              referenciaCosto: String(newClassId), // Usar ID de clase en lugar del nombre
                              costo: newCosto, // Incluir costo directamente en el item del cronograma
                              ritmoId: ritmoIds.length ? ritmoIds[0] ?? null : null,
                              ritmoIds,
                              zonaId: c.zonaId,
                              ubicacion: (ubicacionStr && ubicacionStr.trim()) || c.ubicacion || ((form as any).ubicaciones || [])[0]?.nombre || '',
                              ubicacionId: c.ubicacionId || (match?.id || null)
                            }] as any);
                            const nextCostos = ([...currentCostos, newCosto] as any);
                            setField('cronograma' as any, nextCrono as any);
                            setField('costos' as any, nextCostos as any);

                            const payload: any = { id: (form as any)?.id, cronograma: nextCrono, costos: nextCostos };
                            return autoSaveClasses(nextCrono, nextCostos, '✅ Clase creada');
                          }
                        }}
                      />
                    )}

                    {academy && Array.isArray((form as any)?.cronograma) && (form as any).cronograma.length > 0 && (
                      <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                        {(form as any).cronograma.map((it: any, idx: number) => {
                          const costos = ((form as any)?.costos || []) as any[];

                          // Buscar costo por relación fuerte (id de clase / referenciaCosto)
                          const classRef = it?.id ?? it?.referenciaCosto ?? null;
                          let costo: any | undefined;

                          if (classRef !== null && classRef !== undefined) {
                            const classRefStr = String(classRef);
                            costo = costos.find((c: any) => {
                              if (c?.classId && String(c.classId) === classRefStr) return true;
                              if (c?.referenciaCosto && String(c.referenciaCosto) === classRefStr) return true;
                              if (typeof c?.cronogramaIndex === 'number' && c.cronogramaIndex === idx) return true;
                              return false;
                            });
                          }

                          // Fallback antiguo: por nombre de la clase (para render y para borrado)
                          const refKey = ((it?.titulo || '') as string).trim().toLowerCase();
                          if (!costo && refKey) {
                            costo = costos.find((c: any) =>
                              (c?.nombre || '').trim().toLowerCase() === refKey
                            );
                          }

                          const costoLabel = costo ? formatCurrency(costo.precio) : null;
                          const fechaLabel = formatDateOrDay(it.fecha, (it as any)?.diaSemana ?? null, (it as any)?.diasSemana ?? null);
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
                                        💰 {costoLabel === 'Gratis' ? 'Gratis' : costoLabel}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="academy-class-buttons" style={{ display: 'flex', gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    classFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    setEditingIndex(idx);
                                    setEditInitial({
                                      nombre: it.titulo || '',
                                      tipo: (costo?.tipo as any) || 'clases sueltas',
                                      precio: costo?.precio !== undefined && costo?.precio !== null ? costo.precio : null,
                                      regla: costo?.regla || '',
                                      nivel: (it as any)?.nivel ?? null,
                                      descripcion: (it as any)?.descripcion || '',
                                      fechaModo: (it as any)?.fechaModo || (it.fecha ? 'especifica' : ((it.diaSemana !== null && it.diaSemana !== undefined) || ((it as any)?.diasSemana && Array.isArray((it as any).diasSemana) && (it as any).diasSemana.length > 0) ? 'semanal' : 'por_agendar')),
                                      fecha: it.fecha || '',
                                      diaSemana: (it as any)?.diaSemana ?? null,
                                      diasSemana: ((it as any)?.diasSemana && Array.isArray((it as any).diasSemana) && (it as any).diasSemana.length > 0) ? (() => {
                                        // Convertir strings o números a números
                                        const dayNameToNumber = (dayName: string | number): number | null => {
                                          if (typeof dayName === 'number') return dayName;
                                          const normalized = String(dayName).toLowerCase().trim();
                                          const map: Record<string, number> = {
                                            'domingo': 0, 'dom': 0, 'lunes': 1, 'lun': 1, 'martes': 2, 'mar': 2,
                                            'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3, 'jueves': 4, 'jue': 4,
                                            'viernes': 5, 'vie': 5, 'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
                                          };
                                          return map[normalized] ?? null;
                                        };
                                        return (it as any).diasSemana.map((d: string | number) => dayNameToNumber(d)).filter((d: number | null) => d !== null) as number[];
                                      })() : ((it as any)?.diaSemana !== null && (it as any)?.diaSemana !== undefined ? [(it as any).diaSemana] : []),
                                      horarioModo: (it as any)?.horarioModo || ((it as any)?.fechaModo === 'por_agendar' ? 'duracion' : ((it as any)?.duracionHoras ? 'duracion' : 'especifica')),
                                      inicio: it.inicio || '',
                                      fin: it.fin || '',
                                      duracionHoras: (it as any)?.duracionHoras ?? null,
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

                                    autoSaveClasses(nextCrono, nextCostos, '✅ Clase eliminada')
                                      .then(() => {
                                        if (editingIndex !== null && editingIndex === idx) {
                                          setEditingIndex(null);
                                          setEditInitial(undefined);
                                        }
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

              {/* Promociones y paquetes */}
              {supportsPromotions && (
                <div style={{ marginBottom: '3rem' }}>
                  <CostsPromotionsEditor
                    value={(form as any).promociones || []}
                    onChange={autoSavePromociones}
                    label="💸 Promociones y Paquetes"
                    helperText="Define paquetes, membresías o descuentos especiales para tu academia y controla su vigencia."
                  />
                </div>
              )}

              {/* Maestros Invitados */}
              {academyId && (
                <>
                  <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
                    <div className="teacher-invite-header">
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
                      <div className="teachers-grid">
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
                            <div key={t.teacher_id} className="teacher-card-wrapper">
                              <TeacherCard item={teacherData} />
                              <button
                                className="teacher-delete-button"
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
                                      // Esperar un momento para que la base de datos se actualice
                                      await new Promise(resolve => setTimeout(resolve, 300));
                                      // Refetch para actualizar las listas
                                      await refetchAccepted();
                                      await refetchAvailable();
                                      setStatusMsg({ type: 'ok', text: '✅ Maestro eliminado. Puedes volver a invitarlo si lo deseas.' });
                                      setTimeout(() => setStatusMsg(null), 4000);
                                    }
                                  } catch (error: any) {
                                    setStatusMsg({ type: 'err', text: `❌ Error: ${error.message}` });
                                    setTimeout(() => setStatusMsg(null), 3000);
                                  }
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
                    <div className="teacher-modal">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="teacher-modal-content"
                      >
                        <div className="teacher-modal-header">
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
                                className="teacher-list-item"
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

              {/* Grupos de Competencia */}
              {academyId && (
                <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
                  <div className="teacher-invite-header">
                    <h2 style={{ fontSize: '1.5rem', color: colors.light, margin: 0 }}>
                      🎯 Grupos de Competencia
                    </h2>
                    <button
                      onClick={() => navigate('/competition-groups/new')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
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
                      ➕ Crear Grupo
                    </button>
                  </div>

                  {loadingGroups ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: colors.light }}>
                      Cargando grupos...
                    </div>
                  ) : !myCompetitionGroups || myCompetitionGroups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: colors.light, opacity: 0.7 }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                      <p>No has creado grupos de competencia aún</p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Crea un grupo para organizar entrenamientos y competencias
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
                      {myCompetitionGroups
                        .filter((g: any) => g.owner_id === user?.id)
                        .map((group: any) => (
                          <div
                            key={group.id}
                            style={{
                              padding: '1.5rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '12px',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '1rem'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <h3 style={{ margin: 0, color: colors.light, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                {group.name}
                              </h3>
                              {group.description && (
                                <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7, color: colors.light, marginBottom: '0.5rem' }}>
                                  {group.description.substring(0, 100)}{group.description.length > 100 ? '...' : ''}
                                </p>
                              )}
                              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                {group.training_location && (
                                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(30,136,229,0.15)', border: '1px solid rgba(30,136,229,0.3)', borderRadius: '8px', color: '#fff' }}>
                                    📍 {group.training_location}
                                  </span>
                                )}
                                {group.cost_amount && (
                                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#fff' }}>
                                    💰 ${group.cost_amount} {group.cost_type === 'monthly' ? '/mes' : group.cost_type === 'per_session' ? '/sesión' : '/paquete'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => navigate(`/competition-groups/${group.id}`)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: 'rgba(30,136,229,0.2)',
                                  border: '1px solid #1E88E5',
                                  borderRadius: '8px',
                                  color: '#fff',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Ver
                              </button>
                              <button
                                onClick={() => navigate(`/competition-groups/${group.id}/edit`)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: 'rgba(255,193,7,0.2)',
                                  border: '1px solid #FFC107',
                                  borderRadius: '8px',
                                  color: '#fff',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm('¿Estás seguro de que quieres eliminar este grupo? Esta acción no se puede deshacer.')) {
                                    return;
                                  }
                                  try {
                                    await deleteGroup.mutateAsync(group.id);
                                    setStatusMsg({ type: 'ok', text: '✅ Grupo eliminado exitosamente' });
                                    setTimeout(() => setStatusMsg(null), 3000);
                                    await refetchGroups();
                                  } catch (error: any) {
                                    setStatusMsg({ type: 'err', text: `❌ Error: ${error.message}` });
                                    setTimeout(() => setStatusMsg(null), 3000);
                                  }
                                }}
                                disabled={deleteGroup.isPending}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: 'rgba(239,68,68,0.2)',
                                  border: '1px solid #EF4444',
                                  borderRadius: '8px',
                                  color: '#fff',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  cursor: deleteGroup.isPending ? 'not-allowed' : 'pointer',
                                  opacity: deleteGroup.isPending ? 0.6 : 1
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
              )}

              {/* Información para Estudiantes */}
              <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
                  💬 Información para Estudiantes
                </h2>

                <FAQEditor value={(form as any).faq || []} onChange={(v: any) => setField('faq' as any, v as any)} />
              </div>

              {/* Reseñas de Alumnos */}
              <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
                  ⭐ Reseñas de Alumnos
                </h2>
                <p style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '0.95rem', color: 'rgba(255,255,255,0.72)', maxWidth: 560 }}>
                  Añade testimonios de alumnos que han tomado clases en tu academia
                </p>
                <ReviewsEditor
                  value={(form as any).reseñas || []}
                  onChange={(v: any) => setField('reseñas' as any, v as any)}
                />
              </div>

              {/* Cuenta Bancaria */}
              <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
                <BankAccountEditor
                  value={(form as any).cuenta_bancaria || {}}
                  onChange={(v) => setField('cuenta_bancaria' as any, v as any)}
                />
              </div>

              {/* Sección: Un poco más de nosotros */}
              <div className="section-content glass-card-container" style={{ marginBottom: '3rem' }}>
                {(() => {
                  const fotoAbout = getMediaBySlot(media as unknown as MediaSlotItem[], 'about');
                  const datoCurioso = (form as any)?.respuestas?.dato_curioso || '';
                  const verMasLink = (form as any)?.respuestas?.ver_mas_link || '';

                  return (
                    <div>
                      <h2 className="editor-section-title" style={{
                        fontSize: '1.5rem',
                        marginBottom: '1.5rem',
                        color: colors.light
                      }}>
                        📖 Un poco más de nosotros
                      </h2>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        {/* Carga de Foto */}
                        <div>
                          <div style={{
                            padding: '1rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            textAlign: 'center'
                          }}>
                            {fotoAbout ? (
                              <div style={{ marginBottom: '1rem' }}>
                                {/* Preview de la foto */}
                                <div style={{
                                  marginBottom: '1rem',
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  border: '2px solid rgba(255, 255, 255, 0.2)',
                                  background: 'rgba(0, 0, 0, 0.2)',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center'
                                }}>
                                  <img
                                    src={fotoAbout.url}
                                    alt="Preview foto about"
                                    style={{
                                      width: '150px',
                                      height: 'auto',
                                      display: 'block',
                                      objectFit: 'contain'
                                    }}
                                  />
                                </div>
                                <div style={{
                                  padding: '0.5rem 1rem',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  borderRadius: '8px',
                                  color: '#10B981',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  marginBottom: '0.5rem'
                                }}>
                                  ✅ Foto cargada
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile('about')}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    color: '#EF4444',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  🗑️ Eliminar foto
                                </button>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem' }}>
                                No hay foto cargada
                              </div>
                            )}
                            <label
                              style={{
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, rgba(30,136,229,0.2), rgba(124,77,255,0.2))',
                                border: '1px solid rgba(30,136,229,0.4)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30,136,229,0.3), rgba(124,77,255,0.3))';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30,136,229,0.2), rgba(124,77,255,0.2))';
                              }}
                            >
                              {fotoAbout ? '📤 Cambiar foto' : '📤 Subir foto'}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    uploadFile(file, 'about');
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Dato Curioso */}
                        <div>
                          <textarea
                            value={datoCurioso}
                            onChange={(e) => setNested('respuestas.dato_curioso', e.target.value)}
                            placeholder="Cuéntanos algo interesante sobre tu academia..."
                            className="editor-textarea"
                            style={{
                              fontSize: '1rem',
                              padding: '1rem',
                              minHeight: '150px',
                              width: '100%',
                              marginBottom: '1rem'
                            }}
                            rows={6}
                          />

                          <div>
                            <label className="editor-field" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                              🔗 Enlace "Ver más" (opcional)
                            </label>
                            <input
                              type="url"
                              value={verMasLink}
                              onChange={(e) => setNested('respuestas.ver_mas_link', e.target.value)}
                              placeholder="https://..."
                              className="editor-input"
                              style={{ fontSize: '0.9rem', padding: '0.6rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Gestión de Fotos - Dos Columnas */}
              <div className="media-management-section" style={{ marginBottom: '3rem' }}>
                <div className="media-management-header">
                  <div className="media-management-icon">
                    📷
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.75rem',
                      fontWeight: 900,
                      margin: 0,
                      color: '#fff',
                      textShadow: '0 2px 8px rgba(229, 57, 53, 0.3), 0 0 16px rgba(251, 140, 0, 0.2)'
                    }}>
                      Gestión de Fotos
                    </h2>
                    <p style={{
                      fontSize: '0.95rem',
                      opacity: 0.85,
                      margin: '0.25rem 0 0 0',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 500
                    }}>
                      Administra las fotos de tu academia
                    </p>
                  </div>
                </div>
                <div className="media-management-content">
                  <div className="photos-two-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Columna 1: Avatar / Foto Principal */}
                    <PhotoManagementSection
                      media={media}
                      uploading={{ p1: add.isPending }}
                      uploadFile={uploadFile}
                      removeFile={removeFile}
                      title="👤 Avatar / Foto Principal"
                      description="Foto principal que aparece en tu perfil (p1)"
                      slots={['p1']}
                      isMainPhoto={true}
                    />

                    {/* Columna 2: Fotos Destacadas */}
                    <PhotoManagementSection
                      media={media}
                      uploading={Object.fromEntries(['p2', 'p3'].map(slot => [slot, add.isPending]))}
                      uploadFile={uploadFile}
                      removeFile={removeFile}
                      title="⭐ Fotos Destacadas"
                      description="Fotos que se muestran en secciones destacadas (p2 - p3)"
                      slots={['p2', 'p3']}
                      isMainPhoto={false}
                      verticalLayout={true}
                    />
                  </div>

                  {/* Fotos Adicionales */}
                  <PhotoManagementSection
                    media={media}
                    uploading={Object.fromEntries(PHOTO_SLOTS.slice(3).map(slot => [slot, add.isPending]))}
                    uploadFile={uploadFile}
                    removeFile={removeFile}
                    title="📸 Fotos Adicionales"
                    description="Más fotos para mostrar diferentes aspectos de tu academia (p4-p10)"
                    slots={PHOTO_SLOTS.slice(3)} // p4-p10
                  />
                </div>
              </div>

              {/* Gestión de Videos */}
              <div className="media-management-section" style={{ marginBottom: '3rem' }}>
                <div className="media-management-header">
                  <div className="media-management-icon">
                    🎥
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.75rem',
                      fontWeight: 900,
                      margin: 0,
                      color: '#fff',
                      textShadow: '0 2px 8px rgba(229, 57, 53, 0.3), 0 0 16px rgba(251, 140, 0, 0.2)'
                    }}>
                      Gestión de Videos
                    </h2>
                    <p style={{
                      fontSize: '0.95rem',
                      opacity: 0.85,
                      margin: '0.25rem 0 0 0',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 500
                    }}>
                      Videos promocionales, clases de muestra, testimonios
                    </p>
                  </div>
                </div>
                <div className="media-management-content">
                  <VideoManagementSection
                    media={media}
                    uploading={Object.fromEntries(VIDEO_SLOTS.map(slot => [slot, add.isPending]))}
                    uploadFile={uploadFile}
                    removeFile={removeFile}
                    title=""
                    description=""
                    slots={[...VIDEO_SLOTS]}
                  />
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
