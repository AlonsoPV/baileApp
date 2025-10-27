import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserProfile } from './useUserProfile';
import { useMyOrganizer } from './useOrganizer';
import { useAcademyMy } from './useAcademyMy';

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
  const { data: userProfile } = useUserProfile();
  const { data: organizerProfile } = useMyOrganizer();
  const { data: academyProfile } = useAcademyMy();
  
  const [defaultProfile, setDefaultProfile] = useState<ProfileType>('user');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar perfil por defecto desde localStorage
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`default_profile_${user.id}`);
      if (saved && ['user', 'organizer', 'academy', 'teacher', 'brand'].includes(saved)) {
        setDefaultProfile(saved as ProfileType);
      }
      setIsLoading(false);
    }
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
    if (!profile) return false;
    return !!(profile.display_name || profile.bio || profile.avatar_url);
  };

  const isOrganizerProfileConfigured = (profile: any): boolean => {
    if (!profile) return false;
    return !!(profile.nombre_publico && profile.nombre_publico.trim().length > 0);
  };

  const isAcademyProfileConfigured = (profile: any): boolean => {
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
        route: '/profile',
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
        available: false, // TODO: Implementar cuando esté listo
        hasProfile: false
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
