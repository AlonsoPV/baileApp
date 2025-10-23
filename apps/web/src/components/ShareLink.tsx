/**
 * Botón para copiar link público al portapapeles
 * Útil en vistas LIVE para compartir contenido
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareLinkProps {
  /** URL a copiar (por defecto usa window.location.href) */
  url?: string;
  /** Texto del botón */
  label?: string;
  /** Callback cuando se copia exitosamente */
  onCopy?: () => void;
  /** Clases CSS personalizadas */
  className?: string;
  /** Variante del botón */
  variant?: 'default' | 'gradient' | 'icon-only';
}

export default function ShareLink({ 
  url, 
  label = "Compartir",
  onCopy,
  className,
  variant = 'gradient'
}: ShareLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const linkToCopy = url || window.location.href;
    
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      onCopy?.();
      
      // Reset después de 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error al copiar al portapapeles:", error);
      // Fallback para navegadores antiguos
      try {
        const textArea = document.createElement("textarea");
        textArea.value = linkToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error("Error en fallback:", fallbackError);
      }
    }
  };

  // Variante con gradiente moderno
  if (variant === 'gradient' && !className) {
    return (
      <motion.button
        onClick={handleCopy}
        className="relative inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl font-bold text-base text-white overflow-hidden group"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.98 }}
        title={copied ? "¡Copiado!" : "Compartir enlace"}
        style={{
          background: copied 
            ? 'rgb(34 197 94 / 55%)' // verde cuando copiado
            : 'linear-gradient(135deg, rgb(59 130 246 / 55%), rgb(147 51 234 / 55%))', // azul-púrpura
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '0.5rem 1rem',
          opacity: 1,
          transform: 'none',
          backdropFilter: 'blur(10px)',
          boxShadow: 'rgba(0, 0, 0, 0.3) 0px 8px 24px, rgba(255, 255, 255, 0.1) 0px 1px 0px inset'
        }}
      >
        {/* Efecto de brillo en hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%', opacity: 0 }}
          whileHover={{ 
            x: '100%', 
            opacity: 1,
            transition: { duration: 0.6, ease: "easeInOut" }
          }}
        />
        
        {/* Contenido */}
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div 
              key="copied"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <span className="text-2xl">✓</span>
              <span>¡Copiado!</span>
            </motion.div>
          ) : (
            <motion.div 
              key="share"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <span className="text-2xl">🔗</span>
              <span>{label}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Partículas decorativas */}
        {copied && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="absolute top-2 right-4 w-2 h-2 bg-white/60 rounded-full"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute bottom-3 left-6 w-1 h-1 bg-white/40 rounded-full"
            />
          </>
        )}
      </motion.button>
    );
  }

  // Variante icon-only
  if (variant === 'icon-only') {
    return (
      <motion.button
        onClick={handleCopy}
        className="relative inline-flex items-center justify-center w-12 h-12 rounded-xl overflow-hidden"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        title={copied ? "¡Copiado!" : "Compartir"}
        style={{
          background: copied 
            ? 'rgb(34 197 94 / 55%)'
            : 'linear-gradient(135deg, rgb(59 130 246 / 55%), rgb(147 51 234 / 55%))',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'rgba(0, 0, 0, 0.3) 0px 8px 24px, rgba(255, 255, 255, 0.1) 0px 1px 0px inset'
        }}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className="text-2xl"
            >
              ✓
            </motion.span>
          ) : (
            <motion.span
              key="link"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className="text-2xl"
            >
              🔗
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // Variante default (si se proporciona className personalizada)
  const baseClassName = className || 
    "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-800 border border-white/10 hover:bg-neutral-700 hover:border-white/20 transition-all duration-200";

  return (
    <button
      onClick={handleCopy}
      className={baseClassName}
      title={copied ? "¡Copiado!" : "Copiar enlace"}
    >
      {copied ? (
        <>
          <span>✓</span>
          <span>¡Copiado!</span>
        </>
      ) : (
        <>
          <span>🔗</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

/**
 * Variante con icono visible (usa la nueva variante icon-only)
 */
export function ShareLinkIcon({ 
  url, 
  onCopy,
  className 
}: Omit<ShareLinkProps, 'label'>) {
  return (
    <ShareLink 
      url={url}
      onCopy={onCopy}
      className={className}
      variant="icon-only"
    />
  );
}

