import React from "react";
import { motion } from "framer-motion";
import { RSVPCount } from "../types/events";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  green: '#10B981',
  dark: '#121212',
  light: '#F5F5F5',
};

interface RSVPCounterProps {
  counts: RSVPCount;
  showTotal?: boolean;
  variant?: 'compact' | 'detailed';
}

export function RSVPCounter({ counts, showTotal = true, variant = 'compact' }: RSVPCounterProps) {
  const total = counts.voy + counts.interesado + counts.no_voy;

  if (variant === 'detailed') {
    return (
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            padding: '6px 12px',
            borderRadius: '16px',
            background: `${colors.green}cc`,
            border: `2px solid ${colors.green}`,
            color: colors.light,
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>✅</span>
          {counts.voy}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            padding: '6px 12px',
            borderRadius: '16px',
            background: `${colors.orange}cc`,
            border: `2px solid ${colors.orange}`,
            color: colors.light,
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>🤔</span>
          {counts.interesado}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            padding: '6px 12px',
            borderRadius: '16px',
            background: `${colors.coral}cc`,
            border: `2px solid ${colors.coral}`,
            color: colors.light,
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>❌</span>
          {counts.no_voy}
        </motion.div>

        {showTotal && total > 0 && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              background: `${colors.blue}cc`,
              border: `2px solid ${colors.blue}`,
              color: colors.light,
              fontSize: '0.75rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>👥</span>
            {total}
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
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '20px',
        background: `${colors.dark}aa`,
        border: `1px solid ${colors.light}22`,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span style={{ fontSize: '0.875rem' }}>✅</span>
        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{counts.voy}</span>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span style={{ fontSize: '0.875rem' }}>🤔</span>
        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{counts.interesado}</span>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span style={{ fontSize: '0.875rem' }}>❌</span>
        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{counts.no_voy}</span>
      </div>

      {showTotal && total > 0 && (
        <div style={{
          marginLeft: '8px',
          paddingLeft: '8px',
          borderLeft: `1px solid ${colors.light}33`,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ fontSize: '0.875rem' }}>👥</span>
          <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>{total}</span>
        </div>
      )}
    </motion.div>
  );
}
