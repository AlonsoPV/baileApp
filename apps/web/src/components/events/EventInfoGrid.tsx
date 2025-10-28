import React from 'react';
import { colors as themeColors } from '../../theme/colors';

type CronoItem = { titulo?: string; inicio?: string; fin?: string; nivel?: string; tipo?: string };
type CostoItem = { nombre?: string; regla?: string; tipo?: string; precio?: number | null };

type Props = {
  date: {
    lugar?: string | null;
    direccion?: string | null;
    ciudad?: string | null;
    referencias?: string | null;
    requisitos?: string | null;
    cronograma?: CronoItem[] | null;
    costos?: CostoItem[] | null;
  };
};

export default function EventInfoGrid({ date }: Props) {
  const colors = themeColors;

  return (
    <div className="two-col-grid">
      {(date.lugar || date.direccion || date.ciudad) && (
        <div
          style={{
            padding: '16px',
            background: `${colors.light}11`,
            borderRadius: '12px',
            border: `1px solid ${colors.light}22`,
          }}
        >
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: colors.light,
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            📍 Ubicación
          </h3>
          {date.lugar && (
            <p
              style={{ fontSize: '1rem', color: colors.light, opacity: 0.9, marginBottom: '4px', fontWeight: '600' }}
            >
              {date.lugar}
            </p>
          )}
          {date.direccion && (
            <p style={{ fontSize: '0.9rem', color: colors.light, opacity: 0.8, marginBottom: '4px' }}>{date.direccion}</p>
          )}
          {date.ciudad && <p style={{ fontSize: '0.9rem', color: colors.light, opacity: 0.7 }}>{date.ciudad}</p>}
          {date.referencias && (
            <p
              style={{ fontSize: '0.9rem', color: colors.light, opacity: 0.8, marginTop: '8px', fontStyle: 'italic' }}
            >
              💡 {date.referencias}
            </p>
          )}
        </div>
      )}

      {date.requisitos && (
        <div
          style={{
            padding: '16px',
            background: `${colors.light}11`,
            borderRadius: '12px',
            border: `1px solid ${colors.light}22`,
          }}
        >
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: colors.light,
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            📋 Requisitos
          </h3>
          <p style={{ fontSize: '1rem', color: colors.light, opacity: 0.9, lineHeight: 1.5, margin: 0 }}>
            {date.requisitos}
          </p>
        </div>
      )}

      {date.cronograma && date.cronograma.length > 0 && (
        <div
          style={{
            background: `${colors.dark}66`,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${colors.light}22`,
          }}
        >
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: colors.light,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            📅 Cronograma
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {date.cronograma.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  background: `${colors.dark}44`,
                  borderRadius: '12px',
                  border: `1px solid ${colors.light}22`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ fontSize: '1.5rem', minWidth: '40px' }}>
                  {item.tipo === 'clase' ? '📚' : item.tipo === 'show' ? '🎭' : '📋'}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: colors.light, marginBottom: '4px' }}>
                    {item.titulo}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '1rem', color: colors.light, opacity: 0.8 }}>
                      🕐 {item.inicio} {item.fin ? `- ${item.fin}` : ''}
                    </span>
                    {item.nivel && (
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          background: `${colors.light}33`,
                          color: colors.light,
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        {item.nivel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {date.costos && date.costos.length > 0 && (
        <div
          style={{
            background: `${colors.dark}66`,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${colors.light}22`,
          }}
        >
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: colors.light,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            💰 Costos y Promociones
          </h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {date.costos.map((costo, index) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  background: `${colors.dark}44`,
                  borderRadius: '12px',
                  border: `1px solid ${colors.light}22`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: colors.light, marginBottom: '4px' }}>
                    {costo.nombre}
                  </h3>
                  {costo.regla && (
                    <p style={{ fontSize: '0.9rem', color: colors.light, opacity: 0.8, margin: 0 }}>{costo.regla}</p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {costo.tipo === 'preventa' ? '🎫' : costo.tipo === 'taquilla' ? '💰' : '🎁'}
                  </span>
                  <span style={{ fontSize: '1.3rem', fontWeight: '700', color: colors.light }}>
                    {costo.precio !== undefined && costo.precio !== null ? `$${costo.precio.toLocaleString()}` : 'Gratis'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


