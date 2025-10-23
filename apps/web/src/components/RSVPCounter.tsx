import React from 'react';
import { motion } from 'framer-motion';
import { useEventRSVPStats, RSVPStats } from '../hooks/useRSVP';

interface RSVPCounterProps {
  eventDateId: number;
  className?: string;
  variant?: 'compact' | 'detailed' | 'minimal';
  showIcons?: boolean;
  animated?: boolean;
}

const RSVP_STATS_CONFIG = [
  {
    key: 'asistire' as keyof RSVPStats,
    label: 'Asistirán',
    icon: '✅',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30'
  },
  {
    key: 'interesado' as keyof RSVPStats,
    label: 'Interesados',
    icon: '👀',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30'
  },
  {
    key: 'no_asistire' as keyof RSVPStats,
    label: 'No asistirán',
    icon: '❌',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30'
  }
];

export default function RSVPCounter({ 
  eventDateId, 
  className = '',
  variant = 'detailed',
  showIcons = true,
  animated = true
}: RSVPCounterProps) {
  const { stats, isLoading, error } = useEventRSVPStats(eventDateId);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <div className="flex flex-col">
          <span className="text-white text-sm font-medium">Actualizando estadísticas...</span>
          <span className="text-neutral-400 text-xs">Obteniendo datos más recientes</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`text-neutral-500 text-sm ${className}`}>
        No disponible
      </div>
    );
  }

  const totalRSVP = stats.total;
  const hasAnyRSVP = totalRSVP > 0;

  // Variante minimal - solo el total
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {showIcons && <span className="text-sm">👥</span>}
        <span className="text-sm font-medium text-neutral-300">
          {totalRSVP} {totalRSVP === 1 ? 'persona' : 'personas'}
        </span>
      </div>
    );
  }

  // Variante compact - estadísticas en una línea
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {RSVP_STATS_CONFIG.map((config) => {
          const count = stats[config.key];
          if (count === 0) return null;

          return (
            <motion.div
              key={config.key}
              initial={animated ? { scale: 0, opacity: 0 } : false}
              animate={animated ? { scale: 1, opacity: 1 } : false}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-md
                ${config.bgColor} ${config.color}
                border ${config.borderColor}
              `}
            >
              {showIcons && <span className="text-xs">{config.icon}</span>}
              <span className="text-xs font-medium">{count}</span>
            </motion.div>
          );
        })}
        
        {!hasAnyRSVP && (
          <span className="text-neutral-500 text-xs">
            Sin respuestas aún
          </span>
        )}
      </div>
    );
  }

  // Variante detailed - estadísticas completas
  return (
    <motion.div 
      className={`space-y-3 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">
          Respuestas RSVP
        </h4>
        <motion.div 
          className="flex items-center gap-1 text-xs text-neutral-300 bg-neutral-800/50 px-3 py-1 rounded-full"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <span>👥</span>
          <span>{totalRSVP} {totalRSVP === 1 ? 'persona' : 'personas'}</span>
        </motion.div>
      </div>

      <div className="space-y-3">
        {RSVP_STATS_CONFIG.map((config, index) => {
          const count = stats[config.key];
          const percentage = totalRSVP > 0 ? (count / totalRSVP) * 100 : 0;

          return (
            <motion.div
              key={config.key}
              initial={animated ? { x: -20, opacity: 0 } : false}
              animate={animated ? { x: 0, opacity: 1 } : false}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {showIcons && (
                    <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                      <span className="text-sm">{config.icon}</span>
                    </div>
                  )}
                  <span className={`text-sm font-semibold ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {count}
                    </div>
                    {totalRSVP > 0 && (
                      <div className="text-xs text-neutral-400">
                        {percentage.toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {totalRSVP > 0 && (
                <div className="w-full bg-neutral-800/50 rounded-full h-3 overflow-hidden border border-neutral-700/50">
                  <motion.div
                    initial={animated ? { width: 0 } : false}
                    animate={animated ? { width: `${percentage}%` } : false}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                    className={`h-full ${config.bgColor.replace('/20', '/80')} rounded-full relative`}
                    style={{
                      background: `linear-gradient(90deg, ${config.bgColor.replace('/20', '/60')} 0%, ${config.bgColor.replace('/20', '/80')} 100%)`,
                      boxShadow: `0 0 8px ${config.bgColor.replace('/20', '/40')}`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 rounded-full" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {!hasAnyRSVP && (
        <motion.div
          initial={animated ? { opacity: 0, scale: 0.9 } : false}
          animate={animated ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-2xl">
            📅
          </div>
          <div className="text-neutral-300 font-medium mb-1">Nadie ha respondido aún</div>
          <div className="text-xs text-neutral-500">¡Sé el primero en RSVP!</div>
        </motion.div>
      )}
    </motion.div>
  );
}