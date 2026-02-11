import React from 'react';
import { PHOTO_SLOTS, getMediaBySlot } from '../../utils/mediaSlots';
import ImageWithFallback from '../ImageWithFallback';
import { getDisplayImageUrl } from '../../utils/storageUrl';

interface PhotoManagementSectionProps {
  media: any;
  uploading: Record<string, boolean>;
  removing?: Record<string, boolean>;
  uploadFile: (file: File, slot: string, type: 'photo' | 'video') => void;
  removeFile: (slot: string) => void;
  title: string;
  description: string;
  slots: string[];
  isMainPhoto?: boolean;
  verticalLayout?: boolean;
  /** Cache-busting: profile.updated_at o similar para evitar imagen vieja tras replace */
  imageVersion?: string | number;
}

const colors = {
  light: '#F5F5F5',
};

export const PhotoManagementSection: React.FC<PhotoManagementSectionProps> = ({
  media,
  uploading,
  removing = {},
  uploadFile,
  removeFile,
  title,
  description,
  slots,
  isMainPhoto = false,
  verticalLayout = false,
  imageVersion,
}) => {
  return (
    <>
      <style>{`
        .photo-section-container {
          margin-bottom: 2.5rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .photo-section-title {
          font-size: 1.35rem;
          margin-bottom: 1rem;
          color: ${colors.light};
        }
        .photo-section-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1.25rem;
          font-style: italic;
        }
        .photo-grid {
          display: grid;
          gap: 1.25rem;
        }
        .photo-grid-main {
          grid-template-columns: repeat(auto-fit, minmax(280px, 380px));
          gap: 1.5rem;
          justify-content: center;
        }
        .photo-grid-regular {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
        }
        .photo-grid-vertical {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          flex: 1;
          height: 100%;
          min-height: 0;
        }
        .photo-item {
          padding: 0.875rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          flex-direction: column;
        }
        .photo-item-vertical {
          flex: 1 1 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .photo-item-main {
          padding: 1.25rem;
        }
        .photo-item-title {
          font-size: 0.95rem;
          margin-bottom: 0.75rem;
          color: ${colors.light};
        }
        .photo-item-title-main {
          font-size: 1.05rem;
          margin-bottom: 0.5rem;
        }
        .photo-item-hint {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.875rem;
        }
        .photo-container {
          aspect-ratio: 4/3;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 0.875rem;
          border: 2px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }
        .photo-container-vertical {
          flex: 1;
          min-height: 0;
          aspect-ratio: unset;
          width: 100%;
          height: 100%;
          margin-bottom: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .photo-container-main {
          aspect-ratio: 1/1;
          width: 100%;
          max-width: 350px;
          height: auto;
          border-radius: 50%;
          margin: 0 auto;
        }
        
        /* Desktop optimizations */
        @media (min-width: 1024px) {
          .photo-section-container {
            padding: 1.75rem 2rem;
            margin-bottom: 2.5rem;
          }
          .photo-section-title {
            font-size: 1.4rem;
            margin-bottom: 1rem;
          }
          .photo-section-description {
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
          }
          .photo-grid-main {
            grid-template-columns: repeat(auto-fit, minmax(300px, 400px));
            gap: 2rem;
          }
          .photo-grid-regular {
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
          }
          .photo-grid-vertical {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            flex: 1;
            height: 100%;
            min-height: 0;
          }
          .photo-item {
            padding: 1rem;
          }
          .photo-item-main {
            padding: 1.5rem;
          }
          .photo-container-main {
            width: 100%;
            max-width: 350px;
            height: auto;
          }
        }
        
        @media (max-width: 768px) {
          .photo-section-container {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 12px !important;
          }
          .photo-section-title {
            font-size: 1.2rem !important;
            margin-bottom: 0.75rem !important;
          }
          .photo-section-description {
            font-size: 0.85rem !important;
            margin-bottom: 1rem !important;
          }
          .photo-grid-main {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .photo-grid-regular {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .photo-grid-vertical {
            display: flex !important;
            flex-direction: column !important;
            gap: 1rem !important;
            flex: 1 !important;
            height: 100% !important;
            min-height: 0 !important;
          }
          .photo-item {
            padding: 0.75rem !important;
          }
          .photo-item-main {
            padding: 1rem !important;
          }
          .photo-item-title {
            font-size: 0.95rem !important;
            margin-bottom: 0.5rem !important;
          }
          .photo-item-title-main {
            font-size: 1rem !important;
            margin-bottom: 0.4rem !important;
          }
          .photo-item-hint {
            font-size: 0.7rem !important;
            margin-bottom: 0.75rem !important;
          }
          .photo-container-main {
            width: 100% !important;
            max-width: 280px !important;
            height: auto !important;
            aspect-ratio: 1/1 !important;
            margin: 0 auto !important;
          }
        }
        @media (max-width: 480px) {
          .photo-section-container {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 10px !important;
          }
          .photo-section-title {
            font-size: 1.1rem !important;
            margin-bottom: 0.5rem !important;
          }
          .photo-section-description {
            font-size: 0.8rem !important;
            margin-bottom: 0.75rem !important;
          }
          .photo-item {
            padding: 0.5rem !important;
          }
          .photo-item-main {
            padding: 0.75rem !important;
          }
          .photo-item-title {
            font-size: 0.9rem !important;
            margin-bottom: 0.4rem !important;
          }
          .photo-item-title-main {
            font-size: 0.95rem !important;
          }
          .photo-item-hint {
            font-size: 0.65rem !important;
            margin-bottom: 0.5rem !important;
          }
          .photo-container-main {
            max-width: 240px !important;
          }
        }
      `}</style>
      <div className="photo-section-container">
        <h2 className="photo-section-title">
          {title}
        </h2>
        
        <p className="photo-section-description">
          💡 <strong>Tip:</strong> {description}
        </p>
        
        <div className={`photo-grid ${isMainPhoto ? 'photo-grid-main' : (verticalLayout ? 'photo-grid-vertical' : 'photo-grid-regular')}`}>
          {slots.map((slot) => {
            // Para foto principal, siempre usar el slot 'p1' específicamente
            // NO usar fallback a otras fotos (p2, p3, etc.) para evitar mostrar la última foto disponible
            const targetSlot = isMainPhoto ? 'p1' : slot;
            const mediaItem = isMainPhoto 
              ? getMediaBySlot(media, 'p1') // Solo buscar p1, sin fallback
              : getMediaBySlot(media, slot);
            
            // Debug: verificar que estamos usando el slot correcto
            if (isMainPhoto && process.env.NODE_ENV === 'development') {
              const allMedia = Array.isArray(media) ? media : [];
              const p1Item = allMedia.find((m: any) => m?.slot === 'p1');
              const p2Item = allMedia.find((m: any) => m?.slot === 'p2');
              const p3Item = allMedia.find((m: any) => m?.slot === 'p3');
              if (!p1Item && (p2Item || p3Item)) {
                console.warn('[PhotoManagementSection] ⚠️ isMainPhoto=true pero no se encontró slot p1. Media disponible:', {
                  total: allMedia.length,
                  slots: allMedia.map((m: any) => m?.slot),
                  p2: p2Item ? 'existe' : 'no existe',
                  p3: p3Item ? 'existe' : 'no existe'
                });
              }
            }
            
            return (
            <div key={slot} className={`photo-item ${isMainPhoto ? 'photo-item-main' : ''} ${verticalLayout ? 'photo-item-vertical' : ''}`}>
              <h3 className={`photo-item-title ${isMainPhoto ? 'photo-item-title-main' : ''}`}>
                {isMainPhoto ? '👤 Avatar / Foto Principal (p1)' : `📷 Foto ${slot.toUpperCase()}`}
              </h3>
              
              {isMainPhoto && (
                <p className="photo-item-hint">
                  Se mostrará en el banner de tu perfil
                </p>
              )}
              
              <div 
                className={`photo-container ${isMainPhoto ? 'photo-container-main' : ''} ${verticalLayout ? 'photo-container-vertical' : ''}`}
                style={isMainPhoto && mediaItem ? {
                  backgroundImage: `url(${getDisplayImageUrl(mediaItem.url, imageVersion)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  backgroundRepeat: 'no-repeat'
                } : {}}
              >
              {mediaItem ? (
                isMainPhoto ? (
                  // Para foto principal, la imagen se muestra como fondo del contenedor
                  null
                ) : (
                <ImageWithFallback
                    src={getDisplayImageUrl(mediaItem.url, imageVersion)}
                    alt={`Foto ${slot}`}
                  style={{
                    width: '100%',
                    height: '100%',
                      objectFit: verticalLayout ? 'contain' : 'cover',
                      objectPosition: 'center',
                    maxWidth: verticalLayout ? '100%' : 'none',
                    maxHeight: verticalLayout ? '100%' : 'none'
                  }}
                />
                )
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.875rem'
                }}>
                  📷 Sin foto
                </div>
              )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label style={{
                  padding: '0.5rem 1rem',
                  background: uploading[targetSlot] ? 'rgba(255,255,255,0.3)' : '#4CAF50',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: uploading[targetSlot] ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  flex: '1 1 auto',
                  minWidth: '120px',
                  textAlign: 'center',
                  opacity: uploading[targetSlot] ? 0.9 : 1,
                }}>
                  {uploading[targetSlot] ? '⏳ Subiendo...' : (isMainPhoto ? '📤 Subir Foto' : '📤 Subir')}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploading[targetSlot]}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && !uploading[targetSlot]) uploadFile(file, targetSlot, 'photo');
                    }}
                  />
                </label>
                
                {mediaItem && (
                  <button
                    type="button"
                    disabled={!!removing[targetSlot]}
                    onClick={() => removeFile(targetSlot)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: removing[targetSlot] ? 'rgba(200,100,100,0.7)' : '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: removing[targetSlot] ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      flex: '1 1 auto',
                      minWidth: '120px',
                      opacity: removing[targetSlot] ? 0.8 : 1,
                    }}
                  >
                    {removing[targetSlot] ? '⏳ Eliminando...' : (isMainPhoto ? '🗑️ Eliminar' : '🗑️')}
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
