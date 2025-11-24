import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { EventDate, RSVPCount } from "../types/events";
import { RSVPCountsRow } from "./events/RSVPCountsRow";
import { fmtDateTime } from "../utils/format";
import { calculateNextDateWithTime } from "../utils/calculateRecurringDates";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  green: '#10B981',
  dark: '#121212',
  light: '#F5F5F5',
};

interface EventDateCardProps {
  date: EventDate;
  rsvpCounts?: RSVPCount[];
  showRSVP?: boolean;
  showActions?: boolean;
  onRSVP?: (eventDateId: number, status: 'voy' | 'interesado' | 'no_voy') => void;
  currentRSVP?: 'voy' | 'interesado' | 'no_voy' | null;
}

export function EventDateCard({ 
  date, 
  rsvpCounts = [], 
  showRSVP = false, 
  showActions = false,
  onRSVP,
  currentRSVP 
}: EventDateCardProps) {
  const counts = rsvpCounts.find(c => c.event_date_id === date.id);
  const isPublished = date.estado_publicacion === 'publicado';
  
  // Calcular la fecha a mostrar: si tiene dia_semana, usar la próxima fecha; si no, usar la fecha original
  const fechaAMostrar = React.useMemo(() => {
    if (!date.fecha) return null;
    
    // Si tiene dia_semana, calcular la próxima fecha
    if (date.dia_semana !== null && date.dia_semana !== undefined && typeof date.dia_semana === 'number') {
      try {
        const horaInicioStr = date.hora_inicio || '20:00';
        const proximaFecha = calculateNextDateWithTime(date.dia_semana, horaInicioStr);
        const year = proximaFecha.getFullYear();
        const month = String(proximaFecha.getMonth() + 1).padStart(2, '0');
        const day = String(proximaFecha.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        console.error('Error calculando próxima fecha:', e);
        return date.fecha;
      }
    }
    
    // Si no tiene dia_semana, usar la fecha original
    return date.fecha;
  }, [date.fecha, date.dia_semana, date.hora_inicio]);
  
  // Si tiene dia_semana, nunca es pasado (siempre es futuro)
  const isPast = date.dia_semana !== null && date.dia_semana !== undefined 
    ? false 
    : fechaAMostrar ? new Date(fechaAMostrar) < new Date() : false;

  const getEstadoBadge = () => {
    if (isPast) {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '12px',
          background: `${colors.dark}cc`,
          border: `1px solid ${colors.light}33`,
          color: `${colors.light}88`,
          fontSize: '0.75rem',
          fontWeight: '600',
        }}>
          📅 Pasado
        </span>
      );
    }

    if (isPublished) {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '12px',
          background: `${colors.green}cc`,
          border: `2px solid ${colors.green}`,
          color: colors.light,
          fontSize: '0.75rem',
          fontWeight: '600',
        }}>
          ✅ Publicado
        </span>
      );
    }

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        background: `${colors.orange}cc`,
        border: `2px solid ${colors.orange}`,
        color: colors.light,
        fontSize: '0.75rem',
        fontWeight: '600',
      }}>
        📝 Borrador
      </span>
    );
  };

  const getRSVPButton = (status: 'voy' | 'interesado' | 'no_voy') => {
    const isActive = currentRSVP === status;
    const icons = {
      voy: '✅',
      interesado: '🤔',
      no_voy: '❌'
    };
    const labels = {
      voy: 'Voy',
      interesado: 'Interesado',
      no_voy: 'No voy'
    };

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onRSVP?.(date.id, status)}
        disabled={!isPublished || isPast}
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          background: isActive
            ? `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`
            : `${colors.dark}cc`,
          border: `2px solid ${isActive ? colors.coral : `${colors.light}33`}`,
          color: colors.light,
          fontSize: '0.875rem',
          fontWeight: '700',
          cursor: (!isPublished || isPast) ? 'not-allowed' : 'pointer',
          opacity: (!isPublished || isPast) ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        {icons[status]} {labels[status]}
      </motion.button>
    );
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${colors.dark}88` }}
      style={{
        padding: '20px',
        borderRadius: '16px',
        border: `1px solid ${colors.light}22`,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '4px',
            color: colors.light,
          }}>
            {fechaAMostrar ? fmtDateTime(fechaAMostrar, date.hora_inicio) : 'Fecha no disponible'}
          </h3>
          {date.hora_fin && (
            <p style={{
              fontSize: '0.875rem',
              opacity: 0.7,
              margin: 0,
            }}>
              Hasta {date.hora_fin.slice(0, 5)}
            </p>
          )}
        </div>
        {getEstadoBadge()}
      </div>

      {/* Ubicación */}
      {(date.lugar || date.ciudad) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          fontSize: '0.875rem',
          opacity: 0.8,
        }}>
          <span>📍</span>
          <span>
            {date.lugar && date.ciudad 
              ? `${date.lugar}, ${date.ciudad}`
              : date.lugar || date.ciudad
            }
          </span>
        </div>
      )}

      {/* Dirección */}
      {date.direccion && (
        <div style={{
          fontSize: '0.875rem',
          opacity: 0.6,
          marginBottom: '12px',
        }}>
          📍 {date.direccion}
        </div>
      )}

      {/* Requisitos */}
      {date.requisitos && (
        <div style={{
          padding: '8px 12px',
          background: `${colors.dark}aa`,
          borderRadius: '8px',
          marginBottom: '12px',
        }}>
          <p style={{
            fontSize: '0.875rem',
            margin: 0,
            opacity: 0.8,
          }}>
            <strong>Requisitos:</strong> {date.requisitos}
          </p>
        </div>
      )}

      {/* RSVP Counts */}
      {counts && (counts.voy > 0 || counts.interesado > 0 || counts.no_voy > 0) && (
        <div style={{ marginBottom: '16px' }}>
          <RSVPCountsRow counts={counts} variant="compact" />
        </div>
      )}

      {/* RSVP Actions */}
      {showRSVP && isPublished && !isPast && (
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}>
          {getRSVPButton('voy')}
          {getRSVPButton('interesado')}
          {getRSVPButton('no_voy')}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <Link
            to={`/social/fecha/${date.id}`}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: `2px solid ${colors.blue}`,
              background: 'transparent',
              color: colors.blue,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.blue;
              e.currentTarget.style.color = colors.light;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = colors.blue;
            }}
          >
            👁️ Ver Detalles
          </Link>

          {!isPublished && (
            <span style={{
              fontSize: '0.75rem',
              opacity: 0.6,
            }}>
              Solo visible para ti
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
