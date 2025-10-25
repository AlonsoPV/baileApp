import React from 'react';
import { BrandProduct } from '../../types/brand';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';

export default function ProductsGrid({ items }: { items: BrandProduct[] }) {
  if (!items || items.length === 0) return null;
  
  return (
    <section style={{ marginTop: spacing[8] }}>
      <h3 style={{
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semibold,
        marginBottom: spacing[3],
        color: colors.light
      }}>
        🛍️ Productos
      </h3>
      <div style={{
        display: 'grid',
        gap: spacing[4],
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
      }}>
        {items.map((p, i)=>(
          <a 
            key={p.id || i} 
            href={p.url_externa || '#'} 
            target="_blank" 
            rel="noreferrer"
            style={{
              display: 'block',
              borderRadius: borderRadius['2xl'],
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              color: 'inherit'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {p.imagen_url && (
              <img 
                src={p.imagen_url} 
                alt={p.titulo} 
                style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  objectFit: 'cover'
                }} 
              />
            )}
            <div style={{ padding: spacing[3] }}>
              <div style={{
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.base,
                color: colors.light,
                marginBottom: spacing[1]
              }}>
                {p.titulo}
              </div>
              {p.precio != null && (
                <div style={{
                  fontSize: typography.fontSize.sm,
                  opacity: 0.8,
                  color: colors.primary[500],
                  fontWeight: typography.fontWeight.medium
                }}>
                  {new Intl.NumberFormat(undefined, { 
                    style:'currency', 
                    currency: p.moneda||'MXN' 
                  }).format(p.precio)}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
