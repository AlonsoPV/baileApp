import { motion } from 'framer-motion';
import { useState } from 'react';

interface GalleryGridProps {
  images: string[];
  onImageClick?: (index: number) => void;
}

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function GalleryGrid({ images, onImageClick }: GalleryGridProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
  };

  if (!images || images.length === 0) {
    return (
      <div
        style={{
          padding: '48px',
          textAlign: 'center',
          color: colors.light,
          opacity: 0.5,
        }}
      >
        <p style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>📸</p>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Sin fotos disponibles</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        padding: '16px',
      }}
    >
      {images.map((image, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: loadedImages.has(index) ? 1 : 0, 
            scale: loadedImages.has(index) ? 1 : 0.9 
          }}
          whileHover={{ scale: 1.02, zIndex: 10 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
          onClick={() => onImageClick?.(index)}
          style={{
            aspectRatio: '1',
            borderRadius: '16px',
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <img
            src={image}
            alt={`Gallery ${index + 1}`}
            onLoad={() => handleImageLoad(index)}
            onError={(e) => {
              e.currentTarget.src = '/placeholder-image.png';
              handleImageLoad(index);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          
          {/* Hover Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: `${colors.dark}66`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.light,
              fontSize: '1.5rem',
            }}
          >
            🔍
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
