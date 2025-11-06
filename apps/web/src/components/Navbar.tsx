import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/routes/registry';
import { useIsAdmin } from '../hooks/useRoleRequests';
import { useAuth } from '@/contexts/AuthProvider';
import { colors, typography, spacing, borderRadius, transitions } from '../theme/colors';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();

  const handleLogout = async () => {
    await signOut();
    navigate(routes.auth.login);
  };

  return (
    <nav
      className="nav-root"
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
      <style>{`
        @media (max-width: 768px) {
          .nav-root {
            position: sticky !important;
            top: 0 !important; bottom: auto; left: 0; right: 0;
            padding: .6rem .9rem !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.28) !important;
            min-height: 56px;
          }
          .nav-left { display: flex !important; }
          .nav-icons { gap: .35rem !important; }
          .nav-icon { font-size: 1.25rem !important; padding: .55rem !important; }
        }
      `}</style>
      <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

      {/* Nav Icons - Solo Admin Trending para Superadmins */}
      <div className="nav-icons" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Admin trending: solo superadmin */}
        {isAdmin && (
          <Link
            to="/admin/trending"
            aria-label="Trending Admin"
            title="Trending Admin"
            className="nav-icon"
            style={{ color: '#FFF', textDecoration: 'none', fontSize: '1.1rem', padding: '0.5rem', borderRadius: borderRadius.full }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            ⚙️
          </Link>
        )}
      </div>
    </nav>
  );
}

