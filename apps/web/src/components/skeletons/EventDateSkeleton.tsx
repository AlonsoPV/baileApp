import React from 'react';
import { motion } from 'framer-motion';

const colors = {
  dark: '#121212',
  light: '#F5F5F5',
};

/**
 * Skeleton component para EventDatePublicScreen
 * Muestra un placeholder mientras carga la fecha del evento
 */
export function EventDateSkeleton() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        padding: '8px 0 24px 0',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(40,30,45,0.92), rgba(30,20,40,0.92))',
            border: '1px solid rgba(240,147,251,0.18)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Title Skeleton */}
          <div
            style={{
              height: '3rem',
              width: '70%',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              marginBottom: '1rem',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />

          {/* Chips Skeleton */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: '2rem',
                  width: '120px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          {/* Description Skeleton */}
          <div
            style={{
              height: '1rem',
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '8px',
              marginBottom: '0.5rem',
            }}
          />
          <div
            style={{
              height: '1rem',
              width: '80%',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '8px',
            }}
          />
        </motion.div>

        {/* RSVP Section Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          style={{
            padding: '1.5rem',
            marginBottom: '1.5rem',
            borderRadius: '20px',
            border: '2px solid rgba(30,136,229,0.3)',
            background: 'linear-gradient(135deg, rgba(30,136,229,0.15) 0%, rgba(0,188,212,0.12) 50%, rgba(240,147,251,0.10) 100%)',
          }}
        >
          <div
            style={{
              height: '2rem',
              width: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              marginBottom: '1rem',
            }}
          />
          <div
            style={{
              height: '3rem',
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '12px',
            }}
          />
        </motion.div>

        {/* Location Section Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          style={{
            padding: '1.25rem',
            marginBottom: '1.25rem',
            borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
          }}
        >
          <div
            style={{
              height: '1.5rem',
              width: '250px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          />
          <div
            style={{
              height: '4rem',
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '12px',
            }}
          />
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

