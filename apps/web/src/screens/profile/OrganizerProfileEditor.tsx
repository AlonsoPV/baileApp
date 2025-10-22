import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer, useUpsertMyOrganizer, useSubmitOrganizerForReview } from "../../hooks/useOrganizer";
import { useParentsByOrganizer, useDeleteParent } from "../../hooks/useEvents";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
import { MediaUploader } from "../../components/MediaUploader";
import { MediaGrid } from "../../components/MediaGrid";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useToast } from "../../components/Toast";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function OrganizerProfileEditor() {
  const navigate = useNavigate();
  const { data: org, isLoading } = useMyOrganizer();
  const upsert = useUpsertMyOrganizer();
  const submit = useSubmitOrganizerForReview();
  const { data: parents } = useParentsByOrganizer(org?.id);
  const deleteParent = useDeleteParent();
  const { media, add, remove } = useOrganizerMedia();
  const { showToast } = useToast();

  const [nombrePublico, setNombrePublico] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (org) {
      setNombrePublico(org.nombre_publico || '');
      setBio(org.bio || '');
    }
  }, [org]);

  if (isLoading) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>
          Crear perfil de Organizador
        </h1>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>
          Comienza creando tu perfil básico
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            try {
              await upsert.mutateAsync({ nombre_publico: "Mi Organizador" });
              showToast('Organizador creado ✅', 'success');
            } catch (err: any) {
              showToast('Error al crear organizador', 'error');
            }
          }}
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
          ✨ Crear base
        </motion.button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!nombrePublico.trim()) {
      showToast('El nombre público es obligatorio', 'error');
      return;
    }

    try {
      await upsert.mutateAsync({
        nombre_publico: nombrePublico,
        bio: bio || null,
      });
      showToast('Organizador actualizado ✅', 'success');
    } catch (err: any) {
      showToast('Error al guardar', 'error');
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await submit.mutateAsync();
      showToast('Enviado a revisión ✅', 'success');
    } catch (err: any) {
      showToast('Error al enviar a revisión', 'error');
    }
  };

  const handleDeleteEvent = async (eventId: number, eventName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el evento "${eventName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      console.log('[OrganizerProfileEditor] Deleting event:', eventId, eventName);
      await deleteParent.mutateAsync(eventId);
      showToast('Evento eliminado correctamente', 'success');
      
      // Forzar refetch de la lista de eventos
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('[OrganizerProfileEditor] Error deleting event:', err);
      showToast(err.message || 'Error al eliminar evento', 'error');
    }
  };

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
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      color: colors.light,
    }}>
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/app/profile', icon: '🏠' },
          { label: 'Organizador', href: '/profile/organizer', icon: '🎤' },
          { label: 'Editar', icon: '✏️' },
        ]}
      />

      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '32px' }}>
        🎤 Editar Organizador
      </h1>

      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
        Nombre público *
      </label>
      <input
        type="text"
        value={nombrePublico}
        onChange={(e) => setNombrePublico(e.target.value)}
        required
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          background: `${colors.dark}cc`,
          border: `1px solid ${colors.light}33`,
          color: colors.light,
          fontSize: '1rem',
          marginBottom: '24px',
        }}
      />

      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
        Bio
      </label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={4}
        placeholder="Cuéntanos sobre ti como organizador..."
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          background: `${colors.dark}cc`,
          border: `1px solid ${colors.light}33`,
          color: colors.light,
          fontSize: '1rem',
          resize: 'vertical',
          marginBottom: '24px',
        }}
      />

      {/* Galería */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '700', 
          marginBottom: '16px',
        }}>
          📸 Fotos y Videos
        </h2>
        
        <MediaUploader 
          onPick={async (files) => {
            for (const f of Array.from(files)) {
              try {
                await add.mutateAsync(f);
                showToast('Media agregada ✅', 'success');
              } catch (err: any) {
                showToast('Error al subir archivo', 'error');
              }
            }
          }}
        />
        
        <div style={{ marginTop: '16px' }}>
          <MediaGrid 
            items={media} 
            onRemove={async (id) => {
              try {
                await remove.mutateAsync(id);
                showToast('Media eliminada', 'success');
              } catch (err: any) {
                showToast('Error al eliminar', 'error');
              }
            }}
          />
        </div>
      </div>

      {/* Estado y Actions */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        marginBottom: '32px',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
          Estado: {getEstadoBadge()}
        </span>
        
        {org.estado_aprobacion === "borrador" && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmitForReview}
            disabled={submit.isPending}
            style={{
              padding: '12px 24px',
              borderRadius: '50px',
              border: 'none',
              background: submit.isPending ? `${colors.light}33` : colors.blue,
              color: colors.light,
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: submit.isPending ? 'not-allowed' : 'pointer',
              boxShadow: `0 4px 16px ${colors.blue}66`,
            }}
          >
            {submit.isPending ? 'Enviando...' : '📤 Enviar a revisión'}
          </motion.button>
        )}
        
      </div>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={upsert.isPending}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '50px',
          border: 'none',
          background: upsert.isPending 
            ? `${colors.light}33` 
            : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
          color: colors.light,
          fontSize: '1rem',
          fontWeight: '700',
          cursor: upsert.isPending ? 'not-allowed' : 'pointer',
          boxShadow: `0 8px 24px ${colors.blue}66`,
          marginBottom: '32px',
        }}
      >
        {upsert.isPending ? 'Guardando...' : '💾 Guardar'}
      </motion.button>

      {/* Mis Eventos */}
      <div style={{
        padding: '24px',
        background: `${colors.dark}ee`,
        borderRadius: '16px',
        border: `1px solid ${colors.light}22`,
      }}>
        <div style={{ 
          marginBottom: '16px',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
            📅 Mis Eventos ({parents?.length || 0})
          </h2>
        </div>

        {parents && parents.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {parents.map((parent) => (
              <motion.div
                key={parent.id}
                whileHover={{ scale: 1.01, x: 4 }}
                onClick={() => navigate(`/events/parent/${parent.id}/edit`)}
                style={{
                  padding: '16px',
                  background: `${colors.dark}aa`,
                  borderRadius: '12px',
                  border: `1px solid ${colors.light}22`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '4px' }}>
                      {parent.nombre}
                    </h4>
                    {parent.descripcion && (
                      <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: '0 0 8px 0' }}>
                        {parent.descripcion.slice(0, 100)}{parent.descripcion.length > 100 && '...'}
                      </p>
                    )}
                    {parent.sede_general && (
                      <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>
                        📍 {parent.sede_general}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(parent.id, parent.nombre);
                      }}
                      disabled={deleteParent.isPending}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: 'none',
                        background: deleteParent.isPending ? '#666' : '#FF3D57',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: deleteParent.isPending ? 'not-allowed' : 'pointer',
                        opacity: deleteParent.isPending ? 0.7 : 1,
                      }}
                    >
                      {deleteParent.isPending ? '⏳ Eliminando...' : '🗑️ Eliminar'}
                    </button>
                    <span style={{ fontSize: '1.5rem' }}>→</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', opacity: 0.7, padding: '32px' }}>
            <p style={{ marginBottom: '8px', fontSize: '1.1rem' }}>No tienes eventos creados</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>
              Para crear eventos, ve al wizard de creación desde el menú principal
            </p>
          </div>
        )}
      </div>

    </div>
  );
}