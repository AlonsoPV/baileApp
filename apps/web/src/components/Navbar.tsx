import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/routes/registry';
import { useIsAdmin } from '../hooks/useRoleRequests';
import { useAuth } from '@/contexts/AuthProvider';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { colors, typography, spacing, borderRadius, transitions } from '../theme/colors';
import { SEO_ICON_URL } from '@/lib/seoConfig';
import { useUserProfile } from '@/hooks/useUserProfile';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();
  const { hasUnread, markAllAsRead } = useUnreadNotifications(user?.id);
  const { profile } = useUserProfile();

  const profileInitial = user?.email?.[0]?.toUpperCase() ?? '👤';
  const avatarUrl = profile?.avatar_url;

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
            padding: .55rem .7rem !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.28) !important;
            min-height: 54px;
          }
          .nav-left { 
            display: flex !important; 
            flex: 0 0 auto !important;
          }
          .nav-center {
            flex: 1 1 auto !important;
          }
          .nav-center-brand {
            gap: 0.45rem !important;
          }
          .nav-brand-title {
            font-size: 0.8rem !important;
            letter-spacing: 1.2px !important;
          }
          .nav-brand-tagline {
            font-size: 0.7rem !important;
          }
          .nav-icons { 
            gap: .3rem !important; 
            flex: 0 0 auto !important;
          }
          .nav-icon { 
            font-size: 1.1rem !important; 
            padding: .4rem !important; 
          }
          .nav-logo-img {
            width: 30px !important;
            height: 30px !important;
          }
        }

        @media (max-width: 480px) {
          .nav-root {
            padding: .5rem .6rem !important;
          }
          .nav-brand-tagline {
            display: none !important;
          }
        }

        .nav-profile-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.35);
          background: rgba(0,0,0,0.15);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-profile-button:hover {
          background: rgba(255,255,255,0.18);
        }

        .nav-profile-button .badge-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #ff3d57;
          box-shadow: 0 0 6px rgba(255,61,87,0.7);
        }

        .nav-login-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.15);
          color: #fff;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .nav-login-button:hover {
          background: rgba(255,255,255,0.25);
          border-color: rgba(255,255,255,0.5);
        }

        @media (max-width: 768px) {
          .nav-login-button {
            padding: 0.4rem 0.8rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
      <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
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

      </div>

      {/* Logo + Nombre centrado */}
      <div
        className="nav-center"
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Link
          to="/"
          className="nav-center-brand"
          style={{
            textDecoration: 'none',
            color: '#FFF',
            fontSize: '1.1rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            pointerEvents: 'auto',
          }}
        >
          <img
            src={SEO_ICON_URL}
            alt="Logo Dónde Bailar"
            className="nav-logo-img"
            style={{
              width: 34,
              height: 34,
              borderRadius: '999px',
              objectFit: 'cover',
              boxShadow: '0 4px 10px rgba(0,0,0,0.45)',
              border: '2px solid rgba(255,255,255,0.9)',
              background: 'rgba(0,0,0,0.35)',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 1.1,
            }}
          >
            <span
              className="nav-brand-title"
              style={{
                textTransform: 'uppercase',
                letterSpacing: 1.4,
                fontSize: '0.9rem',
              }}
            >
              Dónde Bailar MX
            </span>
            <span
              className="nav-brand-tagline"
              style={{
                fontSize: '0.78rem',
                opacity: 0.9,
              }}
            >
              Encuentra tu ritmo y tu espacio
            </span>
          </div>
        </Link>
      </div>

      {/* Nav Icons - Solo Admin Trending para Superadmins */}
      <div className="nav-icons" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end', flex: 1 }}>
        <Link
          to="/explore"
          aria-label="Inicio"
          title="Inicio"
          className="nav-icon"
          style={{ color: '#FFF', textDecoration: 'none', fontSize: '1.1rem', padding: '0.5rem', borderRadius: borderRadius.full }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          🏠
        </Link>

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

        {user ? (
          <button
            type="button"
            className="nav-profile-button"
            aria-label="Ir a mi perfil"
            onClick={async () => { await markAllAsRead(); navigate(routes.app.profile); }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span>{profileInitial}</span>
            )}
            {hasUnread && <span className="badge-dot" />}
          </button>
        ) : (
          <Link
            to={routes.auth.login}
            className="nav-login-button"
            aria-label="Iniciar sesión"
            title="Iniciar sesión"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </nav>
  );
}

