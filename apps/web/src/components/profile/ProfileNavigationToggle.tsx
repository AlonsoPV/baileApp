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

  // Determinar si el usuario tiene el perfil creado para este rol
  const hasProfileCreated = (roleId: string) => {
    // Usuario siempre tiene perfil
    if (roleId === 'user') return true;
    // TODO: Aquí podríamos verificar si existe el perfil en la BD
    // Por ahora asumimos que si está en live view, ya tiene perfil
    return currentView === 'live';
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

  // Verificar si un rol está realmente disponible (aprobado o es superadmin)
  const isRoleAvailable = (roleId: string) => {
    // Usuario siempre está disponible
    if (roleId === 'user') return true;
    // Superadmin puede acceder a todos los roles
    if (isSuperAdmin) return true;
    // Verificar si tiene el rol aprobado
    return hasRole(roleId) || hasApprovedRequest(roleId);
  };

  // Definir todos los roles posibles
  const allRoles = [
    { id: 'user', name: 'Usuario', icon: '👤', route: '/profile' },
    { id: 'organizer', name: 'Organizador', icon: '🎤', route: '/profile/organizer' },
    { id: 'academy', name: 'Academia', icon: '🎓', route: '/profile/academy' },
    { id: 'teacher', name: 'Maestro', icon: '👨‍🏫', route: '/profile/teacher' },
    { id: 'brand', name: 'Marca', icon: '🏷️', route: '/profile/brand' },
  ];

  // Filtrar solo roles disponibles para el usuario
  const availableRoles = allRoles.filter(role => isRoleAvailable(role.id));

  const getRequestRoute = (roleId: string) => {
    const map: Record<string, string> = {
      organizer: 'organizador',
      academy: 'academia',
      teacher: 'maestro',
      brand: 'marca',
    };
    const slug = map[roleId];
    if (!slug) return '/profile'; // usuario nunca solicita
    return `/app/roles/request?role=${slug}`;
  };


  const currentRole = availableRoles.find(role => role.id === profileType);
  // Mostrar TODOS los roles en el dropdown (disponibles y no disponibles)
  const otherRoles = allRoles.filter(role => role.id !== profileType);

  return (
    <div className="pnt-wrap" style={{
      position: 'sticky',
      top: '80px', // Justo debajo de la navbar
      zIndex: 10,
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
      
      {/* Botón Toggle Edit/Live (unificado) */}
      <button
        onClick={() => {
          if (user?.id) {
            // Invalidar todas las queries del perfil para forzar refetch
            qc.invalidateQueries({ queryKey: ['user_roles', user.id] });
            qc.invalidateQueries({ queryKey: ['role_requests_me', user.id] });
            qc.invalidateQueries({ queryKey: ['user', 'profile', user.id] });
            qc.invalidateQueries({ queryKey: ['user-media', user.id] });
            qc.invalidateQueries({ queryKey: ['organizer', 'mine'] });
            qc.invalidateQueries({ queryKey: ['academy', 'mine'] });
            qc.invalidateQueries({ queryKey: ['teacher', 'mine'] });
            qc.invalidateQueries({ queryKey: ['brand', 'mine'] });
          }
          
          // Si estoy en edit, ir a live. Si estoy en live, ir a edit.
          const target = currentView === 'edit' ? getLiveRoute() : getEditRoute();
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
            ? 'linear-gradient(135deg, #4CAF50, #45a049)' 
            : 'linear-gradient(135deg, #1E88E5, #1976D2)',
          color: 'white',
          border: 'none',
          fontSize: '0.9rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        className="pnt-btn"
      >
        <span>{currentView === 'edit' ? '👁️' : '✏️'}</span>
        <span className="pnt-text">{currentView === 'edit' ? 'Live' : 'Editar'}</span>
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
              <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Vista:</span>
              <span>{getProfileIcon()}</span>
              <span className="pnt-text">{getProfileName()}</span>
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
                right: '0',
                marginTop: '0.5rem',
                background: 'rgba(18, 18, 18, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                overflow: 'hidden',
                minWidth: '220px'
              }}>
                {otherRoles.map((role) => {
                  const isAvailable = isRoleAvailable(role.id);
                  
                  return (
                    <div key={role.id} style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <span style={{ fontSize: '1.1rem' }}>{role.icon}</span>
                        <span style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: '500',
                          color: isAvailable ? colors.light : 'rgba(255, 255, 255, 0.5)'
                        }}>
                          {role.name}
                        </span>
                      </div>

                      {isAvailable ? (
                        // Botón para ir al perfil (Live si existe, Edit si no)
                        <button
                          onClick={() => {
                            console.log('🔄 Cambio de rol clickeado:', role.name, 'Ruta:', role.route);
                            // Si el usuario tiene el rol aprobado, ir a la ruta del rol
                            // La pantalla Live del rol se encargará de redirigir a Edit si no tiene perfil
                            navigate(role.route);
                            setIsRoleDropdownOpen(false);
                          }}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '12px',
                            background: 'rgba(76, 175, 80, 0.2)',
                            border: '1px solid rgba(76, 175, 80, 0.4)',
                            color: '#4CAF50',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(76, 175, 80, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(76, 175, 80, 0.2)';
                          }}
                        >
                          Ver
                        </button>
                      ) : (
                        // Botón para solicitar rol
                        <button
                          onClick={() => {
                            navigate(getRequestRoute(role.id));
                            setIsRoleDropdownOpen(false);
                          }}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '12px',
                            background: 'rgba(229, 57, 53, 0.2)',
                            border: '1px solid rgba(229, 57, 53, 0.4)',
                            color: '#E53935',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(229, 57, 53, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(229, 57, 53, 0.2)';
                          }}
                        >
                          Solicitar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
