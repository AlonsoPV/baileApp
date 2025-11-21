import React from 'react';
import { PHOTO_SLOTS, getMediaBySlot } from '../../utils/mediaSlots';
import ImageWithFallback from '../ImageWithFallback';

interface PhotoManagementSectionProps {
  media: any;
  uploading: Record<string, boolean>;
  uploadFile: (file: File, slot: string, type: 'photo' | 'video') => void;
  removeFile: (slot: string) => void;
  title: string;
  description: string;
  slots: string[];
  isMainPhoto?: boolean;
}

const colors = {
  light: '#F5F5F5',
};

export const PhotoManagementSection: React.FC<PhotoManagementSectionProps> = ({
  media,
  uploading,
  uploadFile,
  removeFile,
  title,
  description,
  slots,
  isMainPhoto = false
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
        .photo-item {
          padding: 0.875rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
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
        }
        .photo-container-main {
          aspect-ratio: 1/1;
          width: 380px;
          max-width: 100%;
          height: 380px;
          border-radius: 50%;
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
          .photo-item {
            padding: 1rem;
          }
          .photo-item-main {
            padding: 1.5rem;
          }
          .photo-container-main {
            width: 400px;
            height: 400px;
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
        
        <div className={`photo-grid ${isMainPhoto ? 'photo-grid-main' : 'photo-grid-regular'}`}>
          {slots.map((slot) => (
            <div key={slot} className={`photo-item ${isMainPhoto ? 'photo-item-main' : ''}`}>
              <h3 className={`photo-item-title ${isMainPhoto ? 'photo-item-title-main' : ''}`}>
                {isMainPhoto ? '👤 Avatar / Foto Principal (p1)' : `📷 Foto ${slot.toUpperCase()}`}
              </h3>
              
              {isMainPhoto && (
                <p className="photo-item-hint">
                  Se mostrará en el banner de tu perfil
                </p>
              )}
              
              <div className={`photo-container ${isMainPhoto ? 'photo-container-main' : ''}`}>
              {getMediaBySlot(media, slot) ? (
                <ImageWithFallback
                  src={getMediaBySlot(media, slot)!.url}
                  alt={isMainPhoto ? "Foto principal" : `Foto ${slot}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: isMainPhoto ? 'cover' : 'contain',
                    objectPosition: isMainPhoto ? 'center top' : 'center'
                  }}
                />
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
                  background: '#4CAF50',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  flex: '1 1 auto',
                  minWidth: '120px',
                  textAlign: 'center'
                }}>
                  {uploading[slot] ? '⏳ Subiendo...' : (isMainPhoto ? '📤 Subir Foto' : '📤 Subir')}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(file, slot, 'photo');
                    }}
                  />
                </label>
                
                {getMediaBySlot(media, slot) && (
                  <button
                    onClick={() => removeFile(slot)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      flex: '1 1 auto',
                      minWidth: '120px'
                    }}
                  >
                    {isMainPhoto ? '🗑️ Eliminar' : '🗑️'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
