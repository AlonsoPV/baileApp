import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useIsAdmin } from '@/hooks/useRoleRequests';
import { useMyRoleRequests } from '@/hooks/useRoles';

interface ProfileNavigationToggleProps {
  currentView: 'live' | 'edit';
  profileType: 'user' | 'organizer' | 'academy' | 'brand' | 'teacher';
  onSave?: () => void;
  isSaving?: boolean;
  saveDisabled?: boolean;
  showRoleToggle?: boolean;
  liveHref?: string;
  editHref?: string;
}

const colors = {
  light: '#F5F5F5',
  blue: '#1E88E5',
  coral: '#FF3D57',
  green: '#4CAF50',
};

export const ProfileNavigationToggle: React.FC<ProfileNavigationToggleProps> = ({
  currentView,
  profileType,
  onSave,
  isSaving = false,
  saveDisabled = false,
  showRoleToggle = true,
  liveHref,
  editHref,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: roles } = useUserRoles(user?.id);
  const { data: isSuperAdmin } = useIsAdmin();
  const { data: myReqs } = useMyRoleRequests();
  const qc = useQueryClient();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };

    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  const getLiveRoute = () => {
    if (liveHref) return liveHref;
    switch (profileType) {
      case 'user': return '/profile';
      case 'organizer': return '/profile/organizer';
      case 'academy': return '/profile/academy';
      case 'brand': return '/profile/brand';
      case 'teacher': return '/profile/teacher';
      // teacher live route
      default: return '/profile';
    }
  };

  const getEditRoute = () => {
    if (editHref) return editHref;
    switch (profileType) {
      case 'user': return '/profile/edit';
      case 'organizer': return '/profile/organizer/edit';
      case 'academy': return '/profile/academy/edit';
      case 'brand': return '/profile/brand/edit';
      case 'teacher': return '/profile/teacher/edit';
      default: return '/profile';
    }
  };

  const getProfileName = () => {
    switch (profileType) {
      case 'user': return 'Usuario';
      case 'organizer': return 'Organizador';
      case 'academy': return 'Academia';
      case 'teacher': return 'Maestro';
      case 'brand': return 'Marca';
      default: return 'Usuario';
    }
  };

  const getProfileIcon = () => {
    switch (profileType) {
      case 'user': return '👤';
      case 'organizer': return '🎤';
      case 'academy': return '🎓';
      case 'brand': return '🏷️';
      default: return '👤';
    }
  };

  // Definir roles disponibles
  const availableRoles = [
    { id: 'user', name: 'Usuario', icon: '👤', route: '/profile', available: true },
    { id: 'organizer', name: 'Organizador', icon: '🎤', route: '/profile/organizer', available: true },
    { id: 'academy', name: 'Academia', icon: '🎓', route: '/profile/academy', available: true },
    { id: 'teacher', name: 'Maestro', icon: '👨‍🏫', route: '/profile/teacher', available: true },
    { id: 'brand', name: 'Marca', icon: '🏷️', route: '/profile/brand', available: true },
  ];
  const slugForRoleId = (roleId: string) => {
    const map: Record<string, 'usuario'|'organizador'|'academia'|'maestro'|'marca'> = {
      user: 'usuario',
      organizer: 'organizador',
      academy: 'academia',
      teacher: 'maestro',
      brand: 'marca',
    };
    return map[roleId];
  };

  const hasRole = (roleId: string) => {
    const slug = slugForRoleId(roleId);
    if (!slug) return false;
    return !!roles?.some((r: any) => r.role_slug === slug || r.role === slug);
  };

  const hasApprovedRequest = (roleId: string) => {
    const slug = slugForRoleId(roleId);
    if (!slug) return false;
    return !!myReqs?.some((req: any) => (
      (req.role_slug === slug || req.role === slug) && (req.status === 'aprobado' || req.status === 'approved')
    ));
  };

  const getRequestRoute = (roleId: string) => {
    const map: Record<string, string> = {
      organizer: 'organizador',
      academy: 'academia',
      teacher: 'maestro',
      brand: 'marca',
      user: 'usuario',
    };
    const slug = map[roleId] || 'organizador';
    return `/app/roles/request?role=${slug}`;
  };


  const currentRole = availableRoles.find(role => role.id === profileType);
  const otherRoles = availableRoles.filter(role => role.id !== profileType);

  return (
    <div className="pnt-wrap" style={{
      position: 'sticky',
      top: '80px', // Justo debajo de la navbar
      
      zIndex: 1000,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1.5rem',
      borderRadius: '25px',
      background: 'rgba(18, 18, 18, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      width: 'fit-content',
    }}>
      <style>{`
        @media (max-width: 480px) {
          .pnt-wrap { padding: 8px 10px !important; gap: 6px !important; }
          .pnt-btn { padding: 8px 10px !important; font-size: 0.8rem !important; }
          .pnt-text { display: none !important; }
          .pnt-role-name { width: 100%; justify-content: center; margin-top: 4px; }
        }
      `}</style>
      {/* Botón Ver Live */}
      <button
        onClick={() => {
          if (user?.id) {
            qc.invalidateQueries({ queryKey: ['user_roles', user.id] });
            qc.invalidateQueries({ queryKey: ['role_requests_me', user.id] });
          }
          const target = getLiveRoute();
          const needsRole = ['organizer','academy','brand','teacher'].includes(profileType);
          if (!isSuperAdmin && needsRole && !(hasRole(profileType) || hasApprovedRequest(profileType))) {
            navigate(getRequestRoute(profileType));
          } else {
            navigate(target);
          }
        }}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          background: currentView === 'live' 
            ? 'linear-gradient(135deg, #4CAF50, #45a049)' 
            : 'rgba(255, 255, 255, 0.1)',
          color: currentView === 'live' ? 'white' : colors.light,
          border: currentView === 'live' 
            ? 'none' 
            : '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '0.9rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
        onMouseEnter={(e) => {
          if (currentView !== 'live') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentView !== 'live') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }
        }}
        className="pnt-btn"
      >
        <span>👁️</span>
        <span className="pnt-text"> Live</span>
      </button>

      {/* Botón Editar */}
      <button
        onClick={() => {
          if (user?.id) {
            qc.invalidateQueries({ queryKey: ['user_roles', user.id] });
            qc.invalidateQueries({ queryKey: ['role_requests_me', user.id] });
          }
          const target = getEditRoute();
          const needsRole = ['organizer','academy','brand','teacher'].includes(profileType);
          if (!isSuperAdmin && needsRole && !(hasRole(profileType) || hasApprovedRequest(profileType))) {
            navigate(getRequestRoute(profileType));
          } else {
            navigate(target);
          }
        }}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          background: currentView === 'edit' 
            ? 'linear-gradient(135deg, #1E88E5, #1976D2)' 
            : 'rgba(255, 255, 255, 0.1)',
          color: currentView === 'edit' ? 'white' : colors.light,
          border: currentView === 'edit' 
            ? 'none' 
            : '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '0.9rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
        onMouseEnter={(e) => {
          if (currentView !== 'edit') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentView !== 'edit') {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }
        }}
        className="pnt-btn"
      >
        <span>✏️</span>
        <span className="pnt-text">Editar</span>
      </button>

      {/* Botón Guardar (solo en modo edición) */}
      {currentView === 'edit' && onSave && (
        <div style={{
          height: '100%',
          width: '1px',
          background: 'rgba(255, 255, 255, 0.2)',
          margin: '0 0.5rem'
        }} />
      )}
      
      {currentView === 'edit' && onSave && (
        <button
          onClick={onSave}
          disabled={saveDisabled || isSaving}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            background: saveDisabled || isSaving 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'linear-gradient(135deg, #4CAF50, #45a049)',
            color: saveDisabled || isSaving 
              ? 'rgba(255, 255, 255, 0.5)' 
              : 'white',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: saveDisabled || isSaving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: saveDisabled || isSaving ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!saveDisabled && !isSaving) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!saveDisabled && !isSaving) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          className="pnt-btn"
        >
          <span>{isSaving ? '⏳' : '💾'}</span>
          <span className="pnt-text">{isSaving ? 'Guardando...' : 'Guardar'}</span>
        </button>
      )}

      {/* Dropdown de cambio de roles (solo en vista live) */}
      {currentView === 'live' && showRoleToggle && (
        <>
          <div style={{
            height: '100%',
            width: '1px',
            background: 'rgba(255, 255, 255, 0.2)',
            margin: '0 0.5rem'
          }} />
          
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                if (user?.id) {
                  qc.invalidateQueries({ queryKey: ['user_roles', user.id] });
                  qc.invalidateQueries({ queryKey: ['role_requests_me', user.id] });
                }
                setIsRoleDropdownOpen(!isRoleDropdownOpen);
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: colors.light,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              className="pnt-btn"
            >
              <span>🔄</span>
              <span className="pnt-text">Rol</span>
              <span style={{ 
                fontSize: '0.7rem',
                transform: isRoleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>
                ▾
              </span>
            </button>

            {/* Dropdown Menu */}
            {isRoleDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                marginTop: '0.5rem',
                background: 'rgba(18, 18, 18, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                overflow: 'hidden',
                minWidth: '200px'
              }}>
                {otherRoles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      console.log('🔄 Cambio de rol clickeado:', role.name, 'Ruta:', role.route);
                      if (!role.available) return;
                      if (isSuperAdmin || hasRole(role.id) || hasApprovedRequest(role.id)) {
                        navigate(role.route);
                      } else {
                        navigate(getRequestRoute(role.id));
                      }
                      setIsRoleDropdownOpen(false);
                    }}
                    disabled={!role.available}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: role.available ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
                      color: role.available ? colors.light : 'rgba(255, 255, 255, 0.3)',
                      border: 'none',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: role.available ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'background 0.2s',
                      textAlign: 'left',
                      opacity: role.available ? 1 : 0.5
                    }}
                    onMouseEnter={(e) => {
                      if (role.available) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (role.available) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{role.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span>{role.name}</span>
                      {!role.available && (
                        <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Próximamente</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Indicador de perfil (segunda fila en mobile) */}
      <div style={{ width: '100%' }} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem',
        color: 'rgba(255, 255, 255, 0.7)', fontWeight: '500'
      }} className="pnt-role-name">
        <span>{getProfileIcon()}</span>
        <span>{getProfileName()}</span>
      </div>
    </div>
  );
};
