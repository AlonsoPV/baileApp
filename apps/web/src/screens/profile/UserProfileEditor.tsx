import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useUserMediaSlots } from '../../hooks/useUserMediaSlots';
import { useHydratedForm } from '../../hooks/useHydratedForm';
import { supabase } from '../../lib/supabase';
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot, upsertMediaSlot, removeMediaSlot, MediaItem } from '../../utils/mediaSlots';
import ImageWithFallback from '../../components/ImageWithFallback';
import { useToast } from '../../components/Toast';
import { Chip } from '../../components/profile/Chip';
import { useTags } from '../../hooks/useTags';
import { PhotoManagementSection } from '../../components/profile/PhotoManagementSection';
import { VideoManagementSection } from '../../components/profile/VideoManagementSection';
import { ProfileNavigationToggle } from '../../components/profile/ProfileNavigationToggle';

const colors = {
  dark: '#121212',
  light: '#F5F5F5',
  grad: 'linear-gradient(135deg, #FF4D4D, #FFB200 35%, #2D9CDB 70%, #FFE056)',
};

export default function UserProfileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfileFields } = useUserProfile();
  const { media, uploadToSlot, removeFromSlot } = useUserMediaSlots();
  const { showToast } = useToast();
  
  // Cargar tags
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter(tag => tag.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter(tag => tag.tipo === 'zona') || [];

  // Usar formulario hidratado con borrador persistente
  const { form, setField, setNested, setAll, hydrated } = useHydratedForm({
    draftKey: "draft:user:profile",
    serverData: profile,
    defaults: {
      user_id: user?.id || "",
      display_name: "",
      bio: "",
      ritmos: [] as number[],
      zonas: [] as number[],
      redes_sociales: {
        instagram: "",
        tiktok: "",
        youtube: "",
        facebook: "",
        whatsapp: ""
      },
      respuestas: {
        dato_curioso: "",
        gusta_bailar: ""
      }
    },
    preferDraft: true
  });

  // Estados para carga
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  // Función para subir archivo
  const uploadFile = async (file: File, slot: string, kind: "photo" | "video") => {
    if (!user) return;
    
    setUploading(prev => ({ ...prev, [slot]: true }));
    
    try {
      await uploadToSlot.mutateAsync({ file, slot, kind });
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
      await removeFromSlot.mutateAsync(slot);
      showToast('Archivo eliminado', 'success');
    } catch (error) {
      console.error('Error removing file:', error);
      showToast('Error al eliminar el archivo', 'error');
    }
  };

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
      await updateProfileFields(form);
      showToast('Perfil actualizado ✅', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Error al guardar', 'error');
    }
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
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
            ✏️ Editar Perfil
          </h1>
          <div style={{ width: '100px' }}></div>
        </div>

        {/* Componente de navegación flotante */}
        <ProfileNavigationToggle
          currentView="edit"
          profileType="user"
          onSave={handleSave}
          isSaving={false}
          saveDisabled={!form.display_name?.trim()}
        />

        {/* Información Personal */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            👤 Información Personal
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Nombre de Usuario
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setField('display_name', e.target.value)}
                placeholder="Tu nombre de usuario"
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
                value={form.bio}
                onChange={(e) => setField('bio', e.target.value)}
                placeholder="Cuéntanos sobre ti..."
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
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            🎵 Ritmos y Zonas
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: colors.light }}>
                🎶 Ritmos que Bailas
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
                📍 Zonas donde Bailas
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
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
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
                placeholder="@tu_usuario"
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
                🎵 TikTok
              </label>
              <input
                type="text"
                value={form.redes_sociales.tiktok}
                onChange={(e) => setNested('redes_sociales.tiktok', e.target.value)}
                placeholder="@tu_usuario"
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
                📺 YouTube
              </label>
              <input
                type="text"
                value={form.redes_sociales.youtube}
                onChange={(e) => setNested('redes_sociales.youtube', e.target.value)}
                placeholder="Canal o enlace"
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
                placeholder="Perfil o página"
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

        {/* Preguntas Personalizadas */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            💬 Preguntas Personalizadas
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                🎭 ¿Cuál es tu dato curioso favorito?
              </label>
              <textarea
                value={form.respuestas.dato_curioso}
                onChange={(e) => setNested('respuestas.dato_curioso', e.target.value)}
                placeholder="Comparte algo interesante sobre ti..."
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
                💃 ¿Qué te gusta más del baile?
              </label>
              <textarea
                value={form.respuestas.gusta_bailar}
                onChange={(e) => setNested('respuestas.gusta_bailar', e.target.value)}
                placeholder="Cuéntanos qué te apasiona del baile..."
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
      </div>
    </div>
  );
}
