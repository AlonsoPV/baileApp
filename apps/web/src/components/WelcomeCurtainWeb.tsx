import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWelcomeCurtainWeb } from '../hooks/useWelcomeCurtainWeb';

// URL del logo desde Supabase Storage
const LOGO_URL = 'https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/icono%20(2).png';

/**
 * Cortina de bienvenida para web que se muestra solo en cold start
 * 
 * Características:
 * - Cubre 100% del viewport útil
 * - NO oculta ni modifica la navbar
 * - Logo centrado
 * - Botón de cierre abajo-centro
 * - Animaciones suaves con Framer Motion
 * - Color de fondo igual al de la navbar (gradiente)
 */
export function WelcomeCurtainWeb() {
  const { shouldShow, isReady, markAsSeen } = useWelcomeCurtainWeb();
  const [isVisible, setIsVisible] = useState(false);

  // Mostrar después de un pequeño delay
  useEffect(() => {
    if (shouldShow && isReady) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, isReady]);

  // Función para cerrar con animación
  const handleClose = () => {
    setIsVisible(false);
    // Esperar a que termine la animación antes de marcar como visto
    setTimeout(() => {
      markAsSeen();
    }, 300);
  };

  // No renderizar si no debe mostrarse o no está listo
  if (!shouldShow || !isReady) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
        >
          {/* Fondo con color de navbar (gradiente) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(229, 57, 53, 0.78) 0%, rgba(251, 140, 0, 0.72) 100%)',
            }}
          />

          {/* Contenido centrado */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px',
            }}
          >
            {/* Logo centrado */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 50,
                damping: 7,
                delay: 0.1,
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '80px',
              }}
            >
              <img
                src={LOGO_URL}
                alt="Logo Dónde Bailar"
                style={{
                  width: '120px',
                  height: '120px',
                  filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.22))',
                  objectFit: 'contain',
                }}
              />
            </motion.div>

            {/* Botón de cierre abajo-centro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
              }}
            >
              <button
                onClick={handleClose}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '28px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                aria-label="Cerrar cortina de bienvenida"
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      width: '20px',
                      height: '2px',
                      backgroundColor: '#fff',
                      borderRadius: '1px',
                      transform: 'rotate(45deg)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      width: '20px',
                      height: '2px',
                      backgroundColor: '#fff',
                      borderRadius: '1px',
                      transform: 'rotate(-45deg)',
                    }}
                  />
                </div>
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

