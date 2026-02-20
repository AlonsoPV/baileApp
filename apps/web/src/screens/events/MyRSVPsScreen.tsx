import { Link, useNavigate } from 'react-router-dom';
import { useUserRSVPEvents, useRemoveRSVP } from '../../hooks/useRSVP';
import { supabase } from '../../lib/supabase';
import { isEventDateExpired } from '../../utils/eventDateExpiration';
import { colors, borderRadius } from '../../theme/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';

export function MyRSVPsScreen() {
  const { data: rsvpEvents, isLoading } = useUserRSVPEvents();
  const removeRSVP = useRemoveRSVP();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // On-read cleanup: trigger server-side cleanup when user opens RSVPs screen
  React.useEffect(() => {
    supabase.rpc('cleanup_expired_rsvps').then(({ error }) => {
      if (error) console.warn('[MyRSVPsScreen] cleanup_expired_rsvps:', error?.message);
    });
  }, []);

  const availableRsvpEvents = React.useMemo(() => {
    const filtered = (rsvpEvents || []).filter((r: any) => !isEventDateExpired(r.events_date));
    return filtered.sort((a: any, b: any) => {
      const fa = (a.events_date?.fecha || '') as string;
      const fb = (b.events_date?.fecha || '') as string;
      return fa.localeCompare(fb);
    });
  }, [rsvpEvents]);

  const handleRemove = async (e: React.MouseEvent, eventDateId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeRSVP.mutateAsync(eventDateId);
    } catch (err) {
      console.error('Error removing RSVP:', err);
    }
  };

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
      going: { bg: '#D1FAE5', color: '#065F46', label: '✅ Asistiré' },
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
          ← {t('back')}
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
        <h1 style={{ fontSize: '2rem' }}>📅 {t('my_rsvps')}</h1>
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

            let fechaFormateada = '';
            if (eventDate.fecha) {
              try {
                const fechaDate = new Date(eventDate.fecha);
                if (!Number.isNaN(fechaDate.getTime())) {
                  fechaFormateada = format(fechaDate, "d 'de' MMM, yyyy", { locale: es });
                }
              } catch {
                // ignore
              }
            }
            if (typeof eventDate.dia_semana === 'number' && !fechaFormateada) {
              const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
              fechaFormateada = dias[eventDate.dia_semana] || '';
            }

            const hora =
              typeof eventDate.hora_inicio === 'string' && eventDate.hora_inicio.length >= 5
                ? eventDate.hora_inicio.slice(0, 5)
                : undefined;

            const isRemoving = removeRSVP.isPending;

            return (
              <div
                key={rsvp.id || eventDate.id}
                style={{
                  padding: '1.4rem 1.5rem',
                  background: colors.glass.strong,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.glass.medium}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(250,204,21,0.12), rgba(59,130,246,0.08))',
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
                  <Link
                    to={`/social/fecha/${eventDate.id}?from=/me/rsvps`}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
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
                      {eventDate.lugar && <div>📍 {eventDate.lugar}</div>}
                      {eventDate.ciudad && <div>🏙️ {eventDate.ciudad}</div>}
                    </div>
                  </Link>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    {getRSVPBadge(rsvp.status || 'interesado')}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => handleRemove(e, eventDate.id)}
                        disabled={isRemoving}
                        style={{
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: '#FCA5A5',
                          background: 'rgba(248, 113, 113, 0.2)',
                          border: '1px solid rgba(248, 113, 113, 0.5)',
                          borderRadius: 8,
                          cursor: isRemoving ? 'not-allowed' : 'pointer',
                          opacity: isRemoving ? 0.6 : 1,
                        }}
                      >
                        {t('not_interested')}
                      </button>
                      <Link
                        to={`/social/fecha/${eventDate.id}?from=/me/rsvps`}
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
                          textDecoration: 'none',
                        }}
                      >
                        {t('view_details')} →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
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
            🔍 {t('explore_events')}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
