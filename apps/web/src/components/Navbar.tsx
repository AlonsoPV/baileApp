import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { theme } from '@theme/colors';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <nav
      style={{
        background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Hamburger Button (only when logged in) */}
        {user && onMenuToggle && (
          <button
            onClick={onMenuToggle}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ width: '24px', height: '3px', backgroundColor: '#FFF', borderRadius: '2px' }} />
            <div style={{ width: '24px', height: '3px', backgroundColor: '#FFF', borderRadius: '2px' }} />
            <div style={{ width: '24px', height: '3px', backgroundColor: '#FFF', borderRadius: '2px' }} />
          </button>
        )}

        {/* Logo/Title */}
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            color: '#FFF',
            fontSize: '1.5rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          BaileApp 💃
        </Link>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <>
            <Link
              to="/app/profile"
              style={{
                color: '#FFF',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                padding: '0.5rem 1rem',
                borderRadius: theme.radius.md,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Perfil 👤
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: theme.radius.md,
                padding: '0.5rem 1rem',
                color: '#FFF',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Salir 🚪
            </button>
          </>
        ) : (
          <>
            <Link
              to="/auth/login"
              style={{
                color: '#FFF',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                padding: '0.5rem 1rem',
                borderRadius: theme.radius.md,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Login
            </Link>
            <Link
              to="/auth/signup"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: theme.radius.md,
                padding: '0.5rem 1rem',
                color: '#FFF',
                fontSize: '0.875rem',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

