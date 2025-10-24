import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDatesByParent, useCreateDate, useUpdateDate, useDeleteDate } from "../../hooks/useEvents";
import { useTags } from "../../hooks/useTags";
import { useToast } from "../Toast";
import { Chip } from "../profile/Chip";
import { fmtDate, fmtTime } from "../../utils/format";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface EventDatesSectionProps {
  eventId: number;
  eventName: string;
}

export default function EventDatesSection({ eventId, eventName }: EventDatesSectionProps) {
  const navigate = useNavigate();
  const { data: dates, isLoading } = useDatesByParent(eventId);
  const createMutation = useCreateDate();
  const updateMutation = useUpdateDate();
  const deleteMutation = useDeleteDate();
  const { zonas, ritmos } = useTags('zona');
  const { showToast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [editingDate, setEditingDate] = useState<number | null>(null);

  const handleCreateDate = () => {
    navigate(`/profile/organizer/date/new/${eventId}`);
  };

  const handleEditDate = (dateId: number) => {
    navigate(`/profile/organizer/date/${dateId}/edit`);
  };

  const handleDeleteDate = async (dateId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta fecha?')) {
      try {
        await deleteMutation.mutateAsync(dateId);
        showToast('Fecha eliminada ✅', 'success');
      } catch (error) {
        showToast('Error al eliminar fecha', 'error');
      }
    }
  };

  const getZonaNombre = (zonaId: number) => {
    return zonas?.find(z => z.id === zonaId)?.nombre || 'Zona no especificada';
  };

  const getRitmoNombres = (ritmoIds: number[]) => {
    return ritmoIds
      .map(id => ritmos?.find(r => r.id === id)?.nombre)
      .filter(Boolean)
      .join(', ');
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: colors.light
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Cargando fechas del evento...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        marginBottom: '2rem',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: colors.light,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📅 Fechas del Evento
        </h3>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreateDate}
          style={{
            padding: '0.75rem 1.5rem',
            background: colors.blue,
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)'
          }}
        >
          ➕ Nueva Fecha
        </motion.button>
      </div>

      {dates && dates.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1rem'
        }}>
          {dates.map((date, index) => (
            <motion.div
              key={date.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Header de la fecha */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: colors.light,
                    margin: '0 0 0.5rem 0'
                  }}>
                    {fmtDate(date.fecha)}
                  </h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem'
                  }}>
                    <span>🕐</span>
                    <span>
                      {date.hora_inicio && date.hora_fin 
                        ? `${fmtTime(date.hora_inicio)} - ${fmtTime(date.hora_fin)}`
                        : 'Horario no especificado'
                      }
                    </span>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEditDate(date.id)}
                    style={{
                      padding: '0.5rem',
                      background: 'rgba(30, 136, 229, 0.2)',
                      border: '1px solid rgba(30, 136, 229, 0.3)',
                      borderRadius: '8px',
                      color: colors.blue,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    ✏️
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteDate(date.id)}
                    disabled={deleteMutation.isPending}
                    style={{
                      padding: '0.5rem',
                      background: 'rgba(255, 61, 87, 0.2)',
                      border: '1px solid rgba(255, 61, 87, 0.3)',
                      borderRadius: '8px',
                      color: colors.coral,
                      cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      opacity: deleteMutation.isPending ? 0.5 : 1
                    }}
                  >
                    🗑️
                  </motion.button>
                </div>
              </div>

              {/* Información de la fecha */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {date.lugar && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem'
                  }}>
                    <span>📍</span>
                    <span>{date.lugar}</span>
                  </div>
                )}
                
                {date.ciudad && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem'
                  }}>
                    <span>🏙️</span>
                    <span>{date.ciudad}</span>
                  </div>
                )}

                {date.zona && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem'
                  }}>
                    <span>🗺️</span>
                    <span>{getZonaNombre(date.zona)}</span>
                  </div>
                )}

                {date.estilos && date.estilos.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem'
                  }}>
                    <span>🎵</span>
                    <span>{getRitmoNombres(date.estilos)}</span>
                  </div>
                )}

                {date.requisitos && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem'
                  }}>
                    <span>📋</span>
                    <span>{date.requisitos}</span>
                  </div>
                )}

                {/* Estado de publicación */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: date.estado_publicacion === 'publicado' 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(156, 163, 175, 0.2)',
                    color: date.estado_publicacion === 'publicado' 
                      ? '#10b981' 
                      : '#9ca3af',
                    border: `1px solid ${date.estado_publicacion === 'publicado' 
                      ? 'rgba(16, 185, 129, 0.3)' 
                      : 'rgba(156, 163, 175, 0.3)'}`
                  }}>
                    {date.estado_publicacion === 'publicado' ? '✅ Publicado' : '📝 Borrador'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <h4 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            margin: '0 0 0.5rem 0',
            color: colors.light
          }}>
            No hay fechas configuradas
          </h4>
          <p style={{
            margin: '0 0 1.5rem 0',
            fontSize: '0.9rem'
          }}>
            Agrega fechas específicas para tu evento
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateDate}
            style={{
              padding: '0.75rem 1.5rem',
              background: colors.blue,
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto',
              boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)'
            }}
          >
            ➕ Crear Primera Fecha
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
