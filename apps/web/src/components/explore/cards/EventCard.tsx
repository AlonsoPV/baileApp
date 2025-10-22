import React from "react";
import { motion } from "framer-motion";

export default function EventCard({ item }: { item: any }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      style={{
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(23, 23, 23, 0.6)',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
        color: '#FF3D57'
      }}>
        {item.lugar || item.ciudad || "Evento"}
      </div>
      
      <div style={{
        fontSize: '0.875rem',
        opacity: 0.8,
        marginBottom: '0.25rem'
      }}>
        📅 {item.fecha} {item.hora_inicio ? `• 🕒 ${item.hora_inicio}` : ""}
      </div>
      
      {item.direccion && (
        <div style={{
          fontSize: '0.75rem',
          marginTop: '0.5rem',
          opacity: 0.7,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          📍 {item.direccion}
        </div>
      )}
    </motion.div>
  );
}

