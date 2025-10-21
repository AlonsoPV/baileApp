import React from "react";
import { Link } from "react-router-dom";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface UserProfileLinkProps {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  variant?: 'chip' | 'card' | 'simple';
}

export function UserProfileLink({ 
  userId, 
  displayName, 
  avatarUrl, 
  variant = 'simple' 
}: UserProfileLinkProps) {
  const href = `/u/${userId}`;

  if (variant === 'chip') {
    return (
      <Link
        to={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '20px',
          background: `${colors.dark}cc`,
          border: `1px solid ${colors.light}22`,
          color: colors.light,
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: '600',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${colors.coral}cc`;
          e.currentTarget.style.borderColor = colors.coral;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${colors.dark}cc`;
          e.currentTarget.style.borderColor = `${colors.light}22`;
        }}
      >
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={displayName || 'Usuario'}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        )}
        <span>{displayName || 'Ver perfil'}</span>
      </Link>
    );
  }

  if (variant === 'card') {
    return (
      <Link
        to={href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          borderRadius: '12px',
          background: `${colors.dark}ee`,
          border: `1px solid ${colors.light}22`,
          color: colors.light,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${colors.dark}ff`;
          e.currentTarget.style.borderColor = colors.coral;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 8px 24px ${colors.coral}33`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${colors.dark}ee`;
          e.currentTarget.style.borderColor = `${colors.light}22`;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={displayName || 'Usuario'}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${colors.coral}44`,
            }}
          />
        )}
        <div>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            {displayName || 'Usuario'}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Ver perfil completo →
          </div>
        </div>
      </Link>
    );
  }

  // variant === 'simple'
  return (
    <Link
      to={href}
      style={{
        color: colors.coral,
        textDecoration: 'none',
        fontWeight: '600',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = colors.orange;
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = colors.coral;
        e.currentTarget.style.textDecoration = 'none';
      }}
    >
      {displayName || 'Ver perfil'}
    </Link>
  );
}
