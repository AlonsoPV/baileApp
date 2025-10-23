import React from 'react';
import { getMediaBySlot } from '../../utils/mediaSlots';

interface VideoManagementSectionProps {
  media: any;
  uploading: Record<string, boolean>;
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
  uploadFile,
  removeFile,
  title,
  description,
  slots
}) => {
  return (
    <div style={{
      marginBottom: '3rem',
      padding: '2rem',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
        {title}
      </h2>
      
      <p style={{ 
        fontSize: '0.9rem', 
        color: 'rgba(255, 255, 255, 0.6)', 
        marginBottom: '1.5rem',
        fontStyle: 'italic'
      }}>
        💡 <strong>Tip:</strong> {description}
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {slots.map((slot) => (
          <div key={slot} style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: colors.light }}>
              🎥 Video {slot.toUpperCase()}
            </h3>
            
            <div style={{
              aspectRatio: '16/9',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '1rem',
              border: '2px solid rgba(255, 255, 255, 0.1)',
            }}>
              {getMediaBySlot(media, slot) ? (
                <video
                  src={getMediaBySlot(media, slot)!.url}
                  controls
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
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
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{
                padding: '0.5rem 1rem',
                background: '#2196F3',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {uploading[slot] ? '⏳ Subiendo...' : '📤 Subir Video'}
                <input
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file, slot, 'video');
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
                    fontWeight: '600'
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
