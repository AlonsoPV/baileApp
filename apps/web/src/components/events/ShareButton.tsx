import React from "react";
import { motion } from "framer-motion";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface ShareButtonProps {
  url: string;
  title?: string;
  text?: string;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

export default function ShareButton({
  url,
  title,
  text,
  style,
  className,
  children
}: ShareButtonProps) {
  const onShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          url,
          title: title || 'Compartir evento',
          text: text || '¡Mira este evento!'
        });
      } catch (error) {
        // Usuario canceló o error, no hacer nada
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(url);
        alert("Enlace copiado al portapapeles");
      } catch (error) {
        // Fallback final: mostrar URL
        alert(`Compartir: ${url}`);
      }
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onShare}
      style={{
        padding: '12px 24px',
        borderRadius: '25px',
        border: 'none',
        background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
        color: colors.light,
        fontSize: '1rem',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)',
        transition: 'all 0.2s ease',
        ...style
      }}
      className={className}
    >
      {children || (
        <>
          <span>📤</span>
          <span>Compartir</span>
        </>
      )}
    </motion.button>
  );
}
