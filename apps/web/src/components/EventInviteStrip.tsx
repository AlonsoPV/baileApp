import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  dark: '#121212',
  light: '#F5F5F5',
};

interface EventInviteItem {
  title: string;
  date: string;
  place?: string;
  href: string;
  cover?: string;
}

export function EventInviteStrip({ items }:{ items: EventInviteItem[] }) {
  if (!items?.length) return null;
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{ marginTop: '32px', marginBottom: '32px' }}
    >
      {/* Header con gradiente */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.coral}22, ${colors.orange}22)`,
        padding: '20px',
        borderRadius: '16px 16px 0 0',
        border: `1px solid ${colors.coral}33`,
        borderBottom: 'none',
      }}>
        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          margin: 0,
          color: colors.light,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{
            fontSize: '2rem',
            background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            🎫
          </span>
          Acompáñame a estos eventos
        </h2>
        <p style={{
          marginTop: '8px',
          opacity: 0.7,
          fontSize: '0.95rem',
        }}>
          {items.length} {items.length === 1 ? 'evento' : 'eventos'} próximos
        </p>
      </div>
      
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '20px',
          padding: '24px',
          background: `${colors.dark}aa`,
          borderRadius: '0 0 16px 16px',
          border: `1px solid ${colors.coral}33`,
          borderTop: 'none',
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.coral} ${colors.dark}`,
        }}
      >
        {items.map((ev, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            style={{ minWidth: '300px' }}
          >
            <Link
              to={ev.href}
              style={{
                display: 'block',
                background: `${colors.dark}ee`,
                borderRadius: '16px',
                overflow: 'hidden',
                textDecoration: 'none',
                color: colors.light,
                border: `2px solid ${colors.coral}44`,
                boxShadow: `0 4px 16px ${colors.coral}33`,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.coral;
                e.currentTarget.style.boxShadow = `0 12px 32px ${colors.coral}66`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${colors.coral}44`;
                e.currentTarget.style.boxShadow = `0 4px 16px ${colors.coral}33`;
              }}
            >
              {/* Cover Image */}
              <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                {ev.cover ? (
                  <>
                    <img 
                      src={ev.cover} 
                      alt={ev.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(to bottom, transparent, ${colors.dark}aa)`,
                    }} />
                  </>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                  }}>
                    🎉
                  </div>
                )}
                
                {/* Date Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: colors.coral,
                  color: colors.light,
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  textTransform: 'uppercase',
                }}>
                  {ev.date}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '16px' }}>
                <h3 style={{ 
                  color: colors.light, 
                  fontWeight: '700',
                  fontSize: '1.2rem',
                  marginBottom: '8px',
                  lineHeight: 1.2,
                }}>
                  {ev.title}
                </h3>
                {ev.place && (
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: `${colors.light}99`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span style={{ fontSize: '1rem' }}>📍</span>
                    {ev.place}
                  </div>
                )}
                
                {/* CTA */}
                <div style={{
                  marginTop: '12px',
                  padding: '10px',
                  borderRadius: '12px',
                  background: `${colors.coral}22`,
                  border: `1px solid ${colors.coral}44`,
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: colors.coral,
                }}>
                  ✅ Voy a este evento
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
