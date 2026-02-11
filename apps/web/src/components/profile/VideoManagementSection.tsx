import React from 'react';
import { getMediaBySlot } from '../../utils/mediaSlots';

interface VideoManagementSectionProps {
  media: any;
  uploading: Record<string, boolean>;
  removing?: Record<string, boolean>;
  uploadFile: (file: File, slot: string, type: 'photo' | 'video') => void;
  removeFile: (slot: string) => void;
  title: string;
  description: string;
  slots: string[];
}

const colors = {
  light: '#F5F5F5',
};

export const VideoManagementSection: React.FC<VideoManagementSectionProps> = ({
  media,
  uploading,
  removing = {},
  uploadFile,
  removeFile,
  title,
  description,
  slots
}) => {
  return (
    <>
      <style>{`
        .video-section-container {
          margin-bottom: 3rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .video-section-title {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: ${colors.light};
        }
        .video-section-description {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1.5rem;
          font-style: italic;
        }
        .video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .video-item {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          width: 100%;
          box-sizing: border-box;
        }
        .video-item-title {
          font-size: 1rem;
          margin-bottom: 1rem;
          color: ${colors.light};
        }
        .video-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
        }
        .video-container video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .video-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .video-button {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          flex: 1 1 auto;
          min-width: 120px;
          text-align: center;
          border: none;
        }
        .video-button-upload {
          background: #2196F3;
          color: white;
        }
        .video-button-delete {
          background: #f44336;
          color: white;
        }
        @media (max-width: 768px) {
          .video-section-container {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 12px !important;
          }
          .video-section-title {
            font-size: 1.2rem !important;
            margin-bottom: 0.75rem !important;
          }
          .video-section-description {
            font-size: 0.85rem !important;
            margin-bottom: 1rem !important;
          }
          .video-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .video-item {
            padding: 0.75rem !important;
            max-width: 100% !important;
          }
          .video-item-title {
            font-size: 0.95rem !important;
            margin-bottom: 0.75rem !important;
          }
          .video-container {
            max-width: 100% !important;
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .video-section-container {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 10px !important;
          }
          .video-section-title {
            font-size: 1.1rem !important;
            margin-bottom: 0.5rem !important;
          }
          .video-section-description {
            font-size: 0.8rem !important;
            margin-bottom: 0.75rem !important;
          }
          .video-item {
            padding: 0.5rem !important;
          }
          .video-item-title {
            font-size: 0.9rem !important;
            margin-bottom: 0.5rem !important;
          }
          .video-container {
            aspect-ratio: 16/9 !important;
          }
          .video-button {
            min-width: 100px !important;
            padding: 0.4rem 0.8rem !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>
      <div className="video-section-container">
        <h2 className="video-section-title">
          {title}
        </h2>
        
        <p className="video-section-description">
          💡 <strong>Tip:</strong> {description}
        </p>
        
        <div className="video-grid">
          {slots.map((slot) => (
            <div key={slot} className="video-item">
              <h3 className="video-item-title">
                🎥 Video {slot.toUpperCase()}
              </h3>
              
              <div className="video-container">
                {getMediaBySlot(media, slot) ? (
                  <video
                    src={getMediaBySlot(media, slot)!.url}
                    controls
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
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
                    🎥 Sin video
                  </div>
                )}
              </div>
              
              <div className="video-buttons">
                <label className="video-button video-button-upload" style={{ opacity: uploading[slot] ? 0.8 : 1, cursor: uploading[slot] ? 'not-allowed' : 'pointer' }}>
                  {uploading[slot] ? '⏳ Subiendo...' : '📤 Subir Video'}
                  <input
                    type="file"
                    accept="video/*"
                    style={{ display: 'none' }}
                    disabled={uploading[slot]}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && !uploading[slot]) uploadFile(file, slot, 'video');
                    }}
                  />
                </label>
                
                {getMediaBySlot(media, slot) && (
                  <button
                    type="button"
                    disabled={!!removing[slot]}
                    onClick={() => removeFile(slot)}
                    className="video-button video-button-delete"
                    style={{ opacity: removing[slot] ? 0.8 : 1, cursor: removing[slot] ? 'not-allowed' : 'pointer' }}
                  >
                    {removing[slot] ? '⏳ Eliminando...' : '🗑️ Eliminar'}
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
