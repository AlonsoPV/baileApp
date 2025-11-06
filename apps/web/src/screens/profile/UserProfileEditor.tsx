import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useUserMediaSlots } from '../../hooks/useUserMediaSlots';
import { useHydratedForm } from '../../hooks/useHydratedForm';
import { supabase } from '../../lib/supabase';
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot, upsertMediaSlot, removeMediaSlot, MediaItem } from '../../utils/mediaSlots';
import ImageWithFallback from '../../components/ImageWithFallback';
import { useToast } from '../../components/Toast';
import { Chip } from '../../components/profile/Chip';
import RitmosSelectorEditor from '@/components/profile/RitmosSelectorEditor';
import { RITMOS_CATALOG } from '@/lib/ritmosCatalog';
import { useTags } from '../../hooks/useTags';
import { PhotoManagementSection } from '../../components/profile/PhotoManagementSection';
import { VideoManagementSection } from '../../components/profile/VideoManagementSection';
import { ProfileNavigationToggle } from '../../components/profile/ProfileNavigationToggle';
import { normalizeSocialInput } from '../../utils/social';
import { buildSafePatch } from '../../utils/safePatch';
import { useQueryClient } from '@tanstack/react-query';
import { getDraftKey } from '../../utils/draftKeys';
import { useRoleChange } from '../../hooks/useRoleChange';

const colors = {
  dark: '#121212',
  light: '#F5F5F5',
  grad: 'linear-gradient(135deg, #FF4D4D, #FFB200 35%, #2D9CDB 70%, #FFE056)',
};

export default function UserProfileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfileFields, refetchProfile } = useUserProfile();
  const { media, uploadToSlot, removeFromSlot } = useUserMediaSlots();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  // Manejar cambio de roles
  useRoleChange();
  
  // Cargar tags
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter(tag => tag.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter(tag => tag.tipo === 'zona') || [];

  // Usar formulario hidratado con borrador persistente (namespace por usuario y rol)
  const { form, setField, setNested, setAll, setFromServer, hydrated, dirty } = useHydratedForm({
    draftKey: getDraftKey(user?.id, 'user'),
    serverData: profile as any,
    defaults: {
      display_name: "",
      bio: "",
      ritmos_seleccionados: [] as string[],
      ritmos: [] as number[],
      zonas: [] as number[],
      respuestas: {
        redes: {
          instagram: "",
          tiktok: "",
          youtube: "",
          facebook: "",
          whatsapp: ""
        },
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

  const toggleZona = (id: number) => {
    const newZonas = form.zonas.includes(id) 
      ? form.zonas.filter(z => z !== id) 
      : [...form.zonas, id];
    setField('zonas', newZonas);
  };

  // Ritmos: usar componente unificado que guarda catálogo y mapea a tags

  // Función para guardar con normalización y rehidratación confiable
  const handleSave = async () => {
    try {
      // Normalizar redes sociales (convertir "" a null)
      const redes = normalizeSocialInput(form.respuestas?.redes || {});
      
      console.log('[UserProfileEditor] Form data antes del guardado:', form);
      console.log('[UserProfileEditor] Respuestas:', form.respuestas);
      console.log('[UserProfileEditor] Redes normalizadas:', redes);
      
      // Fallback: si no hay ritmos_seleccionados pero sí hay ritmos numéricos, mapear a catálogo por etiqueta
      let outRitmosSeleccionados = ((form as any).ritmos_seleccionados || []) as string[];
      if ((!outRitmosSeleccionados || outRitmosSeleccionados.length === 0) && Array.isArray(form.ritmos) && form.ritmos.length > 0) {
        const labelToItemId = new Map<string, string>();
        RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelToItemId.set(i.label, i.id)));
        const names = form.ritmos
          .map(id => ritmoTags.find(t => t.id === id)?.nombre)
          .filter(Boolean) as string[];
        const mapped = names
          .map(n => labelToItemId.get(n))
          .filter(Boolean) as string[];
        if (mapped.length > 0) outRitmosSeleccionados = mapped;
      }

      const candidate = {
        display_name: form.display_name,
        bio: form.bio,
        ritmos_seleccionados: outRitmosSeleccionados || [],
        ritmos: form.ritmos,
        zonas: form.zonas,
        respuestas: { 
          redes,
          dato_curioso: form.respuestas?.dato_curioso || null,
          gusta_bailar: form.respuestas?.gusta_bailar || null
        },
      };
      
      console.log('[UserProfileEditor] Candidate construido:', candidate);

      // Crear patch inteligente
      const patch = buildSafePatch(profile || {}, candidate, { 
        allowEmptyArrays: ["ritmos_seleccionados", "ritmos", "zonas"] as any 
      });

      console.log('[UserProfileEditor] Patch generado:', patch);
      console.log('[UserProfileEditor] Candidate:', candidate);

      if (Object.keys(patch).length === 0) {
        showToast('No hay cambios para guardar', 'info');
        return;
      }

      await updateProfileFields(patch);
      
      // Refetch y sincronizar draft con datos frescos del servidor
      const fresh = await refetchProfile();
      if (fresh) {
        setFromServer(fresh as any); // sincroniza draft y form con server
      }
      
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
    <>
      <style>{`
        .editor-container {
          min-height: 100vh;
          background: ${colors.dark};
          color: ${colors.light};
          padding: 2rem;
        }
        .editor-content {
          max-width: 1200px;
          margin: 0 auto;
        }
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .editor-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          flex: 1 1 0%;
          text-align: center;
        }
        .editor-back-btn {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          color: ${colors.light};
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
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
        }
        .editor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        .editor-grid-small {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .editor-field {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
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
        }
        .editor-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .editor-subsection-title {
          font-size: 1.2rem;
          margin-bottom: 1rem;
          color: ${colors.light};
        }
        
        .glass-card-container {
          opacity: 1;
          margin-bottom: 2rem;
          padding: 2rem;
          text-align: center;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px;
          backdrop-filter: blur(10px);
          transform: none;
        }
        
        @media (max-width: 768px) {
          .editor-container {
            padding: 1rem !important;
          }
          .editor-content {
            max-width: 100% !important;
          }
          .editor-header {
            flex-direction: column !important;
            gap: 1rem !important;
            text-align: center !important;
          }
          .editor-title {
            font-size: 1.5rem !important;
            order: 2 !important;
          }
          .editor-back-btn {
            order: 1 !important;
            align-self: flex-start !important;
          }
          .editor-section {
            padding: 1rem !important;
            margin-bottom: 2rem !important;
          }
          .editor-section-title {
            font-size: 1.25rem !important;
            margin-bottom: 1rem !important;
          }
          .editor-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .editor-grid-small {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .info-redes-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          .editor-subsection-title {
            font-size: 1.1rem !important;
            margin-bottom: 0.75rem !important;
          }
          .editor-chips {
            justify-content: center !important;
          }
          .glass-card-container {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            border-radius: 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          .editor-title {
            font-size: 1.25rem !important;
          }
          .editor-section-title {
            font-size: 1.1rem !important;
          }
          .editor-subsection-title {
            font-size: 1rem !important;
          }
          .glass-card-container {
            padding: 0.75rem !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
      <div className="editor-container">
        <div className="editor-content">
        {/* Header con botón Volver */}
        <div className="editor-header">
          <button
            onClick={() => navigate(-1)}
            className="editor-back-btn"
          >
            ← Volver
          </button>
          <h1 className="editor-title">
            ✏️ Editar Perfil
          </h1>
          <div style={{ width: '100px' }}></div>
        </div>

        {/* Componente de navegación flotante */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
          <ProfileNavigationToggle
            currentView="edit"
            profileType="user"
            onSave={handleSave}
            isSaving={false}
            saveDisabled={!form.display_name?.trim()}
          />
        </div>

        {/* Información Personal y Redes Sociales */}
        <div className="editor-section glass-card-container">
          <h2 className="editor-section-title">
            👤 Información Personal y Redes Sociales
          </h2>
          
          {/* Layout de 2 columnas: Info Personal | Redes Sociales */}
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
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setField('display_name', e.target.value)}
                  placeholder="Tu nombre de usuario"
                  className="editor-input"
                />
              </div>
              
              <div>
                <label className="editor-field">
                  Biografía
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                  placeholder="Cuéntanos sobre ti..."
                  rows={6}
                  className="editor-textarea"
                />
              </div>
            </div>

            {/* Columna 2: Redes Sociales */}
            <div>
              <h3 className="editor-subsection-title" style={{ marginBottom: '1rem', marginTop: 0 }}>
                📱 Redes Sociales
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="editor-field" style={{ fontSize: '0.85rem' }}>
                    📸 Instagram
                  </label>
                  <input
                    type="text"
                    value={form.respuestas?.redes?.instagram || ''}
                    onChange={(e) => setNested('respuestas.redes.instagram', e.target.value)}
                    placeholder="@usuario"
                    className="editor-input"
                    style={{ padding: '0.6rem' }}
                  />
                </div>
                
                <div>
                  <label className="editor-field" style={{ fontSize: '0.85rem' }}>
                    🎵 TikTok
                  </label>
                  <input
                    type="text"
                    value={form.respuestas?.redes?.tiktok || ''}
                    onChange={(e) => setNested('respuestas.redes.tiktok', e.target.value)}
                    placeholder="@usuario"
                    className="editor-input"
                    style={{ padding: '0.6rem' }}
                  />
                </div>
                
                <div>
                  <label className="editor-field" style={{ fontSize: '0.85rem' }}>
                    📺 YouTube
                  </label>
                  <input
                    type="text"
                    value={form.respuestas?.redes?.youtube || ''}
                    onChange={(e) => setNested('respuestas.redes.youtube', e.target.value)}
                    placeholder="@canal"
                    className="editor-input"
                    style={{ padding: '0.6rem' }}
                  />
                </div>
                
                <div>
                  <label className="editor-field" style={{ fontSize: '0.85rem' }}>
                    👥 Facebook
                  </label>
                  <input
                    type="text"
                    value={form.respuestas?.redes?.facebook || ''}
                    onChange={(e) => setNested('respuestas.redes.facebook', e.target.value)}
                    placeholder="perfil"
                    className="editor-input"
                    style={{ padding: '0.6rem' }}
                  />
                </div>
                
                <div>
                  <label className="editor-field" style={{ fontSize: '0.85rem' }}>
                    💬 WhatsApp
                  </label>
                  <input
                    type="text"
                    value={form.respuestas?.redes?.whatsapp || ''}
                    onChange={(e) => setNested('respuestas.redes.whatsapp', e.target.value)}
                    placeholder="+52..."
                    className="editor-input"
                    style={{ padding: '0.6rem' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ritmos y Zonas */}
        <div className="editor-section glass-card-container">
          <h2 className="editor-section-title">
            🎵 Ritmos y Zonas
          </h2>
          
          <div className="editor-grid">
            <div>
              <h3 className="editor-subsection-title">
                🎶 Ritmos que Bailas
              </h3>
              <div style={{ textAlign: 'left' }}>
                <RitmosSelectorEditor
                  selected={(((form as any)?.ritmos_seleccionados) || []) as string[]}
                  ritmoTags={ritmoTags}
                  setField={setField as any}
                />
              </div>
            </div>
            
            <div>
              <h3 className="editor-subsection-title">
                📍 Zonas donde Bailas
              </h3>
              <div className="editor-chips">
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

        {/* Preguntas Personalizadas */}
        <div className="editor-section glass-card-container">
          <h2 className="editor-section-title">
            💬 Preguntas Personalizadas
          </h2>
          
          <div className="editor-grid">
            <div>
              <label className="editor-field">
                🎭 ¿Cuál es tu dato curioso favorito?
              </label>
              <textarea
                value={form.respuestas?.dato_curioso || ''}
                onChange={(e) => {
                  console.log('[UserProfileEditor] Cambiando dato_curioso:', e.target.value);
                  setNested('respuestas.dato_curioso', e.target.value);
                }}
                placeholder="Comparte algo interesante sobre ti..."
                rows={3}
                className="editor-textarea"
              />
            </div>
            
            <div>
              <label className="editor-field">
                💃 ¿Qué te gusta más del baile?
              </label>
              <textarea
                value={form.respuestas?.gusta_bailar || ''}
                onChange={(e) => {
                  console.log('[UserProfileEditor] Cambiando gusta_bailar:', e.target.value);
                  setNested('respuestas.gusta_bailar', e.target.value);
                }}
                placeholder="Cuéntanos qué te apasiona del baile..."
                rows={3}
                className="editor-textarea"
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

        {/* Secciones destacadas (p2 - p3) */}
        <PhotoManagementSection
          media={media}
          uploading={uploading}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="📷 Fotos Destacadas (p2 - p3)"
          description="Estas fotos se usan en las secciones destacadas de tu perfil"
          slots={['p2', 'p3']}
          isMainPhoto={false}
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
    </>
  );
}
