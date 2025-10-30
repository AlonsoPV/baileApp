import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import AddToCalendarWithStats from "../../AddToCalendarWithStats";

interface EventCardProps {
  item: any;
}

export default function EventCard({ item }: EventCardProps) {
  const eventId = item.id ?? item.event_date_id;
  const linkTo = eventId ? urls.eventDateLive(eventId) : '#';
  const flyer = (item && (item.flyer_url || (Array.isArray(item.media) && (item.media[0]?.url || item.media[0])))) as string | undefined;
  const nombre = item.nombre || item.evento_nombre || item.lugar || item.ciudad || "Evento";
  const fecha = item.fecha || item.evento_fecha;
  const horaInicio = item.hora_inicio || item.evento_hora_inicio;
  const horaFin = item.hora_fin || item.evento_hora_fin;
  const lugar = item.lugar || item.evento_lugar;
  const ciudad = item.ciudad || item.evento_ciudad;
  const direccion = item.direccion || item.evento_direccion;
  const organizador = item.organizador_nombre || item.organizer_name;

  return (
    <LiveLink to={linkTo} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: flyer
            ? `linear-gradient(135deg, rgba(30, 20, 40, 0.7), rgba(20, 10, 30, 0.7)), url(${flyer})`
            : 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '1.5rem',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(240, 147, 251, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(240, 147, 251, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)', opacity: 0.9 }} />
        {/* Overlay para legibilidad sobre el flyer */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.80) 100%)', zIndex: 0, pointerEvents: 'none' }} />

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Botón de calendario en esquina superior derecha */}
        <div 
          style={{ 
            position: 'absolute', 
            top: '12px', 
            right: '12px', 
            zIndex: 10 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <AddToCalendarWithStats
            eventId={eventId}
            title={nombre}
            description={undefined}
            location={lugar || ciudad || direccion}
            start={(() => {
              try {
                if (!fecha) return new Date();
                // Asegurar formato ISO (YYYY-MM-DD)
                const fechaStr = fecha.includes('T') ? fecha.split('T')[0] : fecha;
                const hora = (horaInicio || '20:00').split(':').slice(0, 2).join(':');
                const fechaCompleta = `${fechaStr}T${hora}:00`;
                const parsed = new Date(fechaCompleta);
                return isNaN(parsed.getTime()) ? new Date() : parsed;
              } catch (err) {
                console.error('[EventCard] Error parsing start date:', err);
                return new Date();
              }
            })()}
            end={(() => {
              try {
                if (!fecha) {
                  const defaultEnd = new Date();
                  defaultEnd.setHours(defaultEnd.getHours() + 2);
                  return defaultEnd;
                }
                // Asegurar formato ISO (YYYY-MM-DD)
                const fechaStr = fecha.includes('T') ? fecha.split('T')[0] : fecha;
                const hora = (horaFin || horaInicio || '23:59').split(':').slice(0, 2).join(':');
                const fechaCompleta = `${fechaStr}T${hora}:00`;
                const parsed = new Date(fechaCompleta);
                if (isNaN(parsed.getTime())) {
                  const defaultEnd = new Date();
                  defaultEnd.setHours(defaultEnd.getHours() + 2);
                  return defaultEnd;
                }
                return parsed;
              } catch (err) {
                console.error('[EventCard] Error parsing end date:', err);
                const defaultEnd = new Date();
                defaultEnd.setHours(defaultEnd.getHours() + 2);
                return defaultEnd;
              }
            })()}
            showAsIcon={true}
          />
        </div>

        {/* Sin avatar: el flyer queda como fondo del card */}

        <div style={{
          fontSize: '1.375rem', fontWeight: 700, letterSpacing: 0.2, marginBottom: 10,
          background: 'linear-gradient(135deg, #f093fb, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.3
        }}>

          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {fecha && (
              <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: 8, borderRadius: 999, fontSize: 13, color: 'rgba(255,255,255,0.92)' }}>
                📅 {fecha}
              </span>
            )}
            {horaInicio && (
              <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: 8, borderRadius: 999, fontSize: 13, color: 'rgba(255,255,255,0.92)' }}>
                🕒 {horaInicio}
              </span>
            )}
          </div>

          {(lugar || ciudad) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: 8, borderRadius: 999, fontSize: 13, color: 'rgba(255,255,255,0.9)', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                📍 {[lugar, ciudad].filter(Boolean).join(' • ')}
              </span>
            </div>
          )}
        </div>

       {/*  {direccion && (
          <div style={{ fontSize: 12, marginTop: 6, padding: 8, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }} title={direccion}>
            📍 {direccion}
          </div>
        )}
 */}
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
        <div style={{ display: 'inline', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Descubre más del social</div>
          <div style={{
            padding: '8px 12px',
            borderRadius: 12,
            background: 'rgba(240, 147, 251, 0.1)',
            color: '#fff',
            margin: '10px 0',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.08)'
          }}>Ver más →</div>
        </div>

        {/* Cierre del contenedor de contenido sobre el overlay */}
        </div>

        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
    </LiveLink>
  );
}

