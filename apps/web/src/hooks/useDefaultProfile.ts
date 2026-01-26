import { useState, useEffect, useMemo, useCallback } from 'react';
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

    // Escuchar cambios en localStorage (para cambios en otras pestañas)
    const handleStorageChange = (e: StorageEvent) => {
      if (user?.id && e.key === `default_profile_${user.id}` && e.newValue) {
        if (['user', 'organizer', 'academy', 'teacher', 'brand'].includes(e.newValue)) {
          setDefaultProfile(e.newValue as ProfileType);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Para cambios en la misma pestaña, usar un custom event
    // Esto es más eficiente que un interval
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (user?.id && (e as any).detail?.key === `default_profile_${user.id}`) {
        const newValue = (e as any).detail?.value;
        if (['user', 'organizer', 'academy', 'teacher', 'brand'].includes(newValue)) {
          setDefaultProfile(newValue as ProfileType);
        }
      }
    };

    window.addEventListener('defaultProfileChanged' as any, handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('defaultProfileChanged' as any, handleCustomStorageChange as EventListener);
    };
  }, [user?.id]);

  // Guardar perfil por defecto en localStorage
  const updateDefaultProfile = useCallback((profileType: ProfileType) => {
    if (user?.id) {
      localStorage.setItem(`default_profile_${user.id}`, profileType);
      setDefaultProfile(profileType);
      // Dispatch custom event para notificar a otros componentes en la misma pestaña
      window.dispatchEvent(new CustomEvent('defaultProfileChanged', {
        detail: { key: `default_profile_${user.id}`, value: profileType }
      }));
    }
  }, [user?.id]);

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

  // Memoizar funciones de verificación para evitar recálculos
  const isUserProfileConfiguredMemo = useMemo(
    () => isUserProfileConfigured(userProfile),
    [userProfile]
  );
  const isOrganizerProfileConfiguredMemo = useMemo(
    () => isOrganizerProfileConfigured(organizerProfile),
    [organizerProfile]
  );
  const isAcademyProfileConfiguredMemo = useMemo(
    () => isAcademyProfileConfigured(academyProfile),
    [academyProfile]
  );
  const isTeacherProfileConfiguredMemo = useMemo(
    () => isTeacherProfileConfigured(teacherProfile),
    [teacherProfile]
  );

  // Obtener opciones de perfiles disponibles (memoizado)
  const getProfileOptions = useCallback((): ProfileOption[] => {
    return [
      {
        id: 'user',
        name: 'Usuario',
        icon: '👤',
        route: '/profile/user',
        available: true,
        hasProfile: isUserProfileConfiguredMemo
      },
      {
        id: 'organizer',
        name: 'Organizador',
        icon: '🎪',
        route: '/profile/organizer',
        available: true,
        hasProfile: isOrganizerProfileConfiguredMemo
      },
      {
        id: 'academy',
        name: 'Academia',
        icon: '🎓',
        route: '/profile/academy',
        available: true,
        hasProfile: isAcademyProfileConfiguredMemo
      },
      {
        id: 'teacher',
        name: 'Maestro',
        icon: '👨‍🏫',
        route: '/profile/teacher',
        available: true,
        hasProfile: isTeacherProfileConfiguredMemo
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
  }, [isUserProfileConfiguredMemo, isOrganizerProfileConfiguredMemo, isAcademyProfileConfiguredMemo, isTeacherProfileConfiguredMemo]);

  // Memoizar opciones para evitar recálculos
  const profileOptions = useMemo(() => getProfileOptions(), [getProfileOptions]);

  // Obtener la ruta del perfil por defecto (memoizado)
  const getDefaultRoute = useCallback((): string => {
    const selectedOption = profileOptions.find(opt => opt.id === defaultProfile);
    
    if (selectedOption?.hasProfile) {
      return selectedOption.route;
    }
    
    // Si el perfil por defecto no existe, buscar el primer perfil disponible
    const availableProfile = profileOptions.find(opt => opt.hasProfile);
    return availableProfile?.route || '/profile';
  }, [defaultProfile, profileOptions]);

  // Obtener la ruta de edición del perfil por defecto (memoizado)
  const getDefaultEditRoute = useCallback((): string => {
    const selectedOption = profileOptions.find(opt => opt.id === defaultProfile);
    
    if (selectedOption?.hasProfile) {
      return `${selectedOption.route}/edit`;
    }
    
    // Si el perfil por defecto no existe, buscar el primer perfil disponible
    const availableProfile = profileOptions.find(opt => opt.hasProfile);
    return availableProfile ? `${availableProfile.route}/edit` : '/profile/edit';
  }, [defaultProfile, profileOptions]);

  // Obtener información del perfil por defecto (memoizado)
  const getDefaultProfileInfo = useCallback(() => {
    return profileOptions.find(opt => opt.id === defaultProfile);
  }, [defaultProfile, profileOptions]);

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
