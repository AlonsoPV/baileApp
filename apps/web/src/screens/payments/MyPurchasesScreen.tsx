import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMyPurchases } from '@/hooks/useMyPurchases';
import { colors, spacing, borderRadius } from '@/theme/colors';
import { useNavigate } from 'react-router-dom';

export default function MyPurchasesScreen() {
  const { data: purchases, isLoading } = useMyPurchases();
  const navigate = useNavigate();

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return '';
      return format(d, "d 'de' MMM, yyyy", { locale: es });
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: colors.light,
        }}
      >
        Cargando tus compras...
      </div>
    );
  }

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

      <h1
        style={{
          fontSize: '2rem',
          marginBottom: '0.5rem',
        }}
      >
        🧾 Mis compras
      </h1>
      <p
        style={{
          marginBottom: '2rem',
          color: colors.gray[400],
        }}
      >
        Aquí verás las clases, boletos y eventos que has pagado a través de Stripe.
      </p>

      {purchases && purchases.length > 0 ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {purchases.map((item) => {
            const isClass = item.kind === 'clase';
            const icon = isClass ? '🕺' : '🎟️';
            const label = isClass ? 'Clase' : 'Evento';

            const mainName =
              item.academyName ||
              item.teacherName ||
              item.organizerName ||
              null;

            const dateLabel = formatDate(item.date || item.createdAt);

            return (
              <div
                key={item.id}
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                    <div
                      style={{
                        fontSize: '1.75rem',
                        lineHeight: 1,
                      }}
                    >
                      {icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontSize: '1.25rem',
                          marginBottom: '0.25rem',
                          color: colors.light,
                        }}
                      >
                        {item.title}
                      </h3>
                      <div
                        style={{
                          display: 'grid',
                          gap: '0.25rem',
                          color: colors.gray[400],
                          fontSize: '0.875rem',
                        }}
                      >
                        <div>
                          <strong>{label}</strong>
                          {dateLabel ? ` · ${dateLabel}` : ''}
                        </div>
                        {mainName && (
                          <div>
                            {isClass ? 'Academia/Maestro:' : 'Organizador:'}{' '}
                            {mainName}
                          </div>
                        )}
                        <div>
                          Costo:{' '}
                          <span style={{ color: colors.gray[300] }}>
                            {item.amountMxn != null
                              ? `$${item.amountMxn.toFixed(2)} MXN`
                              : 'ver recibo enviado por Stripe a tu correo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: colors.gray[500],
                      textAlign: 'right',
                    }}
                  >
                    Registrado el{' '}
                    {formatDate(item.createdAt) || 'fecha no disponible'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: '3rem',
            background: colors.glass.strong,
            borderRadius: borderRadius.lg,
            textAlign: 'center',
            border: `1px solid ${colors.glass.medium}`,
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              marginBottom: '1rem',
            }}
          >
            Aún no tienes compras registradas
          </h2>
          <p
            style={{
              color: colors.gray[400],
              marginBottom: '2rem',
              fontSize: '1.125rem',
            }}
          >
            Cuando pagues clases o eventos desde Donde Bailar MX,
            tus compras aparecerán aquí automáticamente.
          </p>
          <button
            onClick={() => navigate('/explore')}
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: colors.primary[500],
              color: '#fff',
              textDecoration: 'none',
              borderRadius: borderRadius.md,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Explorar clases y eventos
          </button>
        </div>
      )}
    </div>
  );
}


