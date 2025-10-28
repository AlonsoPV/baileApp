import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";

export default function TeacherCard({ item }: { item: any }) {
  return (
    <LiveLink to={urls.teacherLive(item.id)} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
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
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)', opacity: 0.9 }} />
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
        🎓 {item.nombre_publico || "Maestr@"}
      </div>
      
      <div style={{
        fontSize: '0.875rem',
        opacity: 0.8,
        marginBottom: '0.25rem'
      }}>
        {(item.ritmos || []).length} ritmos
      </div>
      
      {item.bio && (
        <div style={{
          fontSize: '0.875rem',
          marginTop: '0.5rem',
          color: 'rgba(255, 255, 255, 0.7)',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.6,
          flex: 1
        }}>
          {item.bio}
        </div>
      )}
      </motion.div>
    </LiveLink>
  );
}

