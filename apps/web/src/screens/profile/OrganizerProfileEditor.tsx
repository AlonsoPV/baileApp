import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer, useUpsertMyOrganizer, useSubmitOrganizerForReview } from "../../hooks/useOrganizer";
import { useParentsByOrganizer, useDeleteParent, useDatesByParent } from "../../hooks/useEvents";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
import { useCreateEventDate } from "../../hooks/useEventDate";
import { MediaUploader } from "../../components/MediaUploader";
import { MediaGrid } from "../../components/MediaGrid";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useToast } from "../../components/Toast";
import ProfileToolbar from "../../components/profile/ProfileToolbar";
import { Chip } from "../../components/profile/Chip";
import { useTags } from "../../hooks/useTags";
import { useHydratedForm } from "../../hooks/useHydratedForm";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { supabase } from "../../lib/supabase";
import { PhotoManagementSection } from "../../components/profile/PhotoManagementSection";
import { VideoManagementSection } from "../../components/profile/VideoManagementSection";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import { getDraftKey } from "../../utils/draftKeys";
import { useRoleChange } from "../../hooks/useRoleChange";
import { useAuth } from "@/contexts/AuthProvider";
import RitmosChips from "@/components/RitmosChips";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import ChipPicker from "../../components/common/ChipPicker";
import ScheduleEditor from "../../components/events/ScheduleEditor";
import CostsEditor from "../../components/events/CostsEditor";
import DateFlyerUploader from "../../components/events/DateFlyerUploader";
import RitmosSelectorEditor from "@/components/profile/RitmosSelectorEditor";
import RSVPCounter from "../../components/RSVPCounter";
import UbicacionesEditor from "../../components/locations/UbicacionesEditor";
import { useOrganizerLocations, useCreateOrganizerLocation, useUpdateOrganizerLocation, useDeleteOrganizerLocation } from "../../hooks/useOrganizerLocations";
import OrganizerUbicacionesEditor from "../../components/organizer/UbicacionesEditor";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

// Componente para mostrar un social con sus fechas
function EventParentCard({ parent, onDelete, isDeleting }: any) {
  const navigate = useNavigate();
  const { data: dates } = useDatesByParent(parent.id);
  const [expanded, setExpanded] = useState(false);

  // Debug logs
  console.log('[EventParentCard] Parent:', parent);
  console.log('[EventParentCard] Dates:', dates);
  console.log('[EventParentCard] Dates length:', dates?.length);

  const handleSocialClick = () => {
    navigate(`/social/${parent.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 'clamp(1.5rem, 2.5vw, 2.5rem)',
        borderRadius: 'clamp(16px, 2.5vw, 28px)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(30, 30, 30, 0.6)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}
    >
      {/* Barra decorativa superior */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '6px',
        background: `linear-gradient(90deg, ${colors.coral}, ${colors.orange}, ${colors.yellow})`,
        borderRadius: '24px 24px 0 0',
      }} />

      {/* FILA 1: Información del Social */}
      <div style={{ 
        position: 'relative', 
        zIndex: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Icono */}
        <motion.div
          whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            background: `linear-gradient(135deg, rgba(255, 61, 87, 0.2), rgba(255, 140, 66, 0.2))`,
            border: '3px solid rgba(255, 61, 87, 0.4)',
            boxShadow: '0 6px 20px rgba(255, 61, 87, 0.4)',
            filter: 'drop-shadow(0 4px 8px rgba(255, 61, 87, 0.4))',
            flexShrink: 0
          }}
        >
          🎭
        </motion.div>
        
        {/* Contenido principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Nombre del social */}
          <h3 style={{
            fontSize: 'clamp(1.5rem, 2vw, 2rem)',
            fontWeight: '800',
            margin: 0,
            marginBottom: '0.75rem',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            {parent.nombre}
          </h3>
          
          {/* Descripción */}
          {parent.descripcion && (
            <p style={{
              fontSize: '1rem',
              opacity: 0.9,
              margin: 0,
              fontWeight: '400',
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.9)"
            }}>
              {parent.descripcion.length > 200 ? `${parent.descripcion.substring(0, 200)}...` : parent.descripcion}
            </p>
          )}
        </div>
        
        {/* Botones de acción */}
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem',
          flexShrink: 0,
          alignItems: 'flex-start'
        }}>
          <motion.button
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSocialClick}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'rgba(30, 136, 229, 0.15)',
              color: colors.blue,
              border: '2px solid rgba(30, 136, 229, 0.3)',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(30, 136, 229, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>👁️</span>
            <span>Ver</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/social/${parent.id}/edit`);
            }}
            style={{
              padding: '0.75rem 1.25rem',
              background: `linear-gradient(135deg, ${colors.blue}, #00BCD4)`,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(30, 136, 229, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>✏️</span>
            <span>Editar</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(parent.id);
            }}
            disabled={isDeleting}
            style={{
              padding: '0.75rem 1.25rem',
              background: isDeleting
                ? 'rgba(255, 255, 255, 0.1)'
                : `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
              color: colors.light,
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '700',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1,
              transition: 'all 0.3s ease',
              boxShadow: isDeleting ? 'none' : '0 4px 16px rgba(255, 61, 87, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{isDeleting ? '⏳' : '🗑️'}</span>
            <span>{isDeleting ? 'Eliminando...' : 'Eliminar'}</span>
          </motion.button>
        </div>
      </div>

      {/* FILA 2: Fechas del social */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {dates && dates.length > 0 ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: 'rgba(30, 136, 229, 0.1)',
              border: '2px solid rgba(30, 136, 229, 0.2)',
              color: colors.light,
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '700',
              marginBottom: expanded ? '1rem' : '0',
              padding: '1rem 1.25rem',
              borderRadius: '14px',
              width: '100%',
              textAlign: 'left',
              transition: 'all 0.3s ease',
              boxShadow: expanded ? '0 4px 16px rgba(30, 136, 229, 0.2)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>📅</span>
              <span>{dates.length} fecha{dates.length > 1 ? 's' : ''} disponible{dates.length > 1 ? 's' : ''}</span>
            </div>
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: '0.875rem', opacity: 0.8 }}
            >
              ▼
            </motion.span>
          </motion.button>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginTop: '1rem',
                padding: '1.5rem',
                borderRadius: '20px',
                border: '2px solid rgba(30, 136, 229, 0.3)',
                background: 'rgba(15, 15, 15, 0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Barra decorativa superior para fechas */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${colors.blue}, #00BCD4, ${colors.coral})`,
                borderRadius: '20px 20px 0 0',
              }} />
              {dates.map((date: any, index: number) => {
                // Debug log para cada fecha
                console.log('[EventParentCard] Date item:', date);
                console.log('[EventParentCard] Date nombre:', date.nombre);
                console.log('[EventParentCard] Date fecha:', date.fecha);

                return (
                  <motion.div
                    key={date.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.3 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/social/fecha/${date.id}`);
                    }}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      background: 'rgba(20, 20, 20, 0.5)'
                    }}
                    whileHover={{
                      y: -4,
                      borderColor: 'rgba(30, 136, 229, 0.5)',
                      background: 'rgba(30, 30, 30, 0.6)'
                    }}
                  >
                    {/* Efecto de brillo en hover */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }}
                    />

                    {/* FILA 1: Nombre y fecha principal */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '1rem',
                      position: 'relative',
                      zIndex: 2,
                      paddingBottom: '1rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                          transition={{ duration: 0.4 }}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            background: 'rgba(30, 136, 229, 0.15)',
                            border: '2px solid rgba(30, 136, 229, 0.3)',
                            boxShadow: '0 4px 12px rgba(30, 136, 229, 0.2)',
                            flexShrink: 0
                          }}
                        >
                          📅
                        </motion.div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '1.2rem',
                            fontWeight: '800',
                            color: colors.light,
                            lineHeight: 1.3,
                            letterSpacing: '-0.01em',
                            marginBottom: '0.25rem'
                          }}>
                            {date.nombre || 'Fecha sin nombre'}
                          </div>
                          {/* Fecha en chip compacto */}
                          <div style={{
                            fontSize: '0.875rem',
                            color: colors.blue,
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '0.4rem 0.75rem',
                            background: 'rgba(30, 136, 229, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(30, 136, 229, 0.25)',
                            width: 'fit-content'
                          }}>
                            <span>📅</span>
                            <span>{new Date(date.fecha).toLocaleDateString('es-ES', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones de acción en la primera fila */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem',
                        flexShrink: 0
                      }}>
                        <motion.button
                          whileHover={{ scale: 1.08, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/social/fecha/${date.id}/edit`);
                          }}
                          style={{
                            padding: '0.6rem 1rem',
                            background: `linear-gradient(135deg, ${colors.blue}, #00BCD4)`,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span>✏️</span>
                          <span>Editar</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.08, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implementar eliminación de fecha
                            console.log('Eliminar fecha:', date.id);
                          }}
                          style={{
                            padding: '0.6rem 1rem',
                            background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(255, 61, 87, 0.3)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span>🗑️</span>
                          <span>Eliminar</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* FILA 2: Detalles de la fecha */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 2
                    }}>
                          {date.hora_inicio && date.hora_fin && (
                            <div style={{
                              fontSize: '0.875rem',
                              color: colors.light,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.5rem 0.875rem',
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '10px',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              width: 'fit-content'
                            }}>
                              <span>🕐</span>
                              <span>{date.hora_inicio} - {date.hora_fin}</span>
                            </div>
                          )}

                          {date.lugar && (
                            <div style={{
                              fontSize: '0.875rem',
                              color: colors.light,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.5rem 0.875rem',
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '10px',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              width: 'fit-content'
                            }}>
                              <span>📍</span>
                              <span>{date.lugar}</span>
                            </div>
                          )}

                          {date.ciudad && (
                            <div style={{
                              fontSize: '0.8rem',
                              color: 'rgba(255, 255, 255, 0.8)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.4rem 0.75rem',
                              background: 'rgba(255, 255, 255, 0.06)',
                              borderRadius: '8px',
                              width: 'fit-content'
                            }}>
                              <span>🏙️</span>
                              <span>{date.ciudad}</span>
                            </div>
                          )}
                          
                          {/* Contador de RSVP */}
                          <div style={{
                            marginLeft: 'auto',
                            padding: '0.5rem 0.875rem',
                            background: 'rgba(255, 140, 66, 0.15)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 140, 66, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <RSVPCounter 
                              eventDateId={date.id} 
                              variant="minimal"
                              showIcons={true}
                            />
                          </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>
              No hay fechas para este social
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function OrganizerProfileEditor() {
  const navigate = useNavigate();
  const { data: org, isLoading } = useMyOrganizer();
  const upsert = useUpsertMyOrganizer();
  const submit = useSubmitOrganizerForReview();
  const { data: parents } = useParentsByOrganizer(org?.id);
  const { data: orgLocations = [] } = useOrganizerLocations(org?.id);
  const createOrgLoc = useCreateOrganizerLocation();
  const updateOrgLoc = useUpdateOrganizerLocation();
  const deleteOrgLoc = useDeleteOrganizerLocation();
  const deleteParent = useDeleteParent();
  const { media, add, remove } = useOrganizerMedia();
  const { showToast } = useToast();

  // Estados para carga de media
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  // Estado local para edición de ubicaciones por social (no se guarda en profiles_organizer)
  const [locationsDraftByParent, setLocationsDraftByParent] = useState<Record<number, any[]>>({});

  // Estado para formulario de crear fecha
  const [showDateForm, setShowDateForm] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const createEventDate = useCreateEventDate();
  const [dateForm, setDateForm] = useState({
    nombre: '',
    biografia: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    lugar: '',
    ciudad: '',
    direccion: '',
    referencias: '',
    requisitos: '',
    zona: null as number | null,
    estilos: [] as number[],
    ritmos_seleccionados: [] as string[],
    zonas: [] as number[],
    cronograma: [] as any[],
    costos: [] as any[],
    flyer_url: null as string | null,
    estado_publicacion: 'borrador' as 'borrador' | 'publicado'
  });

  // Función para subir archivo
  const uploadFile = async (file: File, slot: string, kind: "photo" | "video") => {
    setUploading(prev => ({ ...prev, [slot]: true }));

    try {
      await add.mutateAsync({ file, slot });
      showToast(`${kind === 'photo' ? 'Foto' : 'Video'} subido correctamente`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Error al subir el archivo', 'error');
    } finally {
      setUploading(prev => ({ ...prev, [slot]: false }));
    }
  };

  // Función para eliminar archivo
  const removeFile = async (slot: string) => {
    try {
      // Buscar el media item por slot
      const mediaItem = media.find(m => (m as any).slot === slot);
      if (mediaItem) {
        await remove.mutateAsync(mediaItem.id);
        showToast('Archivo eliminado', 'success');
      } else {
        showToast('No se encontró el archivo', 'error');
      }
    } catch (error) {
      console.error('Error removing file:', error);
      showToast('Error al eliminar el archivo', 'error');
    }
  };

  // Manejar cambio de roles
  useRoleChange();

  // Obtener usuario autenticado
  const { user } = useAuth();

  // Cargar tags
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter(tag => tag.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter(tag => tag.tipo === 'zona') || [];

  // Usar formulario hidratado con borrador persistente (namespace por usuario y rol)
  const { form, setField, setNested, hydrated } = useHydratedForm({
    draftKey: getDraftKey(user?.id, 'organizer'),
    serverData: org as any,
    defaults: {
      nombre_publico: "",
      bio: "",
      ritmos_seleccionados: [] as string[],
      ritmos: [] as number[],
      zonas: [] as number[],
      redes_sociales: {
        instagram: "",
        facebook: "",
        whatsapp: ""
      },
      respuestas: {
        musica_tocaran: "",
        hay_estacionamiento: ""
      }
    },
    preferDraft: true
  });

  // Funciones para toggle de chips
  const toggleRitmo = (id: number) => {
    const newRitmos = form.ritmos.includes(id)
      ? form.ritmos.filter(r => r !== id)
      : [...form.ritmos, id];
    setField('ritmos', newRitmos);
  };

  const toggleZona = (id: number) => {
    const newZonas = form.zonas.includes(id)
      ? form.zonas.filter(z => z !== id)
      : [...form.zonas, id];
    setField('zonas', newZonas);
  };

  // Función para guardar
  const handleSave = async () => {
    try {
      console.log("🚀 [OrganizerProfileEditor] ===== INICIANDO GUARDADO =====");
      console.log("📤 [OrganizerProfileEditor] Datos a enviar:", form);
      console.log("📱 [OrganizerProfileEditor] Redes sociales:", form.redes_sociales);
      console.log("📝 [OrganizerProfileEditor] Nombre público:", form.nombre_publico);
      console.log("📄 [OrganizerProfileEditor] Bio:", form.bio);
      console.log("🎵 [OrganizerProfileEditor] Ritmos:", form.ritmos);
      console.log("🎵 [OrganizerProfileEditor] Ritmos Seleccionados:", (form as any).ritmos_seleccionados);
      console.log("📍 [OrganizerProfileEditor] Zonas:", form.zonas);
      console.log("💬 [OrganizerProfileEditor] Respuestas:", form.respuestas);

      // Asegurar que ritmos_seleccionados se guarde; si está vacío pero hay ritmos (numéricos), mapear por etiqueta
      let outSelected = ((((form as any)?.ritmos_seleccionados) || []) as string[]);
      if ((!outSelected || outSelected.length === 0) && Array.isArray(form.ritmos) && form.ritmos.length > 0) {
        const labelToItemId = new Map<string, string>();
        RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelToItemId.set(i.label, i.id)));
        const names = form.ritmos
          .map(id => ritmoTags.find(t => t.id === id)?.nombre)
          .filter(Boolean) as string[];
        const mapped = names
          .map(n => labelToItemId.get(n))
          .filter(Boolean) as string[];
        if (mapped.length > 0) outSelected = mapped;
      }

      const wasNewProfile = !org; // Detectar si es un perfil nuevo
      console.log("📊 [OrganizerProfileEditor] wasNewProfile:", wasNewProfile);
      
      const profileId = await upsert.mutateAsync({ ...(form as any), ritmos_seleccionados: outSelected } as any);
      console.log("📊 [OrganizerProfileEditor] profileId retornado:", profileId);
      console.log("✅ [OrganizerProfileEditor] Guardado exitoso");
      
      // Si es un perfil nuevo, crear evento y fecha por defecto
      if (wasNewProfile && profileId) {
        console.log("🌱 [OrganizerProfileEditor] Creando evento y fecha por defecto para organizador ID:", profileId);
        console.log("🌱 [OrganizerProfileEditor] Ritmos a usar:", outSelected);
        console.log("🌱 [OrganizerProfileEditor] Zonas a usar:", form.zonas);
        
        try {
          // Crear evento padre por defecto
          const parentPayload: any = {
            organizer_id: profileId,
            nombre: '🎉 Mi Primer Social',
            descripcion: 'Este es tu primer evento social. Edita el nombre, descripción y agrega fechas desde el editor.',
            ritmos_seleccionados: outSelected || [],
            zonas: form.zonas || []
          };
          
          console.log("📦 [OrganizerProfileEditor] Payload para evento padre:", parentPayload);
          
          const { data: newParent, error: parentErr } = await supabase
            .from('events_parent')
            .insert(parentPayload)
            .select('*')
            .single();

          if (parentErr) {
            console.error('❌ [OrganizerProfileEditor] Error creando social por defecto:', parentErr);
            showToast('⚠️ Perfil creado, pero no se pudo crear el evento por defecto', 'info');
          } else if (newParent) {
            console.log("✅ [OrganizerProfileEditor] Social por defecto creado:", newParent.id);
            
            // Crear fecha por defecto (para 7 días adelante)
            const fechaBase = new Date();
            fechaBase.setDate(fechaBase.getDate() + 7);
            const fechaStr = fechaBase.toISOString().slice(0, 10);

            const datePayload = {
              parent_id: newParent.id,
              nombre: '📅 Primera Fecha',
              biografia: 'Configura la información de tu primera fecha: hora, lugar, precios y más.',
              fecha: fechaStr,
              hora_inicio: '20:00',
              hora_fin: '02:00',
              lugar: 'Por definir',
              ciudad: 'Tu ciudad',
              estado_publicacion: 'borrador',
              ritmos_seleccionados: outSelected || [],
              zonas: form.zonas || [],
              cronograma: [],
              costos: []
            };
            
            console.log("📦 [OrganizerProfileEditor] Payload para fecha:", datePayload);

            const { error: dateErr } = await supabase
              .from('events_date')
              .insert(datePayload);

            if (dateErr) {
              console.error('❌ [OrganizerProfileEditor] Error creando fecha por defecto:', dateErr);
            } else {
              console.log("✅ [OrganizerProfileEditor] Fecha por defecto creada");
            }
          }
        } catch (seedErr) {
          console.error('❌ [OrganizerProfileEditor] Error en semilla automática:', seedErr);
        }
      } else {
        console.log("ℹ️ [OrganizerProfileEditor] No es perfil nuevo o no hay profileId, saltando auto-seed");
        console.log("   - wasNewProfile:", wasNewProfile);
        console.log("   - profileId:", profileId);
      }
      
      // Toast final basado en si es nuevo o actualización
      if (wasNewProfile) {
        showToast('✅ Perfil de organizador creado con evento de ejemplo', 'success');
      } else {
        showToast('✅ Organizador actualizado', 'success');
      }
    } catch (err: any) {
      console.error("❌ [OrganizerProfileEditor] Error al guardar:", err);
      showToast('Error al guardar', 'error');
    }
  };

  // Función para enviar para revisión
  const handleSubmitForReview = async () => {
    try {
      await submit.mutateAsync();
      showToast('Enviado para revisión ✅', 'success');
    } catch (err: any) {
      console.error('Error submitting for review:', err);
      showToast('Error al enviar para revisión', 'error');
    }
  };

  // Función para eliminar evento
  const handleDeleteEvent = async (parentId: string) => {
    try {
      const confirmDelete = window.confirm('¿Seguro que deseas eliminar este social? Esta acción no se puede deshacer.');
      if (!confirmDelete) return;
      await deleteParent.mutateAsync(Number(parentId));
      showToast('Evento eliminado ✅', 'success');
    } catch (err: any) {
      console.error('Error deleting event:', err);
      showToast('Error al eliminar evento', 'error');
    }
  };

  // Función para crear fecha
  const handleCreateDate = async () => {
    if (!dateForm.fecha) {
      showToast('La fecha es obligatoria', 'error');
      return;
    }

    try {
      // Si no existe un evento padre seleccionado, crear uno automáticamente
      let parentIdToUse = selectedParentId;
      if (!parentIdToUse) {
        const parentPayload: any = {
          organizer_id: org?.id,
          nombre: dateForm.nombre ? `🎉 ${dateForm.nombre}` : '🎉 Nuevo Social',
          descripcion: dateForm.biografia || 'Evento creado automáticamente al crear una fecha.',
          ritmos_seleccionados: dateForm.ritmos_seleccionados || [],
          zonas: dateForm.zonas || []
        };

        const { data: newParent, error: parentErr } = await supabase
          .from('events_parent')
          .insert(parentPayload)
          .select('id')
          .single();

        if (parentErr) {
          console.error('Error creando evento padre automáticamente:', parentErr);
          showToast('No se pudo crear el evento automáticamente', 'error');
          return;
        }
        parentIdToUse = newParent?.id;
      }

      await createEventDate.mutateAsync({
        parent_id: Number(parentIdToUse),
        nombre: dateForm.nombre || null,
        biografia: dateForm.biografia || null,
        fecha: dateForm.fecha,
        hora_inicio: dateForm.hora_inicio || null,
        hora_fin: dateForm.hora_fin || null,
        lugar: dateForm.lugar || null,
        direccion: dateForm.direccion || null,
        ciudad: dateForm.ciudad || null,
        zona: dateForm.zona || null,
        referencias: dateForm.referencias || null,
        requisitos: dateForm.requisitos || null,
        estilos: dateForm.estilos || [],
        ritmos_seleccionados: dateForm.ritmos_seleccionados || [],
        zonas: dateForm.zonas || [],
        cronograma: dateForm.cronograma || [],
        costos: dateForm.costos || [],
        flyer_url: dateForm.flyer_url || null,
        estado_publicacion: dateForm.estado_publicacion || 'borrador'
      });
      showToast('Fecha creada ✅', 'success');
      setShowDateForm(false);
      setDateForm({
        nombre: '',
        biografia: '',
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        lugar: '',
        ciudad: '',
        direccion: '',
        referencias: '',
        requisitos: '',
        zona: null,
        estilos: [],
        ritmos_seleccionados: [],
        zonas: [],
        cronograma: [],
        costos: [],
        flyer_url: null,
        estado_publicacion: 'borrador'
      });
      setSelectedParentId(null);
    } catch (err: any) {
      console.error('Error creating date:', err);
      showToast('Error al crear fecha', 'error');
    }
  };

  // Función para obtener badge de estado
  const getEstadoBadge = () => {
    if (!org) return null; // Si no hay perfil, no mostrar badge

    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      borrador: { bg: '#94A3B8', text: 'Borrador', icon: '📝' },
      en_revision: { bg: colors.orange, text: 'En Revisión', icon: '⏳' },
      aprobado: { bg: '#10B981', text: 'Verificado', icon: '✅' },
      rechazado: { bg: colors.coral, text: 'Rechazado', icon: '❌' },
    };

    const badge = badges[org.estado_aprobacion] || badges.borrador;

    return (
      <span
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          background: `${badge.bg}cc`,
          border: `2px solid ${badge.bg}`,
          color: colors.light,
          fontSize: '0.875rem',
          fontWeight: '700',
          boxShadow: `0 2px 8px ${badge.bg}66`,
        }}
      >
        {badge.icon} {badge.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Cargando perfil del organizador...</div>
        </div>
      </div>
    );
  }

  // Si no hay perfil, mostrar el formulario vacío (no bloquear)
  const isNewProfile = !org;

  return (
    <>
      <style>{`
        .org-editor-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .org-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .org-editor-back {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
        
        .org-editor-back:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.4);
        }
        
        .org-editor-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          flex: 1 1 0%;
          text-align: center;
          color: #FFFFFF;
        }
        
        .org-editor-card {
          margin-bottom: 2rem;
          padding: 1.2rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }
        
        .org-editor-card h2 {
          color: #FFFFFF;
        }
        
        .org-editor-card h3 {
          color: #FFFFFF;
        }
        
        .org-editor-card p {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .org-editor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        
        .org-editor-grid-small {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
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
        
        .org-editor-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .org-events-section {
          margin-bottom: 3rem;
          padding: clamp(1rem, 3vw, 2.25rem);
          border-radius: clamp(16px, 3vw, 28px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.06) inset;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: #FFFFFF;
        }

        .org-events-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, #1E88E5, #00BCD4, #FF3D57);
          opacity: 0.9;
        }
        
        .org-events-section h2,
        .org-events-section h3,
        .org-events-section h4 {
          color: #FFFFFF;
        }
        
        .org-events-section p {
          color: rgba(255, 255, 255, 0.9);
        }

        .org-events-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .org-create-button {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          pointer-events: auto;
        }
        
        @media (max-width: 768px) {
          .org-editor-container {
            max-width: 100% !important;
            padding: 1rem !important;
          }
          
          .org-editor-header {
            flex-direction: column !important;
            gap: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          
          .org-editor-back {
            padding: 0.5rem 1rem !important;
            font-size: 0.8rem !important;
          }
          
          .org-editor-title {
            font-size: 1.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          .org-editor-card {
            padding: 1.5rem !important;
            margin-bottom: 2rem !important;
            border-radius: 12px !important;
          }
          
          .org-editor-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          
          .org-editor-grid-small {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .org-editor-field {
            font-size: 0.9rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .org-editor-input {
            padding: 0.6rem !important;
            font-size: 0.9rem !important;
          }
          
          .org-editor-textarea {
            padding: 0.6rem !important;
            font-size: 0.9rem !important;
            rows: 3 !important;
          }
          
          .org-editor-chips {
            justify-content: center !important;
            gap: 0.4rem !important;
          }
          
          .org-events-section {
            padding: 1.5rem !important;
            margin-bottom: 2rem !important;
            border-radius: 16px !important;
          }
          
          .org-events-grid {
            gap: 1.25rem !important;
          }
          
          .org-create-button {
            bottom: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
          }
        }
        
        @media (max-width: 480px) {
          .org-editor-container {
            padding: 0.75rem !important;
          }
          
          .org-editor-header {
            margin-bottom: 1rem !important;
          }
          
          .org-editor-back {
            padding: 0.4rem 0.8rem !important;
            font-size: 0.75rem !important;
          }
          
          .org-editor-title {
            font-size: 1.25rem !important;
          }
          
          .org-editor-card {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 10px !important;
          }
          
          .org-editor-grid {
            gap: 1rem !important;
          }
          
          .org-editor-grid-small {
            gap: 0.75rem !important;
          }
          
          .org-editor-field {
            font-size: 0.8rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          .org-editor-input {
            padding: 0.5rem !important;
            font-size: 0.8rem !important;
          }
          
          .org-editor-textarea {
            padding: 0.5rem !important;
            font-size: 0.8rem !important;
          }
          
          .org-editor-chips {
            gap: 0.3rem !important;
          }
          
          .org-events-section {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          
          .org-events-grid {
            gap: 1rem !important;
          }
          
          .org-create-button {
            bottom: 16px !important;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: colors.light,
        padding: '2rem',
      }}>
        <div className="org-editor-container">
          {/* Header con botón Volver */}
          <div className="org-editor-header">
            <button
              onClick={() => navigate(-1)}
              className="org-editor-back"
            >
              ← Volver
            </button>
            <h1 className="org-editor-title">
              ✏️ Editar Organizador
            </h1>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* Componente de navegación flotante */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
            <ProfileNavigationToggle
              currentView="edit"
              profileType="organizer"
              onSave={handleSave}
              isSaving={upsert.isPending}
              saveDisabled={!form.nombre_publico?.trim()}
            />
          </div>

          {/* Banner de Bienvenida (solo para perfiles nuevos) */}
          {isNewProfile && (
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
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎤</div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700',
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ¡Bienvenido, Organizador!
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
                👆 Mínimo requerido: <strong>Nombre Público</strong>
              </div>
            </motion.div>
          )}

          {/* Información del Organizador */}
          <div
            id="organizer-basic-info"
            data-test-id="organizer-basic-info"
            className="org-editor-card"
          > 
            <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: colors.light }}>
              🏢 Información del Organizador
            </h2>

            <div className="org-editor-grid">
              <div>
                <label className="org-editor-field">
                  Nombre Público
                </label>
                <input
                  id="organizer-name-input"
                  data-test-id="organizer-name-input"
                  type="text"
                  value={form.nombre_publico}
                  onChange={(e) => setField('nombre_publico', e.target.value)}
                  placeholder="Nombre de tu organización"
                  className="org-editor-input"
                />
              </div>

              <div>
                <label className="org-editor-field">
                  Biografía
                </label>
                <textarea
                  id="organizer-bio-input"
                  data-test-id="organizer-bio-input"
                  value={form.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                  placeholder="Cuéntanos sobre tu organización..."
                  rows={4}
                  className="org-editor-textarea"
                />
              </div>
            </div>
          </div>

          {/* Ritmos y Zonas */}
          <div
            id="organizer-rhythms-zones"
            data-test-id="organizer-rhythms-zones"
            className="org-editor-card"
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: colors.light }}>
              🎵 Ritmos y Zonas
            </h2>

            <div className="org-editor-grid">
              <div>
                {/*   <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: colors.light }}>
                  🎶 Ritmos que Organizas
                </h3>
                <div className="org-editor-chips">
                  {ritmoTags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.nombre}
                      active={form.ritmos.includes(tag.id)}
                      onClick={() => toggleRitmo(tag.id)}
                      variant="ritmo"
                    />
                  ))}
                </div> */}

                {/* Catálogo agrupado (independiente de DB) */}
                <div style={{ marginTop: 12 }}>
                  {/* <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: colors.light }}>
                  🎵 Ritmos de Baile
                </h3> */}
                  {(
                    <RitmosSelectorEditor
                      selected={(((form as any)?.ritmos_seleccionados) || []) as string[]}
                      ritmoTags={ritmoTags as any}
                      setField={setField as any}
                    />
                  )}
                </div>
              </div>

              <div>
                {/*  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: colors.light }}>
                  📍 Zonas donde Organizas
                </h3> */}
                <div className="org-editor-chips">
                  {zonaTags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.nombre}
                      active={form.zonas.includes(tag.id)}
                      onClick={() => toggleZona(tag.id)}
                      variant="zona"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div
            id="organizer-social-networks"
            data-test-id="organizer-social-networks"
            className="org-editor-card"
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: colors.light }}>
              📱 Redes Sociales
            </h2>

            <div className="org-editor-grid-small">
              <div>
                <label className="org-editor-field">
                  📸 Instagram
                </label>
                <input
                  type="text"
                  value={form.redes_sociales.instagram}
                  onChange={(e) => setNested('redes_sociales.instagram', e.target.value)}
                  placeholder="@tu_organizacion"
                  className="org-editor-input"
                />
              </div>

              <div>
                <label className="org-editor-field">
                  👥 Facebook
                </label>
                <input
                  type="text"
                  value={form.redes_sociales.facebook}
                  onChange={(e) => setNested('redes_sociales.facebook', e.target.value)}
                  placeholder="Página o perfil"
                  className="org-editor-input"
                />
              </div>

              <div>
                <label className="org-editor-field">
                  💬 WhatsApp
                </label>
                <input
                  type="text"
                  value={form.redes_sociales.whatsapp}
                  onChange={(e) => setNested('redes_sociales.whatsapp', e.target.value)}
                  placeholder="Número de teléfono"
                  className="org-editor-input"
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

         
          {/* Mis Eventos */}
          <div
            id="organizer-events-list"
            data-test-id="organizer-events-list"
            className="org-events-section"
          >
            {/* Sección: Ubicaciones por social (edita por social) */}
            {parents && parents.length > 0 && (
              <div className="org-editor-card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#FFFFFF' }}>
                  📍 Ubicaciones
                </h2>
                <p style={{ marginTop: 0, marginBottom: '1rem', opacity: 0.9 }}>
                  Administra las ubicaciones por cada social. Estas son independientes y luego podrás usarlas en las fechas.
                </p>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {parents.map((parent: any) => {
                    const current = locationsDraftByParent[parent.id] ?? (parent.ubicaciones || []);
                    return (
                      <div key={parent.id} style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                          <strong style={{ fontSize: '1rem' }}>🎭 {parent.nombre}</strong>
                          <button
                            type="button"
                            onClick={() => navigate(`/social/${parent.id}/edit`)}
                            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' }}
                          >
                            ✏️ Abrir editor
                          </button>
                        </div>
                        <UbicacionesEditor
              value={(form as any).ubicaciones || []}
              onChange={(v) => setField('ubicaciones' as any, v as any)}
              title="Ubicaciones"
            />
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>
                  Tip: Para guardar estas ubicaciones, usa el botón "Abrir editor" del social y guarda desde ahí.
                </div>
              </div>
            )}

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 4px 16px rgba(30, 136, 229, 0.3)',
                  }}>
                    🎭
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.75rem',
                      fontWeight: '800',
                      margin: 0,
                      color: '#FFFFFF',
                    }}>
                      Mis Sociales
                    </h2>
                    <p style={{
                      fontSize: '0.9rem',
                      opacity: 0.8,
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      Gestiona tus eventos sociales
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowDateForm(!showDateForm);
                      if (!showDateForm && parents && parents.length === 1) {
                        setSelectedParentId(parents[0].id);
                      }
                    }}
                    style={{
                      padding: '0.9rem 1.6rem',
                      borderRadius: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.28)',
                      background: showDateForm
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.12))'
                        : 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: showDateForm
                        ? '0 8px 24px rgba(255,255,255,0.08)'
                        : '0 8px 24px rgba(30,136,229,0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      position: 'relative',
                      overflow: 'hidden',
                      letterSpacing: '0.2px'
                    }}
                  >
                    <span>{showDateForm ? '✖️' : '📅'}</span>
                    <span>{showDateForm ? 'Cerrar' : 'Crear Fecha'}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/social/new')}
                    style={{
                      padding: '0.9rem 1.6rem',
                      borderRadius: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.28)',
                      background: 'linear-gradient(135deg, #FF3D57, #FF8C42)',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(255,61,87,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      position: 'relative',
                      overflow: 'hidden',
                      letterSpacing: '0.2px'
                    }}
                  >
                    <span>🎉</span>
                    <span>Crear Evento</span>
                  </motion.button>
                </div>
              </div>

              {/* Formulario de crear fecha */}
              {showDateForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginBottom: '2rem',
                    padding: '0',
                    borderRadius: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                  }}
                >
                  {/* Info/Selector de evento padre */}
                  {(!parents || parents.length === 0) && (
                    <div className="org-editor-card" style={{ borderStyle: 'dashed' }}>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)' }}>
                        No tienes eventos sociales aún. Al crear esta fecha, se creará automáticamente un evento
                        social base con la información proporcionada.
                      </p>
                    </div>
                  )}

                  {parents && parents.length > 1 && (
                    <div className="org-editor-card">
                      <label className="org-editor-field">
                        Evento Social *
                      </label>
                      <select
                        value={selectedParentId || ''}
                        onChange={(e) => setSelectedParentId(Number(e.target.value))}
                        className="org-editor-input"
                        style={{ color: '#FFFFFF', cursor: 'pointer' }}
                      >
                        <option value="" style={{ background: '#1a1a1a', color: '#FFFFFF' }}>
                          Selecciona un evento
                        </option>
                        {parents.map((parent: any) => (
                          <option key={parent.id} value={parent.id} style={{ background: '#1a1a1a', color: '#FFFFFF' }}>
                            {parent.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                          rows={4}
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
                        allowedIds={((form as any)?.ritmos_seleccionados || []) as string[]}
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

                  {/* Zonas */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      📍 Zonas de la Ciudad
                    </h3>
                    <ChipPicker
                      tipo="zona"
                      selected={dateForm.zonas || []}
                      onChange={(selected) => setDateForm({ ...dateForm, zonas: selected as number[] })}
                      label="Zonas de la Ciudad"
                      placeholder="Selecciona las zonas donde se realizará"
                      maxSelections={3}
                    />
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
                  </div>

                  {/* Ubicación Específica */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      📍 Ubicación Específica
                    </h3>
                    <div className="org-editor-grid">
                      <div>
                        <label className="org-editor-field">
                          Lugar
                        </label>
                        <input
                          type="text"
                          value={dateForm.lugar}
                          onChange={(e) => setDateForm({ ...dateForm, lugar: e.target.value })}
                          placeholder="Nombre del lugar"
                          className="org-editor-input"
                        />
                      </div>
                      <div>
                        <label className="org-editor-field">
                          Ciudad
                        </label>
                        <input
                          type="text"
                          value={dateForm.ciudad}
                          onChange={(e) => setDateForm({ ...dateForm, ciudad: e.target.value })}
                          placeholder="Ciudad"
                          className="org-editor-input"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="org-editor-field">
                          Dirección
                        </label>
                        <input
                          type="text"
                          value={dateForm.direccion}
                          onChange={(e) => setDateForm({ ...dateForm, direccion: e.target.value })}
                          placeholder="Dirección completa"
                          className="org-editor-input"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="org-editor-field">
                          Referencias
                        </label>
                        <input
                          type="text"
                          value={dateForm.referencias}
                          onChange={(e) => setDateForm({ ...dateForm, referencias: e.target.value })}
                          placeholder="Puntos de referencia, cómo llegar..."
                          className="org-editor-input"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="org-editor-field">
                          Requisitos
                        </label>
                        <textarea
                          value={dateForm.requisitos}
                          onChange={(e) => setDateForm({ ...dateForm, requisitos: e.target.value })}
                          placeholder="Requisitos para participar (edad, nivel, vestimenta, etc.)"
                          rows={3}
                          className="org-editor-textarea"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ubicaciones Múltiples (sección movida fuera del form, se mantiene ubicación específica aquí) */}

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
                      onSaveCosto={(index) => {
                        console.log('💾 Guardando costo individual:', dateForm.costos[index]);
                        showToast('💰 Costo guardado en el formulario. Recuerda hacer click en "✨ Crear" para guardar la fecha completa.', 'info');
                      }}
                    />
                  </div>

                  {/* Costos */}
                  {/*  <div className="org-editor-card">
                    <CostsEditor
                      value={dateForm.costos || []}
                      onChange={(costos) => setDateForm({ ...dateForm, costos })}
                    />
                  </div> */}

                  {/* Flyer */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      🖼️ Flyer del Evento
                    </h3>
                    <DateFlyerUploader
                      value={dateForm.flyer_url || null}
                      onChange={(url) => setDateForm({ ...dateForm, flyer_url: url })}
                      dateId={null}
                      parentId={selectedParentId || undefined}
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
                      onClick={() => {
                        setShowDateForm(false);
                        setDateForm({
                          nombre: '',
                          biografia: '',
                          fecha: '',
                          hora_inicio: '',
                          hora_fin: '',
                          lugar: '',
                          ciudad: '',
                          direccion: '',
                          referencias: '',
                          requisitos: '',
                          zona: null,
                          estilos: [],
                          ritmos_seleccionados: [],
                          zonas: [],
                          cronograma: [],
                          costos: [],
                          flyer_url: null,
                          estado_publicacion: 'borrador'
                        });
                        setSelectedParentId(null);
                      }}
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
                      disabled={createEventDate.isPending || !dateForm.fecha || (((parents?.length) || 0) > 1 && !selectedParentId)}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: createEventDate.isPending || !dateForm.fecha || (parents.length > 1 && !selectedParentId)
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'linear-gradient(135deg, rgba(30, 136, 229, 0.9), rgba(255, 61, 87, 0.9))',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        cursor: createEventDate.isPending || !dateForm.fecha || (parents.length > 1 && !selectedParentId) ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 16px rgba(30, 136, 229, 0.3)',
                        opacity: createEventDate.isPending || !dateForm.fecha || (parents.length > 1 && !selectedParentId) ? 0.6 : 1
                      }}
                    >
                      {createEventDate.isPending ? '⏳ Creando...' : '✨ Crear'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {parents && parents.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="org-events-grid"
                >
                  {parents.map((parent: any, index: number) => (
                    <motion.div
                      key={parent.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                    >
                      <EventParentCard
                        parent={parent}
                        onDelete={handleDeleteEvent}
                        isDeleting={deleteParent.isPending}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {/* Efecto decorativo de fondo */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(255, 61, 87, 0.1) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }} />

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(255, 61, 87, 0.2), rgba(255, 140, 66, 0.2))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                      margin: '0 auto 1.5rem',
                      boxShadow: '0 8px 32px rgba(255, 61, 87, 0.4)',
                      border: '2px solid rgba(255, 61, 87, 0.3)',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    🎭
                  </motion.div>
                  <h3 style={{
                    fontSize: '1.6rem',
                    fontWeight: '800',
                    marginBottom: '0.75rem',
                    background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    No tienes sociales creados
                  </h3>
                  <p style={{
                    opacity: 0.9,
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    margin: '0 0 2rem 0',
                    color: 'rgba(255, 255, 255, 0.9)',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    Crea tu primer social para comenzar a organizar eventos
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/social/new')}
                    style={{
                      padding: '1rem 2rem',
                      borderRadius: '14px',
                      border: 'none',
                      background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
                      color: '#FFFFFF',
                      fontSize: '1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(255, 61, 87, 0.4)',
                      position: 'relative',
                      zIndex: 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🎉 Crear mi Primer Social
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
          {/* Botón Crear Evento (movido a cabecera, se elimina el flotante) */}
 {/* Información para Asistentes */}
 <div className="org-editor-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
              💬 Información para Asistentes
            </h2>

            <div className="org-editor-grid">
              <div>
                <label className="org-editor-field">
                  🎵 ¿Qué música tocarán?
                </label>
                <textarea
                  value={form.respuestas.musica_tocaran}
                  onChange={(e) => setNested('respuestas.musica_tocaran', e.target.value)}
                  placeholder="Describe el tipo de música que tocarán..."
                  rows={3}
                  className="org-editor-textarea"
                />
              </div>

              <div>
                <label className="org-editor-field">
                  🅿️ ¿Hay estacionamiento?
                </label>
                <textarea
                  value={form.respuestas.hay_estacionamiento}
                  onChange={(e) => setNested('respuestas.hay_estacionamiento', e.target.value)}
                  placeholder="Información sobre estacionamiento..."
                  rows={3}
                  className="org-editor-textarea"
                />
              </div>
            </div>
          </div>

          {/* Mis ubicaciones reutilizables (editor independiente para organizador con misma UX que academia) */}
          <div className="org-editor-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
              📍 Mis ubicaciones
            </h2>
            <OrganizerUbicacionesEditor organizerId={org?.id} />
          </div>

          {/* Sección de Fotos */}
          <PhotoManagementSection
            media={media}
            uploading={uploading}
            uploadFile={uploadFile}
            removeFile={removeFile}
            title="📷 Gestión de Fotos"
            description="La foto P1 se mostrará como tu avatar principal en el banner del perfil"
            slots={['p1']}
            isMainPhoto={true}
          />

          {/* Sección de Fotos Adicionales */}
          <PhotoManagementSection
            media={media}
            uploading={uploading}
            uploadFile={uploadFile}
            removeFile={removeFile}
            title="📷 Fotos Adicionales (p4-p10)"
            description="Estas fotos aparecerán en la galería de tu perfil"
            slots={['p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']}
            isMainPhoto={false}
          />

          {/* Sección de Videos */}
          <VideoManagementSection
            media={media}
            uploading={uploading}
            uploadFile={uploadFile}
            removeFile={removeFile}
            title="🎥 Gestión de Videos"
            description="Los videos aparecerán en la sección de videos de tu perfil"
            slots={['v1', 'v2', 'v3']}
          />

          {/* Estado y Acciones - Solo mostrar si el perfil ya existe */}
          {!isNewProfile && (
            <div className="org-editor-card">
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
                ⚙️ Estado y Acciones
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                  Estado: {getEstadoBadge()}
                </span>
              </div>

              {org.estado_aprobacion === "borrador" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitForReview}
                  disabled={submit.isPending}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: submit.isPending ? `${colors.light}33` : colors.blue,
                    color: colors.light,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: submit.isPending ? 'not-allowed' : 'pointer',
                    boxShadow: `0 4px 16px ${colors.blue}66`,
                  }}
                >
                  {submit.isPending ? '⏳ Enviando...' : '📤 Enviar para Revisión'}
                </motion.button>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}