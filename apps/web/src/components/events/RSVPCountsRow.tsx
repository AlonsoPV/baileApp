import React from "react";
import { motion } from "framer-motion";
import type { RSVPCount } from "../../types/events";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  green: '#10B981',
  dark: '#121212',
  light: '#F5F5F5',
};

interface RSVPCountsRowProps {
  counts?: RSVPCount;
  variant?: 'compact' | 'detailed';
}

export function RSVPCountsRow({ counts, variant = 'compact' }: RSVPCountsRowProps) {
  if (!counts) {
    return (
      <div style={{
        fontSize: '0.875rem',
        color: `${colors.light}66`,
        fontStyle: 'italic',
      }}>
        Sin RSVPs
      </div>
    );
  }

  const total = counts.voy + counts.interesado + counts.no_voy;

  if (variant === 'detailed') {
    return (
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            padding: '8px 12px',
            borderRadius: '16px',
            background: `${colors.green}cc`,
            border: `2px solid ${colors.green}`,
            color: colors.light,
            fontSize: '0.875rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: `0 2px 8px ${colors.green}66`,
          }}
        >
          <span style={{ fontSize: '1rem' }}>👍</span>
          Voy: <strong>{counts.voy}</strong>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            padding: '8px 12px',
            borderRadius: '16px',
            background: `${colors.orange}cc`,
            border: `2px solid ${colors.orange}`,
            color: colors.light,
            fontSize: '0.875rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: `0 2px 8px ${colors.orange}66`,
          }}
        >
          <span style={{ fontSize: '1rem' }}>👀</span>
          Interesado: <strong>{counts.interesado}</strong>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            padding: '8px 12px',
            borderRadius: '16px',
            background: `${colors.coral}cc`,
            border: `2px solid ${colors.coral}`,
            color: colors.light,
            fontSize: '0.875rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: `0 2px 8px ${colors.coral}66`,
          }}
        >
          <span style={{ fontSize: '1rem' }}>❌</span>
          No voy: <strong>{counts.no_voy}</strong>
        </motion.div>

        {total > 0 && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              padding: '8px 12px',
              borderRadius: '16px',
              background: `${colors.blue}cc`,
              border: `2px solid ${colors.blue}`,
              color: colors.light,
              fontSize: '0.875rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: `0 2px 8px ${colors.blue}66`,
            }}
          >
            <span style={{ fontSize: '1rem' }}>👥</span>
            Total: <strong>{total}</strong>
          </motion.div>
        )}
      </div>
    );
  }

  // variant === 'compact'
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '8px 16px',
        borderRadius: '20px',
        background: `${colors.dark}aa`,
        border: `1px solid ${colors.light}22`,
        fontSize: '0.875rem',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span style={{ fontSize: '1rem' }}>👍</span>
        <span style={{ fontWeight: '600' }}>Voy: <strong>{counts.voy}</strong></span>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span style={{ fontSize: '1rem' }}>👀</span>
        <span style={{ fontWeight: '600' }}>Interesado: <strong>{counts.interesado}</strong></span>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span style={{ fontSize: '1rem' }}>❌</span>
        <span style={{ fontWeight: '600' }}>No voy: <strong>{counts.no_voy}</strong></span>
      </div>

      {total > 0 && (
        <div style={{
          marginLeft: '8px',
          paddingLeft: '16px',
          borderLeft: `1px solid ${colors.light}33`,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ fontSize: '1rem' }}>👥</span>
          <span style={{ fontWeight: '700' }}>Total: <strong>{total}</strong></span>
        </div>
      )}
    </motion.div>
  );
}
