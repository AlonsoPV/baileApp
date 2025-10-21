import React, { useRef } from "react";
import { motion } from "framer-motion";

const colors = {
  coral: '#FF3D57',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function MediaUploader({ onPick }:{ onPick:(files:FileList)=>void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => ref.current?.click()}
        type="button"
        style={{
          background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
          color: colors.light,
          padding: '12px 24px',
          borderRadius: '50px',
          border: 'none',
          fontSize: '0.95rem',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: `0 4px 16px ${colors.blue}66`,
        }}
      >
        📤 Subir foto/video
      </motion.button>
      
      <input
        ref={ref}
        type="file"
        accept="image/*,video/mp4,video/quicktime,video/webm"
        multiple
        hidden
        onChange={(e) => e.target.files && onPick(e.target.files)}
      />
      
      <p style={{ 
        fontSize: '0.75rem', 
        color: `${colors.light}99`,
        maxWidth: '300px',
      }}>
        Formatos: imagen (JPG, PNG, GIF, WebP), video (MP4, MOV, WebM)
      </p>
    </div>
  );
}
