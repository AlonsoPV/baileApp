import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";

interface OrganizerCardProps {
  item: any;
}

export default function OrganizerCard({ item }: OrganizerCardProps) {
  const initials = item.nombre_publico
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

  return (
    <LiveLink to={urls.organizerLive(item.id)} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ 
          scale: 1.03, 
          y: -8,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
          padding: '1.5rem',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(240, 147, 251, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(240, 147, 251, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top gradient bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)',
          opacity: 0.9
        }} />

        {/* Avatar circle with initials */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f093fb, #f5576c)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'white',
          marginBottom: '1rem',
          boxShadow: '0 4px 16px rgba(240, 147, 251, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          {initials}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: '2px solid rgba(240, 147, 251, 0.3)',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Nombre del organizador */}
        <div style={{
          fontSize: '1.375rem',
          fontWeight: '700',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #f093fb, #FFD166)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: '1.3',
          flex: 'none'
        }}>
          {item.nombre_publico}
        </div>
        
        {/* Badge de verificación */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.75rem',
          background: 'rgba(240, 147, 251, 0.15)',
          borderRadius: '9999px',
          border: '1px solid rgba(240, 147, 251, 0.3)',
          fontSize: '0.75rem',
          color: '#f093fb',
          fontWeight: '600',
          marginBottom: '1rem',
          width: 'fit-content'
        }}>
          <span>✓</span>
          <span>Organizador Verificado</span>
        </div>
        
        {/* Biografía */}
        {item.bio && (
          <div style={{
            fontSize: '0.875rem',
            marginBottom: '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.6',
            flex: 1
          }}>
            {item.bio}
          </div>
        )}

        {/* Footer con fecha y CTA */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          {/* Fecha de creación */}
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}>
            <span>📅</span>
            <span>
              Desde {new Date(item.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short'
              })}
            </span>
          </div>

          {/* CTA button */}
          <motion.div
            whileHover={{ x: 3 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#f093fb',
              padding: '0.375rem 0.75rem',
              background: 'rgba(240, 147, 251, 0.1)',
              borderRadius: '9999px',
              border: '1px solid rgba(240, 147, 251, 0.2)'
            }}
          >
            <span>Ver perfil</span>
            <span style={{ fontSize: '0.7rem' }}>→</span>
          </motion.div>
        </div>

        {/* Decorative corner accent */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          width: '40px',
          height: '40px',
          background: 'radial-gradient(circle, rgba(240, 147, 251, 0.2), transparent)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
      </motion.div>
    </LiveLink>
  );
}

