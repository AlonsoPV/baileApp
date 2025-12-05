import { Link, useNavigate } from 'react-router-dom';
import { useUserRSVPEvents } from '../../hooks/useRSVP';
import { colors, spacing, borderRadius } from '../../theme/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import React from 'react';

export function MyRSVPsScreen() {
  // No filtrar por status para mostrar todos los RSVPs (voy, interesado, no_voy)
  const { data: rsvpEvents, isLoading } = useUserRSVPEvents();
  const navigate = useNavigate();

  // Misma lógica que user-profile-interested-events
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isAvailableEventDate = React.useCallback((evento: any) => {
    if (!evento) return false;
    // Si tiene dia_semana, es un evento recurrente y siempre está disponible
    if (typeof (evento as any).dia_semana === 'number') return true;
    const raw = (evento as any).fecha;
    if (!raw) return false;
    try {
      const base = String(raw).split('T')[0];
      const [y, m, d] = base.split('-').map((n: string) => parseInt(n, 10));
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return true;
      const dt = new Date(y, m - 1, d);
      dt.setHours(0, 0, 0, 0);
      // >= hoy (incluye eventos de hoy)
      return dt >= today;
    } catch {
      return true;
    }
  }, [today]);

  const availableRsvpEvents = React.useMemo(() => {
    return (rsvpEvents || []).filter((r: any) => isAvailableEventDate(r.events_date));
  }, [rsvpEvents, isAvailableEventDate]);

  if (isLoading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        color: colors.light,
      }}>
        Cargando mis RSVPs...
      </div>
    );
  }

  const getRSVPBadge = (status: string) => {
    const badges: Record<string, { bg: string; color: string; label: string }> = {
      voy: { bg: '#D1FAE5', color: '#065F46', label: '✅ Voy' },
      interesado: { bg: '#FEF3C7', color: '#92400E', label: '⭐ Me Interesa' },
      no_voy: { bg: '#FEE2E2', color: '#991B1B', label: '❌ No Voy' },
    };

    const badge = badges[status] || badges.interesado;

    return (
      <span style={{
        padding: '0.5rem 0.75rem',
        borderRadius: borderRadius.md,
        fontSize: '0.875rem',
        fontWeight: '600',
        background: badge.bg,
        color: badge.color,
      }}>
        {badge.label}
      </span>
    );
  };

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '1000px',
        margin: '0 auto',
        color: colors.light,
        minHeight: '100vh',
      }}
    >
      {/* Botón de volver */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/profile/edit')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            color: colors.light,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ← Volver
        </button>
      </div>

      <div
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <h1 style={{ fontSize: '2rem' }}>📅 Mis RSVPs</h1>
        <p
          style={{
            color: colors.gray[400],
            fontSize: '0.95rem',
          }}
        >
          Solo se muestran tus eventos próximos. Los eventos pasados se ocultan automáticamente.
        </p>
      </div>
      
      {availableRsvpEvents && availableRsvpEvents.length > 0 ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {availableRsvpEvents.map((rsvp: any) => {
            const eventDate = rsvp.events_date;
            const parentEvent = eventDate?.events_parent;

            if (!eventDate || !parentEvent) return null;

            // Formatear fecha solo si existe (eventos recurrentes no tienen fecha específica)
            let fechaFormateada = '';
            if (eventDate.fecha) {
              try {
                const fechaDate = new Date(eventDate.fecha);
                if (!Number.isNaN(fechaDate.getTime())) {
                  fechaFormateada = format(fechaDate, "d 'de' MMM, yyyy", {
                    locale: es,
                  });
                }
              } catch (e) {
                // Ignorar errores de formato
              }
            }

            // Para eventos recurrentes, mostrar día de la semana
            if (typeof eventDate.dia_semana === 'number' && !fechaFormateada) {
              const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
              fechaFormateada = dias[eventDate.dia_semana] || '';
            }

            const hora =
              typeof eventDate.hora_inicio === 'string' && eventDate.hora_inicio.length >= 5
                ? eventDate.hora_inicio.slice(0, 5) // HH:MM
                : undefined;

            return (
              <Link
                key={rsvp.id || eventDate.id}
                to={`/social/fecha/${eventDate.id}?from=/me/rsvps`}
                style={{
                  display: 'block',
                  padding: '1.4rem 1.5rem',
                  background: colors.glass.strong,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.glass.medium}`,
                  textDecoration: 'none',
                  color: colors.light,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary[500];
                  e.currentTarget.style.boxShadow = `0 6px 16px rgba(0,0,0,0.25)`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.glass.medium;
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(135deg, rgba(250,204,21,0.12), rgba(59,130,246,0.08))',
                    opacity: 0.35,
                    pointerEvents: 'none',
                  }}
                />

                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: '1.2rem',
                        marginBottom: '0.35rem',
                        color: colors.light,
                      }}
                    >
                      {parentEvent.nombre}
                    </h3>

                    <div
                      style={{
                        display: 'grid',
                        gap: '0.25rem',
                        color: colors.gray[300],
                        fontSize: '0.875rem',
                      }}
                    >
                      {fechaFormateada && (
                        <div>
                          📅 {fechaFormateada}
                          {hora ? ` · ${hora}` : ''}
                        </div>
                      )}

                      {eventDate.lugar && (
                        <div>📍 {eventDate.lugar}</div>
                      )}

                      {eventDate.ciudad && (
                        <div>🏙️ {eventDate.ciudad}</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    {getRSVPBadge(rsvp.status || 'interesado')}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.35rem 0.8rem',
                        borderRadius: 999,
                        border: `1px solid ${colors.primary[500]}`,
                        background: 'rgba(15,23,42,0.7)',
                        fontSize: '0.8rem',
                        color: colors.primary[100],
                        fontWeight: 500,
                      }}
                    >
                      Ver detalles <span style={{ fontSize: '0.9rem' }}>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            border: '2px dashed rgba(255, 255, 255, 0.2)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h4
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: colors.light,
            }}
          >
            Sin eventos de interés por ahora
          </h4>
          <p
            style={{
              fontSize: '0.875rem',
              opacity: 0.7,
              marginBottom: '1.5rem',
              color: colors.light,
            }}
          >
            Explora eventos y marca los que te interesen para verlos aquí
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/explore')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🔍 Explorar Eventos
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}