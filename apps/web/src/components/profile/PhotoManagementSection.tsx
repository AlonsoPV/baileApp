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
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMainPhoto 
          ? 'repeat(auto-fit, minmax(300px, 450px))' 
          : 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: isMainPhoto ? '2rem' : '1.5rem',
        justifyContent: isMainPhoto ? 'center' : 'start'
      }}>
        {slots.map((slot) => (
          <div key={slot} style={{
            padding: isMainPhoto ? '1.5rem' : '1rem',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}>
            <h3 style={{ 
              fontSize: isMainPhoto ? '1.1rem' : '1rem', 
              marginBottom: isMainPhoto ? '0.5rem' : '1rem', 
              color: colors.light 
            }}>
              {isMainPhoto ? '👤 Avatar / Foto Principal (p1)' : `📷 Foto ${slot.toUpperCase()}`}
            </h3>
            
            {isMainPhoto && (
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255, 255, 255, 0.5)', 
                marginBottom: '1rem' 
              }}>
                Se mostrará en el banner de tu perfil
              </p>
            )}
            
            <div style={{
              aspectRatio: isMainPhoto ? '1/1' : '4/3',
              width: isMainPhoto ? '450px' : '100%',
              maxWidth: '100%',
              height: isMainPhoto ? '450px' : undefined,
              borderRadius: isMainPhoto ? '50%' : '8px',
              overflow: 'hidden',
              marginBottom: '1rem',
              border: '2px solid rgba(255, 255, 255, 0.1)',
            }}>
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
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{
                padding: '0.5rem 1rem',
                background: '#4CAF50',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600'
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
                    fontWeight: '600'
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
  );
};
