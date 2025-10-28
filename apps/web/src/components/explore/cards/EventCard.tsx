import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";

interface EventCardProps {
  item: any;
}

export default function EventCard({ item }: EventCardProps) {
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, boxShadow: '0 10px 24px rgba(0,0,0,0.45)' }}
        whileTap={{ scale: 0.99 }}
        style={{
          position: 'relative',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #0f141a 0%, #121722 100%)',
          padding: '16px',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
          transition: 'box-shadow .2s ease, transform .2s ease, border-color .2s ease',
          
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, rgba(30,136,229,0.7), rgba(124,77,255,0.7))' }} />

        {(() => {
          const avatarUrl = (item && (item.organizador_avatar || item.organizer_avatar_url || item.organizer_avatar || item.avatar_url)) as string | undefined;
          const fallback = ((organizador || nombre || 'E') as string).charAt(0).toUpperCase();
          return (
            <div style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 14 }}>{fallback}</span>
              )}
            </div>
          );
        })()}

        <div style={{
          fontSize: '1.05rem', fontWeight: 700, letterSpacing: 0.2, marginBottom: 10,
          color: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.3
        }}>
          <motion.span aria-hidden whileHover={{ scale: 1.05, rotate: 4 }} style={{ display: 'inline-block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}>🎉</motion.span>
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.92)', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 16 }}>📅</span>
            {fecha && <span style={{ fontWeight: 600 }}>{fecha}</span>}
            {horaInicio && (
              <>
                <span style={{ opacity: 0.45 }}>•</span>
                <span style={{ opacity: 0.9 }}>🕒 {horaInicio}{horaFin ? ` – ${horaFin}` : ''}</span>
              </>
            )}
          </div>

          {(lugar || ciudad) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.9)', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[lugar, ciudad].filter(Boolean).join(' • ')}</span>
            </div>
          )}
        </div>

        {direccion && (
          <div style={{ fontSize: 12, marginTop: 6, padding: 8, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }} title={direccion}>
            🗺️ {direccion}
          </div>
        )}

        {organizador && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>👤</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={organizador}>
                {organizador}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Organizador</div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Descubre más del evento</div>
          <div style={{
            padding: '8px 12px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1E88E5, #7C4DFF)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.08)'
          }}>Ver más →</div>
        </div>

        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
    </LiveLink>
  );
}

