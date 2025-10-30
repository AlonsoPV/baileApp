import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer, useUpsertMyOrganizer, useSubmitOrganizerForReview } from "../../hooks/useOrganizer";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
import { useParentsByOrganizer } from "../../hooks/useEvents";
import { MediaUploader } from "../../components/MediaUploader";
import { MediaGrid } from "../../components/MediaGrid";
import { useToast } from "../../components/Toast";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export const OrganizerEditor: React.FC = () => {
  const navigate = useNavigate();
  const { data: organizer, isLoading } = useMyOrganizer();
  const upsertMutation = useUpsertMyOrganizer();
  const submitMutation = useSubmitOrganizerForReview();
  const { media, add, remove } = useOrganizerMedia();
  const { data: events } = useParentsByOrganizer(organizer?.id);
  const { showToast } = useToast();

  const [nombrePublico, setNombrePublico] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (organizer) {
      setNombrePublico(organizer.nombre_publico || '');
      setBio(organizer.bio || '');
    }
  }, [organizer]);

  const handleSave = async () => {
    if (!nombrePublico.trim()) {
      showToast('El nombre público es obligatorio', 'error');
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        nombre_publico: nombrePublico,
        bio: bio || null,
      });

      showToast('Organizador actualizado exitosamente ✅', 'success');
    } catch (err: any) {
      showToast('Error al guardar', 'error');
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await submitMutation.mutateAsync();
      showToast('Enviado a revisión ✅', 'success');
    } catch (err: any) {
      showToast('Error al enviar a revisión', 'error');
    }
  };

  const getEstadoBadge = () => {
    if (!organizer) return null;
    
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      borrador: { bg: '#94A3B8', text: 'Borrador', icon: '📝' },
      en_revision: { bg: colors.orange, text: 'En Revisión', icon: '⏳' },
      aprobado: { bg: '#10B981', text: 'Verificado', icon: '✅' },
      rechazado: { bg: colors.coral, text: 'Rechazado', icon: '❌' },
    };

    const badge = badges[organizer.estado_aprobacion] || badges.borrador;

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

  if (isLoading) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>Cargando organizador...</p>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
          No tienes perfil de organizador
        </h2>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>
          Crea uno para organizar eventos
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            try {
              await upsertMutation.mutateAsync({
                nombre_publico: 'Mi Organizador',
                bio: '',
                media: [],
              });
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
          ✨ Crear Perfil de Organizador
        </motion.button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      color: colors.light,
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>
          🎤 Editar Organizador
        </h1>
        {getEstadoBadge()}
      </div>

      {/* Nombre Público */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Nombre Público *
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
          }}
        />
      </div>

      {/* Bio */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Biografía
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
          }}
        />
      </div>

      {/* Galería de Fotos y Videos */}
      <div style={{ marginTop: '32px', marginBottom: '32px' }}>
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
                await add.mutateAsync({ file: f, slot: 'p1' });
                showToast('Media agregada ✅', 'success');
              } catch (err: any) {
                showToast('Error al subir archivo', 'error');
                console.error(err);
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

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={upsertMutation.isPending}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px',
            borderRadius: '50px',
            border: 'none',
            background: upsertMutation.isPending 
              ? `${colors.light}33` 
              : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '700',
            cursor: upsertMutation.isPending ? 'not-allowed' : 'pointer',
            boxShadow: `0 8px 24px ${colors.blue}66`,
          }}
        >
          {upsertMutation.isPending ? 'Guardando...' : '💾 Guardar'}
        </motion.button>

        {organizer.estado_aprobacion === 'borrador' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmitForReview}
            disabled={submitMutation.isPending}
            style={{
              padding: '16px 24px',
              borderRadius: '50px',
              border: 'none',
              background: submitMutation.isPending ? `${colors.light}33` : colors.orange,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: submitMutation.isPending ? 'not-allowed' : 'pointer',
              boxShadow: `0 8px 24px ${colors.orange}66`,
            }}
          >
            {submitMutation.isPending ? 'Enviando...' : '📤 Enviar a Revisión'}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/profile/organizer')}
          style={{
            padding: '16px 24px',
            borderRadius: '50px',
            border: `2px solid ${colors.light}33`,
            background: 'transparent',
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          👁️ Live
        </motion.button>
      </div>

      {/* Mis Eventos */}
      {organizer.estado_aprobacion === 'aprobado' && (
        <div
          style={{
            padding: '24px',
            background: `${colors.dark}ee`,
            borderRadius: '16px',
            border: `1px solid ${colors.light}22`,
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
              📅 Mis Eventos ({events?.length || 0})
            </h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile/organizer/events/new')}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                border: 'none',
                background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
                color: colors.light,
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${colors.coral}66`,
              }}
            >
              + Nuevo Evento
            </motion.button>
          </div>

          {events && events.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              {events.map((evento) => (
                <motion.div
                  key={evento.id}
                  whileHover={{ scale: 1.01, x: 4 }}
                  onClick={() => navigate(`/events/parent/${evento.id}`)}
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
                        {evento.nombre}
                      </h4>
                      {evento.descripcion && (
                        <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: '0 0 8px 0' }}>
                          {evento.descripcion.slice(0, 100)}{evento.descripcion.length > 100 && '...'}
                        </p>
                      )}
                      {evento.sede_general && (
                        <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>
                          📍 {evento.sede_general}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: '1.5rem' }}>→</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', opacity: 0.5, padding: '32px' }}>
              No has creado eventos aún
            </p>
          )}
        </div>
      )}
    </div>
  );
};
