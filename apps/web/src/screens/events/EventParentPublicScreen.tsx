import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useDatesByParent } from '../../hooks/useEvents';
import { useMyOrganizer } from '../../hooks/useOrganizer';
import { useRitmos } from '../../hooks/useTags';
import { TagChip } from '../../components/TagChip';
import { theme } from '@theme/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const { data: organizer } = useMyOrganizer();
  const { data: ritmos } = useRitmos();

  const isOwner = organizer && eventParent && organizer.id === eventParent.organizer_id;

  if (isLoadingParent || isLoadingDates) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: theme.text.primary }}>
        Cargando evento...
      </div>
    );
  }

  if (!eventParent) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: theme.text.primary }}>
        <h1>Evento no encontrado</h1>
        <p style={{ color: theme.text.secondary }}>
          El evento que buscas no existe o no está disponible.
        </p>
      </div>
    );
  }

  const getEstiloNombres = () => {
    if (!ritmos || !eventParent.estilos) return [];
    return eventParent.estilos
      .map(id => ritmos.find(r => r.id === id))
      .filter(Boolean)
      .map(r => r!.nombre);
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1000px', 
      margin: '0 auto',
      color: theme.text.primary,
    }}>
      {/* Event Header */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>
            {eventParent.nombre}
          </h1>
          
          {/* Edit button for owner */}
          {isOwner && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => navigate(`/events/parent/${id}/edit`)}
                style={{
                  background: theme.brand.secondary,
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: theme.radius.md,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ✏️ Editar Evento
              </button>
              <button
                onClick={() => navigate(`/events/date/new/${id}`)}
                style={{
                  background: theme.brand.primary,
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: theme.radius.md,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Nueva Fecha
              </button>
            </div>
          )}
        </div>
        
        {eventParent.descripcion && (
          <p style={{ 
            fontSize: '1.125rem', 
            color: theme.text.secondary,
            lineHeight: '1.6',
            marginBottom: '1rem',
          }}>
            {eventParent.descripcion}
          </p>
        )}

        {eventParent.sede_general && (
          <p style={{ 
            fontSize: '1rem', 
            color: theme.text.secondary,
            marginBottom: '1rem',
          }}>
            📍 {eventParent.sede_general}
          </p>
        )}

        {getEstiloNombres().length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {getEstiloNombres().map(nombre => (
              <TagChip key={nombre} label={nombre} variant="ritmo" />
            ))}
          </div>
        )}
      </div>

      {/* Dates Section */}
      <div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>
          📅 Fechas Disponibles
        </h2>

        {dates && dates.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {dates.map(date => {
              const fechaDate = new Date(date.fecha);
              const fechaFormateada = format(fechaDate, "d 'de' MMMM, yyyy", { locale: es });
              
              return (
                <div
                  key={date.id}
                  style={{
                    padding: '1.5rem',
                    background: theme.bg.surface,
                    borderRadius: theme.radius.lg,
                    border: `1px solid ${theme.bg.border}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                        📅 {fechaFormateada}
                      </h3>
                      
                      {(date.hora_inicio || date.hora_fin) && (
                        <p style={{ color: theme.text.secondary, marginBottom: '0.5rem' }}>
                          🕐 {date.hora_inicio || '?'} - {date.hora_fin || '?'}
                        </p>
                      )}

                      {date.lugar && (
                        <p style={{ color: theme.text.secondary, marginBottom: '0.5rem' }}>
                          📍 {date.lugar}
                        </p>
                      )}

                      {date.direccion && (
                        <p style={{ 
                          color: theme.text.secondary, 
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem',
                        }}>
                          {date.direccion}
                        </p>
                      )}

                      {date.ciudad && (
                        <p style={{ 
                          color: theme.text.secondary, 
                          fontSize: '0.875rem',
                        }}>
                          {date.ciudad}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      {isOwner && (
                        <button
                          onClick={() => navigate(`/events/date/${date.id}/edit`)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: theme.brand.secondary,
                            color: '#fff',
                            border: 'none',
                            borderRadius: theme.radius.md,
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ Editar
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/events/date/${date.id}`)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: theme.brand.primary,
                          color: '#fff',
                          border: 'none',
                          borderRadius: theme.radius.md,
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            padding: '3rem',
            background: theme.bg.surface,
            borderRadius: theme.radius.lg,
            textAlign: 'center',
          }}>
            <p style={{ color: theme.text.secondary, fontSize: '1.125rem' }}>
              No hay fechas publicadas para este evento
            </p>
          </div>
        )}
      </div>
    </div>
  );
}