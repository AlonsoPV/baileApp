import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventCardSmallProps {
  event: {
    id: number;
    nombre: string;
    fecha: string;
    lugar?: string;
    imagen?: string;
  };
  onClick?: () => void;
}

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function EventCardSmall({ event, onClick }: EventCardSmallProps) {
  const fechaDate = new Date(event.fecha);
  const fechaFormateada = format(fechaDate, "d MMM", { locale: es });

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        minWidth: '280px',
        height: '160px',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        background: event.imagen 
          ? `url(${event.imagen}) center/cover` 
          : `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
      }}
    >
      {/* Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, transparent, ${colors.dark}dd)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '12px',
            background: colors.coral,
            color: colors.light,
            fontSize: '0.75rem',
            fontWeight: '700',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}
        >
          {fechaFormateada}
        </div>
        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: colors.light,
            margin: '0 0 4px 0',
            lineHeight: 1.2,
          }}
        >
          {event.nombre}
        </h3>
        {event.lugar && (
          <p
            style={{
              fontSize: '0.85rem',
              color: colors.light,
              opacity: 0.8,
              margin: 0,
            }}
          >
            📍 {event.lugar}
          </p>
        )}
      </div>
    </motion.div>
  );
}
