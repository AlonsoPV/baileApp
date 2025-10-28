import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";

interface EventCardProps {
  item: any;
}

export default function EventCard({ item }: EventCardProps) {
  // Preferir fechas reales (crear/editar) y campos normalizados
  const eventId = item.id ?? item.event_date_id;
  const nombre = item.nombre || item.evento_nombre || item.lugar || item.ciudad || "Evento";
  const fecha = item.fecha || item.evento_fecha;
  const horaInicio = item.hora_inicio || item.evento_hora_inicio;
  const horaFin = item.hora_fin || item.evento_hora_fin;
  const lugar = item.lugar || item.evento_lugar;
  const ciudad = item.ciudad || item.evento_ciudad;
  const direccion = item.direccion || item.evento_direccion;
  const organizador = item.organizador_nombre || item.organizer_name;

  return (
    <LiveLink to={urls.eventDateLive(eventId)} asCard={false}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.95))',
          padding: '1.5rem',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(255, 61, 87, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 61, 87, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #FF3D57, #FF8C42, #FFD166)', opacity: 0.8 }} />

        <div style={{
          fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem',
          background: 'linear-gradient(135deg, #FF3D57, #FF8C42)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          display: 'flex', alignItems: 'center', gap: '0.5rem', lineHeight: 1.4
        }}>
          <motion.span whileHover={{ rotate: 12, scale: 1.2 }} style={{ display: 'inline-block', filter: 'drop-shadow(0 2px 4px rgba(255, 61, 87, 0.4))' }}>🎉</motion.span>
          <span style={{ flex: 1 }}>{nombre}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', padding: '0.5rem 0.75rem', background: 'rgba(255,61,87,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(255,61,87,0.2)' }}>
            <span style={{ fontSize: '1.1rem' }}>📅</span>
            {fecha && <span style={{ fontWeight: 500 }}>{fecha}</span>}
            {horaInicio && (
              <>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>🕒 {horaInicio}</span>
                {horaFin && <span>– {horaFin}</span>}
              </>
            )}
          </div>

          {(lugar || ciudad) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', padding: '0.5rem 0.75rem', background: 'rgba(59,130,246,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(59,130,246,0.2)' }}>
              <span style={{ fontSize: '1.1rem' }}>📍</span>
              <span style={{ fontWeight: 500 }}>{[lugar, ciudad].filter(Boolean).join(' • ')}</span>
            </div>
          )}
        </div>

        {direccion && (
          <div style={{ fontSize: '0.75rem', marginTop: '0.75rem', padding: '0.5rem', opacity: 0.7, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
            🗺️ {direccion}
          </div>
        )}

        {organizador && (
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#f093fb,#f5576c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 2px 8px rgba(240, 147, 251, 0.4)' }}>👤</div>
            <div style={{ flex: 1, fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
              <div style={{ fontWeight: 600, color: '#f093fb' }}>{organizador}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: 2 }}>Organizador</div>
            </div>
          </div>
        )}

        <div className="hover-glow" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #FF3D57, transparent)', opacity: 0, transition: 'opacity 0.3s ease' }} />
      </motion.div>
    </LiveLink>
  );
}

