import React from "react";
import { motion } from "framer-motion";

const colors = {
  dark: '#121212',
  light: '#F5F5F5',
};

interface ProfileHeroProps {
  coverUrl?: string;
  title: string;
  subtitle?: string;
  chipsLeft?: React.ReactNode[];
  chipsRight?: React.ReactNode[];
  ctaSlot?: React.ReactNode;
}

export function ProfileHero({
  coverUrl,
  title,
  subtitle,
  chipsLeft = [],
  chipsRight = [],
  ctaSlot
}: ProfileHeroProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '360px',
        background: colors.dark,
        color: colors.light,
        borderRadius: '0 0 24px 24px',
        overflow: 'hidden',
      }}
    >
      {/* Cover Image */}
      <img
        src={coverUrl || "/default-cover.jpg"}
        alt={title}
        style={{
          width: '100%',
          height: '360px',
          objectFit: 'cover',
          opacity: 0.7,
        }}
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/800x360/121212/F5F5F5?text=Cover';
        }}
      />

      {/* Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to top, ${colors.dark}ee 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            margin: 0,
          }}
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              opacity: 0.85,
              fontSize: '1rem',
              textShadow: '0 1px 5px rgba(0,0,0,0.5)',
              margin: 0,
            }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Chips */}
        {(chipsLeft.length > 0 || chipsRight.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              marginTop: '12px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {chipsLeft}
            {chipsRight}
          </motion.div>
        )}

        {/* CTA Slot */}
        {ctaSlot && (
          <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
            {ctaSlot}
          </div>
        )}
      </div>
    </div>
  );
}
