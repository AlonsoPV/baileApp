import { Link } from 'react-router-dom';
import { useMyRSVPs } from '../../hooks/useMyRSVPs';
import { colors, spacing, borderRadius } from '../../theme/colors';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function MyRSVPsScreen() {
  const { data: rsvps, isLoading } = useMyRSVPs();

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
      interesado: { bg: '#FEF3C7', color: '#92400E', label: '⭐ Interesado' },
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
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1000px', 
      margin: '0 auto',
      color: colors.light,
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>
        📅 Mis RSVPs
      </h1>
      
      {rsvps && rsvps.length > 0 ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {rsvps.map((rsvp: any) => {
            const eventDate = rsvp.date;
            const parentEvent = rsvp.parent;

            if (!eventDate || !parentEvent) return null;

            const fechaDate = new Date(eventDate.fecha);
            const fechaFormateada = format(fechaDate, "d 'de' MMM, yyyy", { locale: es });

            return (
              <Link
                key={rsvp.id}
                to={`/social/fecha/${eventDate.id}`}
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  background: colors.glass.strong,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.glass.medium}`,
                  textDecoration: 'none',
                  color: colors.light,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary[500];
                  e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.1)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.glass.medium;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      marginBottom: '0.5rem',
                      color: colors.light,
                    }}>
                      {parentEvent.nombre}
                    </h3>
                    
                    <div style={{ 
                      display: 'grid', 
                      gap: '0.25rem',
                      color: colors.gray[400],
                      fontSize: '0.875rem',
                    }}>
                      <div>📅 {fechaFormateada}</div>
                      
                      {eventDate.hora_inicio && (
                        <div>🕐 {eventDate.hora_inicio}</div>
                      )}

                      {eventDate.lugar && (
                        <div>📍 {eventDate.lugar}</div>
                      )}

                      {eventDate.ciudad && (
                        <div>🏙️ {eventDate.ciudad}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    {getRSVPBadge(rsvp.my?.status || 'interesado')}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{ 
          padding: '3rem',
          background: colors.glass.strong,
          borderRadius: borderRadius.lg,
          textAlign: 'center',
          border: `1px solid ${colors.glass.medium}`,
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            No tienes RSVPs
          </h2>
          <p style={{ 
            color: colors.gray[400], 
            marginBottom: '2rem',
            fontSize: '1.125rem',
          }}>
            Explora eventos y únete a los que te interesen
          </p>
          <Link
            to="/app/profile"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: colors.primary[500],
              color: '#fff',
              textDecoration: 'none',
              borderRadius: borderRadius.md,
              fontWeight: '600',
            }}
          >
            Explorar Eventos
          </Link>
        </div>
      )}
    </div>
  );
}