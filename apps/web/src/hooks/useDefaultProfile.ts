import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserProfile } from './useUserProfile';
import { useMyOrganizer } from './useOrganizer';
import { useAcademyMy } from './useAcademyMy';
import { useTeacherMy } from './useTeacher';

export type ProfileType = 'user' | 'organizer' | 'academy' | 'teacher' | 'brand';

export interface ProfileOption {
  id: ProfileType;
  name: string;
  icon: string;
  route: string;
  available: boolean;
  hasProfile: boolean;
}

export function useDefaultProfile() {
  const { user } = useAuth();
  const { profile: userProfile } = useUserProfile();
  const { data: organizerProfile } = useMyOrganizer();
  const { data: academyProfile } = useAcademyMy();
  const { data: teacherProfile } = useTeacherMy();
  
  const [defaultProfile, setDefaultProfile] = useState<ProfileType>('user');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar perfil por defecto desde localStorage
  useEffect(() => {
    const loadDefaultProfile = () => {
      if (user?.id) {
        const saved = localStorage.getItem(`default_profile_${user.id}`);
        if (saved && ['user', 'organizer', 'academy', 'teacher', 'brand'].includes(saved)) {
          setDefaultProfile(saved as ProfileType);
        }
        setIsLoading(false);
      }
    };

    // Cargar inicialmente
    loadDefaultProfile();

    // Escuchar cambios en localStorage (para cambios en la misma pestaña)
    const handleStorageChange = (e: StorageEvent) => {
      if (user?.id && e.key === `default_profile_${user.id}` && e.newValue) {
        if (['user', 'organizer', 'academy', 'teacher', 'brand'].includes(e.newValue)) {
          setDefaultProfile(e.newValue as ProfileType);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // También verificar periódicamente (por si el cambio fue en la misma pestaña)
    const interval = setInterval(() => {
      if (user?.id) {
        const saved = localStorage.getItem(`default_profile_${user.id}`);
        if (saved && ['user', 'organizer', 'academy', 'teacher', 'brand'].includes(saved)) {
          setDefaultProfile(prev => {
            if (prev !== saved) {
              return saved as ProfileType;
            }
            return prev;
          });
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user?.id]);

  // Guardar perfil por defecto en localStorage
  const updateDefaultProfile = (profileType: ProfileType) => {
    if (user?.id) {
      localStorage.setItem(`default_profile_${user.id}`, profileType);
      setDefaultProfile(profileType);
    }
  };

  // Función para verificar si un perfil está realmente configurado
  const isUserProfileConfigured = (profile: any): boolean => {
    // El perfil de usuario siempre está configurado si existe el registro
    // (todos los usuarios tienen un perfil por defecto)
    return !!profile;
  };

  const isOrganizerProfileConfigured = (profile: any): boolean => {
    if (!profile) return false;
    return !!(profile.nombre_publico && profile.nombre_publico.trim().length > 0);
  };

  const isAcademyProfileConfigured = (profile: any): boolean => {
    if (!profile) return false;
    return !!(profile.nombre_publico && profile.nombre_publico.trim().length > 0);
  };

  const isTeacherProfileConfigured = (profile: any): boolean => {
    if (!profile) return false;
    return !!(profile.nombre_publico && profile.nombre_publico.trim().length > 0);
  };

  // Obtener opciones de perfiles disponibles
  const getProfileOptions = (): ProfileOption[] => {
    return [
      {
        id: 'user',
        name: 'Usuario',
        icon: '👤',
        // Usar slug explícito para el live de usuario
        route: '/profile/user',
        available: true,
        hasProfile: isUserProfileConfigured(userProfile)
      },
      {
        id: 'organizer',
        name: 'Organizador',
        icon: '🎪',
        route: '/profile/organizer',
        available: true,
        hasProfile: isOrganizerProfileConfigured(organizerProfile)
      },
      {
        id: 'academy',
        name: 'Academia',
        icon: '🎓',
        route: '/profile/academy',
        available: true,
        hasProfile: isAcademyProfileConfigured(academyProfile)
      },
      {
        id: 'teacher',
        name: 'Maestro',
        icon: '👨‍🏫',
        route: '/profile/teacher',
        available: true,
        hasProfile: isTeacherProfileConfigured(teacherProfile)
      },
      {
        id: 'brand',
        name: 'Marca',
        icon: '🏷️',
        route: '/profile/brand',
        available: false, // TODO: Implementar cuando esté listo
        hasProfile: false
      }
    ];
  };

  // Obtener la ruta del perfil por defecto
  const getDefaultRoute = (): string => {
    const options = getProfileOptions();
    const selectedOption = options.find(opt => opt.id === defaultProfile);
    
    if (selectedOption?.hasProfile) {
      return selectedOption.route;
    }
    
    // Si el perfil por defecto no existe, buscar el primer perfil disponible
    const availableProfile = options.find(opt => opt.hasProfile);
    return availableProfile?.route || '/profile';
  };

  // Obtener la ruta de edición del perfil por defecto
  const getDefaultEditRoute = (): string => {
    const options = getProfileOptions();
    const selectedOption = options.find(opt => opt.id === defaultProfile);
    
    if (selectedOption?.hasProfile) {
      return `${selectedOption.route}/edit`;
    }
    
    // Si el perfil por defecto no existe, buscar el primer perfil disponible
    const availableProfile = options.find(opt => opt.hasProfile);
    return availableProfile ? `${availableProfile.route}/edit` : '/profile/edit';
  };

  // Obtener información del perfil por defecto
  const getDefaultProfileInfo = () => {
    const options = getProfileOptions();
    return options.find(opt => opt.id === defaultProfile);
  };

  return {
    defaultProfile,
    updateDefaultProfile,
    getProfileOptions,
    getDefaultRoute,
    getDefaultEditRoute,
    getDefaultProfileInfo,
    isLoading
  };
}
