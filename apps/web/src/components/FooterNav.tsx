import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';

export const FooterNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    {
      id: 'explore',
      icon: '🔍',
      label: 'Explorar',
      path: '/app/explore',
      requiresAuth: false
    },
    {
      id: 'challenges',
      icon: '🏆',
      label: 'Retos',
      path: '/challenges',
      requiresAuth: false
    },
    {
      id: 'trending',
      icon: '📈',
      label: 'Trending',
      path: '/trending',
      requiresAuth: false
    },
    {
      id: 'profile',
      icon: '👤',
      label: 'Perfil',
      path: '/profile',
      requiresAuth: true
    }
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.requiresAuth && !user) {
      navigate('/auth/login');
      return;
    }
    navigate(item.path);
  };

  return (
    <>
      <style>{`
        .footer-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(18, 18, 18, 0.98);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
          padding: env(safe-area-inset-bottom, 0) 0 0;
        }

        .footer-nav-content {
          display: flex;
          justify-content: space-around;
          align-items: center;
          max-width: 600px;
          margin: 0 auto;
          padding: 0.5rem 0;
        }

        .footer-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.6);
          min-width: 70px;
        }

        .footer-nav-item:hover {
          color: rgba(255, 255, 255, 0.9);
          transform: translateY(-2px);
        }

        .footer-nav-item.active {
          color: #fff;
        }

        .footer-nav-icon {
          font-size: 1.5rem;
          transition: all 0.2s ease;
        }

        .footer-nav-item.active .footer-nav-icon {
          transform: scale(1.2);
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
        }

        .footer-nav-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .footer-nav-item.active .footer-nav-label {
          background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Spacer para evitar que el contenido quede debajo del footer */
        .footer-spacer {
          height: 80px;
        }

        /* Desktop y Laptop */
        @media (min-width: 769px) {
          .footer-nav-content {
            max-width: 800px;
            padding: 0.75rem 0;
          }
          
          .footer-nav-item {
            padding: 0.75rem 1.5rem;
            min-width: 90px;
          }

          .footer-nav-icon {
            font-size: 1.6rem;
          }

          .footer-nav-label {
            font-size: 0.75rem;
          }
        }

        /* Tablet */
        @media (max-width: 768px) {
          .footer-nav-content {
            padding: 0.75rem 0;
          }
          
          .footer-nav-item {
            padding: 0.5rem 0.75rem;
            min-width: 60px;
          }

          .footer-nav-icon {
            font-size: 1.4rem;
          }

          .footer-nav-label {
            font-size: 0.65rem;
          }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .footer-nav-item {
            padding: 0.5rem 0.5rem;
            min-width: 50px;
          }

          .footer-nav-icon {
            font-size: 1.3rem;
          }

          .footer-nav-label {
            font-size: 0.6rem;
          }
        }
      `}</style>

      <nav className="footer-nav">
        <div className="footer-nav-content">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`footer-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
              aria-label={item.label}
            >
              <span className="footer-nav-icon">{item.icon}</span>
              <span className="footer-nav-label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export const FooterSpacer: React.FC = () => {
  return <div className="footer-spacer" />;
};

