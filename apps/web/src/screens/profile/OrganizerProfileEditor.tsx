import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer, useUpsertMyOrganizer, useSubmitOrganizerForReview } from "../../hooks/useOrganizer";
import { useParentsByOrganizer, useDeleteParent, useDatesByParent } from "../../hooks/useEvents";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '2rem',
        borderRadius: '20px',
        border: '2px solid rgba(255, 61, 87, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(255, 61, 87, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)'
      }}
      onClick={handleSocialClick}
      whileHover={{
        y: -6,
        scale: 1.02,
        boxShadow: '0 16px 40px rgba(255, 61, 87, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Efecto de brillo en hover */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        transition: 'left 0.6s ease',
        zIndex: 1
      }} />
      {/* Header del social */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: '0 4px 12px rgba(255, 61, 87, 0.3)'
            }}>
              🎭
            </div>
            <h4 style={{
              fontSize: '1.4rem',
              fontWeight: '800',
              margin: 0,
              color: colors.light,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {parent.nombre}
            </h4>
          </div>
          {parent.descripcion && (
            <p style={{
              fontSize: '1rem',
              opacity: 0.9,
              marginBottom: '1rem',
              fontWeight: '500',
              lineHeight: 1.5,
              color: colors.light
            }}>
              {parent.descripcion}
            </p>
          )}
          <div style={{
            fontSize: '0.85rem',
            opacity: 0.8,
            color: colors.blue,
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.5rem 0.75rem',
            background: 'rgba(30, 136, 229, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(30, 136, 229, 0.2)',
            width: 'fit-content'
          }}>
            <span>👁️</span>
            Click para ver el social
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 2 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/social/${parent.id}/edit`);
            }}
            style={{
              padding: '0.75rem 1.25rem',
              color: colors.light,
              border: '2px solid rgba(30, 136, 229, 0.3)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(30, 136, 229, 0.2)',
              backdropFilter: 'blur(10px)'
            }}
          >
            ✏️ Editar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
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
                : 'linear-gradient(135deg, rgba(255, 61, 87, 0.2), rgba(255, 140, 66, 0.2))',
              color: colors.light,
              border: isDeleting
                ? '2px solid rgba(255, 255, 255, 0.2)'
                : '2px solid rgba(255, 61, 87, 0.3)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1,
              transition: 'all 0.3s ease',
              boxShadow: isDeleting
                ? 'none'
                : '0 4px 16px rgba(255, 61, 87, 0.2)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {isDeleting ? '⏳' : '🗑️'} Eliminar
          </motion.button>
        </div>
      </div>

      {/* Fechas del social */}
      {dates && dates.length > 0 && (
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              color: colors.light,
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: expanded ? '12px' : '0',
              padding: '8px 0',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <span>📅 {dates.length} fecha{dates.length > 1 ? 's' : ''}</span>
            <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              ▼
            </span>
          </button>

          {expanded && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '16px',
              border: '1px solid rgba(30, 136, 229, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {dates.map((date: any, index: number) => {
                // Debug log para cada fecha
                console.log('[EventParentCard] Date item:', date);
                console.log('[EventParentCard] Date nombre:', date.nombre);
                console.log('[EventParentCard] Date fecha:', date.fecha);
                
                return (
                  <motion.div 
                    key={date.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/social/fecha/${date.id}`);
                    }}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: '2px solid rgba(30, 136, 229, 0.2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 24px rgba(30, 136, 229, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                    whileHover={{ 
                      y: -4,
                      scale: 1.02,
                      boxShadow: '0 16px 40px rgba(30, 136, 229, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
                      borderColor: 'rgba(30, 136, 229, 0.4)'
                    }}
                  >
                    {/* Efecto de brillo en hover */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      transition: 'left 0.6s ease',
                      zIndex: 1
                    }} />
                    
                    <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                      {/* Header con icono y nombre */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)'
                        }}>
                          📅
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: colors.light, lineHeight: 1.2 }}>
                          {date.nombre || 'Fecha sin nombre'}
                        </div>
                      </div>
                      
                      {/* Información de la fecha */}
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: colors.blue,
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(30, 136, 229, 0.1)',
                        borderRadius: '10px',
                        border: '1px solid rgba(30, 136, 229, 0.2)',
                        width: 'fit-content'
                      }}>
                        <span>📅</span>
                        {new Date(date.fecha).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      
                      {/* Hora */}
                      {date.hora_inicio && date.hora_fin && (
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: colors.light,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '0.5rem',
                          padding: '0.4rem 0.6rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          width: 'fit-content'
                        }}>
                          <span>🕐</span>
                          {date.hora_inicio} - {date.hora_fin}
                        </div>
                      )}
                      
                      {/* Lugar */}
                      {date.lugar && (
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: colors.light,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '0.5rem',
                          padding: '0.4rem 0.6rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          width: 'fit-content'
                        }}>
                          <span>📍</span>
                          {date.lugar}
                        </div>
                      )}
                      
                      {/* Ciudad */}
                      {date.ciudad && (
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: colors.light,
                          opacity: 0.8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '0.75rem',
                          padding: '0.3rem 0.5rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                          width: 'fit-content'
                        }}>
                          <span>🏙️</span>
                          {date.ciudad}
                        </div>
                      )}
                      
                      {/* CTA */}
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: colors.blue,
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.4rem 0.6rem',
                        background: 'rgba(30, 136, 229, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(30, 136, 229, 0.2)',
                        width: 'fit-content',
                        transition: 'all 0.2s ease'
                      }}>
                        <span>👁️</span>
                        Click para ver detalles
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, position: 'relative', zIndex: 2 }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/social/fecha/${date.id}/edit`);
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          color: colors.light,
                          border: '2px solid rgba(30, 136, 229, 0.3)',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(30, 136, 229, 0.2)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        ✏️ Editar
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implementar eliminación de fecha
                          console.log('Eliminar fecha:', date.id);
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          color: colors.light,
                          border: '2px solid rgba(255, 61, 87, 0.3)',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(255, 61, 87, 0.2)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        🗑️ Eliminar
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function OrganizerProfileEditor() {
  const navigate = useNavigate();
  const { data: org, isLoading } = useMyOrganizer();
  const upsert = useUpsertMyOrganizer();
  const submit = useSubmitOrganizerForReview();
  const { data: parents } = useParentsByOrganizer(org?.id);
  const deleteParent = useDeleteParent();
  const { media, add, remove } = useOrganizerMedia();
  const { showToast } = useToast();

  // Estados para carga de media
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

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
      console.log("📍 [OrganizerProfileEditor] Zonas:", form.zonas);
      console.log("💬 [OrganizerProfileEditor] Respuestas:", form.respuestas);

      await upsert.mutateAsync(form);
      console.log("✅ [OrganizerProfileEditor] Guardado exitoso");
      showToast('Organizador actualizado ✅', 'success');
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
      await deleteParent.mutateAsync(Number(parentId));
      showToast('Evento eliminado', 'success');
    } catch (err: any) {
      console.error('Error deleting event:', err);
      showToast('Error al eliminar evento', 'error');
    }
  };

  // Función para obtener badge de estado
  const getEstadoBadge = () => {
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      borrador: { bg: '#94A3B8', text: 'Borrador', icon: '📝' },
      en_revision: { bg: colors.orange, text: 'En Revisión', icon: '⏳' },
      aprobado: { bg: '#10B981', text: 'Aprobado', icon: '✅' },
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

  if (!org) {
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
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <div>No se encontró el perfil del organizador</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: colors.light,
        padding: '2rem',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header con botón Volver */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                color: colors.light,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              ← Volver
            </button>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              margin: '0',
              flex: '1 1 0%',
              textAlign: 'center'
            }}>
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

          {/* Información del Organizador */}
          <div
            id="organizer-basic-info"
            data-test-id="organizer-basic-info"
            style={{
              marginBottom: '3rem',
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
              🏢 Información del Organizador
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Nombre Público
                </label>
                <input
                  id="organizer-name-input"
                  data-test-id="organizer-name-input"
                  type="text"
                  value={form.nombre_publico}
                  onChange={(e) => setField('nombre_publico', e.target.value)}
                  placeholder="Nombre de tu organización"
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
                  Biografía
                </label>
                <textarea
                  id="organizer-bio-input"
                  data-test-id="organizer-bio-input"
                  value={form.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                  placeholder="Cuéntanos sobre tu organización..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: colors.light,
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Ritmos y Zonas */}
          <div
            id="organizer-rhythms-zones"
            data-test-id="organizer-rhythms-zones"
            style={{
              marginBottom: '3rem',
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
              🎵 Ritmos y Zonas
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: colors.light }}>
                  🎶 Ritmos que Organizas
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ritmoTags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.nombre}
                      active={form.ritmos.includes(tag.id)}
                      onClick={() => toggleRitmo(tag.id)}
                      variant="ritmo"
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: colors.light }}>
                  📍 Zonas donde Organizas
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
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
          <InvitedMastersSection
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
          />

          {/* Información para Asistentes */}
          <div style={{
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
              💬 Información para Asistentes
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  🎵 ¿Qué música tocarán?
                </label>
                <textarea
                  value={form.respuestas.musica_tocaran}
                  onChange={(e) => setNested('respuestas.musica_tocaran', e.target.value)}
                  placeholder="Describe el tipo de música que tocarán..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: colors.light,
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  🅿️ ¿Hay estacionamiento?
                </label>
                <textarea
                  value={form.respuestas.hay_estacionamiento}
                  onChange={(e) => setNested('respuestas.hay_estacionamiento', e.target.value)}
                  placeholder="Información sobre estacionamiento..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: colors.light,
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mis Eventos */}
          <div
            id="organizer-events-list"
            data-test-id="organizer-events-list"
            style={{
              marginBottom: '3rem',
              padding: '2.5rem',
              borderRadius: '24px',
              border: '2px solid rgba(255, 61, 87, 0.2)',
              boxShadow: '0 12px 40px rgba(255, 61, 87, 0.15), 0 4px 16px rgba(0, 0, 0, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  boxShadow: '0 8px 24px rgba(255, 61, 87, 0.4)'
                }}>
                  🎭
                </div>
                <div>
                  <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: '800',
                    margin: 0,
                    color: colors.light,
                    background: 'linear-gradient(135deg, #FF3D57 0%, #FF8C42 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
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

              {parents && parents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {parents.map((parent: any) => (
                    <EventParentCard
                      key={parent.id}
                      parent={parent}
                      onDelete={handleDeleteEvent}
                      isDeleting={deleteParent.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  borderRadius: '20px',
                  border: '2px solid rgba(255, 61, 87, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 12px 32px rgba(255, 61, 87, 0.3)'
                  }}>
                    🎭
                  </div>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    marginBottom: '0.75rem',
                    color: colors.light,
                    
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    No tienes sociales creados
                  </h3>
                  <p style={{
                    opacity: 0.8,
                    fontSize: '1rem',
                    fontWeight: '500',
                    margin: 0
                  }}>
                    Crea tu primer social para comenzar a organizar eventos
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Botón Discreto: Crear Evento - Centro Abajo */}
          <div
            id="organizer-create-event-button"
            data-test-id="organizer-create-event-button"
            style={{
              position: 'fixed',
              bottom: '32px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              pointerEvents: 'auto',
            }}
          >
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/social/new')}
              style={{
                padding: '12px 24px',
                borderRadius: '25px',
                background: `${colors.dark}dd`,
                backdropFilter: 'blur(10px)',
                color: colors.light,
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: `1px solid ${colors.light}33`,
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>📅</span>
              Crear Evento
            </motion.button>
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

          {/* Estado y Acciones */}
          <div style={{
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
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

        </div>
      </div>
    </>
  );
}