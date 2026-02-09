import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEventRSVP } from "../hooks/useRSVP";

interface SimpleInterestButtonProps {
  eventDateId: number;
}

export default function SimpleInterestButton({ eventDateId }: SimpleInterestButtonProps) {
  const { userStatus, updateRSVP, isUpdating } = useEventRSVP(eventDateId);
  
  const isInterested = userStatus === 'interesado';

  const handleClick = async () => {
    try {
      await updateRSVP('interesado');
    } catch (error) {
      console.error('Error updating interest:', error);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isUpdating}
      className="relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: isInterested 
          ? 'rgb(34 197 94 / 60%)' // verde cuando interesado
          : 'rgb(234 179 8 / 55%)', // amarillo por defecto
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1rem 2rem',
        opacity: isUpdating ? 0.5 : 1,
        transform: 'none',
        backdropFilter: 'blur(10px)',
        boxShadow: isInterested
          ? 'rgba(34, 197, 94, 0.3) 0px 12px 32px, rgba(255, 255, 255, 0.1) 0px 1px 0px inset'
          : 'rgba(234, 179, 8, 0.3) 0px 12px 32px, rgba(255, 255, 255, 0.1) 0px 1px 0px inset'
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
        {isUpdating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
            />
            <span>Actualizando...</span>
          </motion.div>
        ) : isInterested ? (
          <motion.div 
            key="interested"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <span className="text-3xl">✅</span>
            <span>¡Me interesa!</span>
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="text-2xl"
            >
              ✨
            </motion.span>
          </motion.div>
        ) : (
          <motion.div 
            key="not-interested"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -180 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <span className="text-3xl">🤔</span>
            <span>Me interesa</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partículas decorativas cuando está interesado */}
      {isInterested && (
        <>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, delay: 0.1, repeat: Infinity, repeatDelay: 2 }}
            className="absolute top-3 right-6 w-2 h-2 bg-white/70 rounded-full"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, delay: 0.3, repeat: Infinity, repeatDelay: 2 }}
            className="absolute bottom-4 left-8 w-1.5 h-1.5 bg-white/50 rounded-full"
          />
        </>
      )}
    </motion.button>
  );
}

export function InterestCounter({ eventDateId }: { eventDateId: number }) {
  const { stats, isLoading } = useEventRSVP(eventDateId);

  if (isLoading) {
    return (
      <div className="text-white text-sm opacity-70">
        Cargando...
      </div>
    );
  }

  const count = stats?.total_interesado ?? stats?.interesado ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 24px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <span style={{ fontSize: '1.5rem' }}>👥</span>
      <div style={{ textAlign: 'left' }}>
        <motion.div 
          key={count}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'white',
            lineHeight: 1
          }}
        >
          {count}
        </motion.div>
        <div style={{
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginTop: '4px'
        }}>
          {count === 1 ? 'persona interesada' : 'personas interesadas'}
        </div>
      </div>
    </motion.div>
  );
}

