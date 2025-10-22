import React from "react";
import { motion } from "framer-motion";
import { MediaItem } from "../lib/storage";

const colors = {
  coral: '#FF3D57',
  dark: '#121212',
  light: '#F5F5F5',
};

export function MediaGrid({ items, onRemove }:{
  items: MediaItem[];
  onRemove?: (id:string) => void;
}) {
  if (!items || items.length === 0) {
    return (
      <div
        style={{
          padding: '48px',
          textAlign: 'center',
          opacity: 0.5,
          color: colors.light,
        }}
      >
        <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</p>
        <p style={{ fontSize: '0.9rem' }}>Sin fotos o videos</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '12px',
      }}
    >
      {items.map((m) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          style={{
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            aspectRatio: '1',
            background: `${colors.dark}aa`,
          }}
        >
          {m.type === "image" ? (
            <img 
              src={m.url} 
              alt="Media"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <video 
              src={m.url} 
              controls={false} 
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
          
          {onRemove && (
            <motion.button
              initial={{ opacity: 0.7 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('¿Estás seguro de eliminar esta foto/video?')) {
                  onRemove(m.id);
                }
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: `${colors.coral}`,
                color: colors.light,
                fontSize: '1.2rem',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: `2px solid ${colors.light}`,
                cursor: 'pointer',
                fontWeight: '700',
                boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
                transition: 'all 0.2s ease',
              }}
              title="Eliminar"
            >
              🗑️
            </motion.button>
          )}
        </motion.div>
      ))}
    </div>
  );
}
