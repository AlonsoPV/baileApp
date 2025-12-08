import React from 'react';

interface ProfileSkeletonProps {
  variant?: 'user' | 'organizer' | 'academy' | 'teacher';
  className?: string;
}

/**
 * Skeleton específico para perfiles
 * Diferentes variantes según el tipo de perfil
 */
export function ProfileSkeleton({ variant = 'user', className = '' }: ProfileSkeletonProps) {
  return (
    <div
      className={`profile-skeleton ${className}`}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)',
        padding: '2rem',
      }}
    >
      {/* Header skeleton */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: variant === 'academy' ? '200px 1fr' : '150px 1fr',
            gap: '2rem',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          {/* Avatar skeleton */}
          <div
            style={{
              width: variant === 'academy' ? '200px' : '150px',
              height: variant === 'academy' ? '200px' : '150px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          </div>

          {/* Info skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                height: '32px',
                width: '60%',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
              }}
            />
            <div
              style={{
                height: '20px',
                width: '40%',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '28px',
                    width: '80px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.06)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content sections skeleton */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              minHeight: '200px',
            }}
          >
            <div
              style={{
                height: '24px',
                width: '30%',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                marginBottom: '1rem',
              }}
            />
            <div
              style={{
                height: '16px',
                width: '100%',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                marginBottom: '0.5rem',
              }}
            />
            <div
              style={{
                height: '16px',
                width: '80%',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @media (max-width: 768px) {
          .profile-skeleton > div > div:first-child {
            grid-template-columns: 1fr !important;
            justify-items: center;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default ProfileSkeleton;

