import React from 'react';

interface SubtleLoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

/**
 * Loader pequeño y discreto para usar en refetches
 * No intrusivo, solo indica que hay actividad
 */
export function SubtleLoader({ size = 'small', color = 'rgba(30, 136, 229, 0.8)', className = '' }: SubtleLoaderProps) {
  const sizes = {
    small: '12px',
    medium: '16px',
    large: '20px',
  };

  return (
    <div
      className={`subtle-loader ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: sizes[size],
          height: sizes[size],
          border: `2px solid ${color}40`,
          borderTop: `2px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SubtleLoader;

