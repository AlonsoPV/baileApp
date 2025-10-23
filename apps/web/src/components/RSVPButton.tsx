import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventRSVP, RSVPStatus } from '../hooks/useRSVP';

interface RSVPButtonProps {
  eventDateId: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const RSVP_OPTIONS: Array<{
  status: RSVPStatus;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  hoverColor: string;
  shadowColor: string;
}> = [
  {
    status: 'asistire',
    label: 'Asistiré',
    icon: '✅',
    color: 'text-white',
    bgColor: 'rgb(34 197 94 / 55%)', // green-500 con 55% opacity
    hoverColor: 'hover:bg-green-500/60',
    shadowColor: 'rgba(34, 197, 94, 0.3)'
  },
  {
    status: 'interesado',
    label: 'Lo pienso',
    icon: '🤔',
    color: 'text-white',
    bgColor: 'rgb(234 179 8 / 55%)', // yellow-500 con 55% opacity
    hoverColor: 'hover:bg-yellow-500/60',
    shadowColor: 'rgba(234, 179, 8, 0.3)'
  },
  {
    status: 'no_asistire',
    label: 'No voy',
    icon: '❌',
    color: 'text-white',
    bgColor: 'rgb(239 68 68 / 55%)', // red-500 con 55% opacity
    hoverColor: 'hover:bg-red-500/60',
    shadowColor: 'rgba(239, 68, 68, 0.3)'
  }
];

export default function RSVPButton({ 
  eventDateId, 
  className = '',
  size = 'md',
  showLabels = true 
}: RSVPButtonProps) {
  const { userStatus, updateRSVP, removeRSVP, isUpdating } = useEventRSVP(eventDateId);
  const [isExpanded, setIsExpanded] = useState(false);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  const handleRSVP = async (status: RSVPStatus) => {
    try {
      if (userStatus === status) {
        // Si ya tiene ese estado, lo removemos
        await removeRSVP();
      } else {
        // Si no tiene ese estado, lo actualizamos
        await updateRSVP(status);
      }
      setIsExpanded(false);
    } catch (error) {
      console.error('Error updating RSVP:', error);
      // El error se maneja en el hook, pero podemos mostrar feedback visual
    }
  };

  const currentOption = RSVP_OPTIONS.find(opt => opt.status === userStatus);

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isUpdating}
        className={`
          ${sizeClasses[size]}
          ${currentOption ? currentOption.bgColor : 'bg-gradient-to-r from-neutral-700/50 to-neutral-800/50'}
          ${currentOption ? currentOption.color : 'text-neutral-300'}
          border border-white/20 rounded-xl
          hover:border-white/30 transition-all duration-300
          flex items-center gap-3 font-semibold
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg hover:shadow-xl
          backdrop-blur-sm
        `}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: currentOption ? 
            `linear-gradient(135deg, ${currentOption.bgColor.replace('/20', '/30')}, ${currentOption.bgColor.replace('/20', '/50')})` :
            'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
          boxShadow: currentOption ? 
            `0 8px 32px ${currentOption.bgColor.replace('/20', '/20')}` :
            '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        {isUpdating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            />
            <span>Actualizando...</span>
          </>
        ) : (
          <>
            <span className="text-lg">
              {currentOption ? currentOption.icon : '📅'}
            </span>
            {showLabels && (
              <span>
                {currentOption ? currentOption.label : 'RSVP'}
              </span>
            )}
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs"
            >
              ▼
            </motion.span>
          </>
        )}
      </motion.button>

      {/* Menú desplegable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.4, 0, 0.2, 1],
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-64 bg-neutral-900/98 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl z-50"
            style={{
              boxShadow: `
                0 25px 50px rgba(0, 0, 0, 0.5),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.1) 0%, 
                  rgba(255, 255, 255, 0.05) 50%,
                  rgba(0, 0, 0, 0.2) 100%
                )
              `
            }}
          >
            {/* Header del menú */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-sm">📅</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Selecciona tu respuesta</h3>
                  <p className="text-xs text-neutral-400">¿Cómo te sientes con este evento?</p>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-2">
              {RSVP_OPTIONS.map((option, index) => (
                <motion.button
                  key={option.status}
                  onClick={() => handleRSVP(option.status)}
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                  className={`
                    w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl
                    transition-all duration-400 text-center group
                    ${userStatus === option.status ? 'ring-2 ring-white/50 shadow-2xl scale-105' : 'hover:scale-105 hover:shadow-xl'}
                    relative overflow-hidden
                  `}
                  whileHover={{ 
                    y: -3,
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: option.bgColor,
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '0.5rem',
                    opacity: 1,
                    transform: 'none',
                    backdropFilter: 'blur(10px)',
                    boxShadow: userStatus === option.status ? 
                      `rgba(0, 0, 0, 0.3) 0px 8px 24px, rgba(255, 255, 255, 0.1) 0px 1px 0px inset, 0 0 0 1px ${option.shadowColor}` : 
                      'rgba(0, 0, 0, 0.3) 0px 8px 24px, rgba(255, 255, 255, 0.1) 0px 1px 0px inset'
                  }}
                >
                  {/* Efecto de brillo animado */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%', opacity: 0 }}
                    whileHover={{ 
                      x: '100%', 
                      opacity: 1,
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }}
                  />
                  
                  {/* Efecto de partículas en hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    initial={{ scale: 0 }}
                    whileHover={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full animate-ping" />
                    <div className="absolute bottom-3 left-4 w-1 h-1 bg-white/20 rounded-full animate-pulse" />
                  </motion.div>
                  
                  {/* Diseño unificado como botón principal */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <span className={`font-bold text-lg ${option.color}`}>
                      {option.label}
                    </span>
                    {userStatus === option.status && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        className="text-lg"
                      >
                        ✨
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
              
              {userStatus && (
                <>
                  <div className="border-t border-white/20 my-4" />
                  <motion.button
                    onClick={() => handleRSVP(userStatus)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all duration-400 text-center group hover:scale-105"
                    whileHover={{ 
                      y: -3,
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: 'rgb(239 68 68 / 55%)', // red-500 con 55% opacity
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: '0.5rem',
                      opacity: 1,
                      transform: 'none',
                      backdropFilter: 'blur(10px)',
                      boxShadow: 'rgba(0, 0, 0, 0.3) 0px 8px 24px, rgba(255, 255, 255, 0.1) 0px 1px 0px inset'
                    }}
                  >
                    {/* Contenido simplificado */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🗑️</span>
                      <span className="font-bold text-lg text-white">
                        Quitar RSVP
                      </span>
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                        className="text-lg"
                      >
                        ⚠️
                      </motion.div>
                    </div>
                  </motion.button>
                </>
              )}
            </div>

            {/* Footer del menú */}
            <div className="px-6 py-3 border-t border-white/10 bg-neutral-800/30 rounded-b-3xl">
              <div className="text-xs text-neutral-400 text-center">
                💡 Puedes cambiar tu respuesta en cualquier momento
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay para cerrar al hacer clic fuera */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
