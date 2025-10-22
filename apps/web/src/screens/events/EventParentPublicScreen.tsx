import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useDatesByParent } from '../../hooks/useEvents';
import { useTags } from '../../hooks/useTags';

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function EventParentPublicScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Fetch event parent
  const { data: eventParent, isLoading: isLoadingParent } = useQuery({
    queryKey: ['parent', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events_parent')
        .select('*')
        .eq('id', parseInt(id!))
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });
  
  const { data: dates, isLoading: isLoadingDates } = useDatesByParent(parseInt(id || '0'), true);
  const { ritmos } = useTags('ritmo');

  // Si solo hay una fecha publicada, redirigir directamente
  React.useEffect(() => {
    if (dates && dates.length === 1) {
      navigate(`/events/date/${dates[0].id}`, { replace: true });
    }
  }, [dates, navigate]);

  if (isLoadingParent || isLoadingDates) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        background: colors.dark
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            borderTop: '3px solid #FF3D57',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div>Cargando evento...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!eventParent) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        background: colors.dark,
        padding: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
            Evento no encontrado
          </h2>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              borderRadius: '25px',
              border: 'none',
              background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(236, 72, 153))',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const styleNames = (eventParent.estilos || [])
    .map((eid: number) => ritmos.find(r => r.id === eid)?.nombre)
    .filter(Boolean) as string[];

  return (
    <div style={{ color: 'white', background: colors.dark, minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        position: 'relative',
        minHeight: '280px',
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(59, 130, 246, 0.3))'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(2px)'
        }} />
        <div style={{
          position: 'relative',
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '2.5rem 1.5rem'
        }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '800',
            textShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            marginBottom: '0.5rem'
          }}>
            {eventParent.nombre}
          </h1>

          {eventParent.descripcion && (
            <p style={{
              marginTop: '0.5rem',
              opacity: 0.9,
              maxWidth: '42rem',
              lineHeight: '1.6'
            }}>
              {eventParent.descripcion}
            </p>
          )}

          <div style={{
            marginTop: '0.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            {styleNames.map(n => (
              <span
                key={n}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.875rem'
                }}
              >
                {n}
              </span>
            ))}
          </div>

          {eventParent.sede_general && (
            <div style={{
              marginTop: '1rem',
              fontSize: '0.875rem',
              opacity: 0.8
            }}>
              🏢 {eventParent.sede_general}
            </div>
          )}
        </div>
      </div>

      {/* Lista de Fechas */}
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1.5rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '1.5rem'
        }}>
          📅 Fechas Disponibles
        </h2>

        {!dates || dates.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            background: 'rgba(38, 38, 38, 0.6)',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>
              Aún no hay fechas publicadas para este evento
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {dates.map((date: any) => (
              <motion.div
                key={date.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/events/date/${date.id}`)}
                style={{
                  padding: '1.5rem',
                  background: 'rgba(23, 23, 23, 0.8)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '0.75rem',
                  color: colors.coral
                }}>
                  📅 {date.fecha}
                </div>

                {date.hora_inicio && (
                  <div style={{
                    fontSize: '0.9rem',
                    opacity: 0.9,
                    marginBottom: '0.5rem'
                  }}>
                    🕒 {date.hora_inicio}
                    {date.hora_fin && ` – ${date.hora_fin}`}
                  </div>
                )}

                {date.lugar && (
                  <div style={{
                    fontSize: '0.9rem',
                    opacity: 0.9,
                    marginBottom: '0.5rem'
                  }}>
                    📍 {date.lugar}
                  </div>
                )}

                {date.ciudad && (
                  <div style={{
                    fontSize: '0.85rem',
                    opacity: 0.7,
                    marginBottom: '0.5rem'
                  }}>
                    🌆 {date.ciudad}
                  </div>
                )}

                <div style={{
                  marginTop: '1rem',
                  padding: '0.5rem',
                  background: 'rgba(30, 136, 229, 0.2)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: colors.blue
                }}>
                  Ver detalles completos →
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {dates && dates.length > 0 && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(30, 136, 229, 0.1)',
            borderRadius: '0.75rem',
            border: `1px solid ${colors.blue}33`,
            textAlign: 'center',
            fontSize: '0.875rem',
            opacity: 0.8
          }}>
            💡 <strong>Tip:</strong> Haz clic en cualquier fecha para ver el cronograma completo, precios y más detalles
          </div>
        )}
      </div>
    </div>
  );
}
