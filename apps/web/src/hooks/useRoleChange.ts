import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { clearOtherRoleDrafts } from '../utils/draftKeys';

/**
 * Hook para manejar el cambio de roles y limpiar drafts
 * Se ejecuta cuando se detecta un cambio de rol en la URL
 */
export function useRoleChange() {
  const location = useLocation();

  useEffect(() => {
    // Detectar cambio de rol basado en la URL
    const path = location.pathname;
    
    // Extraer el rol actual de la URL
    let currentRole: 'user' | 'organizer' | 'teacher' | 'academy' | 'brand' = 'user';
    
    if (path.includes('/organizer')) {
      currentRole = 'organizer';
    } else if (path.includes('/teacher')) {
      currentRole = 'teacher';
    } else if (path.includes('/academy')) {
      currentRole = 'academy';
    } else if (path.includes('/brand')) {
      currentRole = 'brand';
    } else if (path.includes('/profile') && !path.includes('/organizer')) {
      currentRole = 'user';
    }

    // Limpiar drafts de otros roles
    clearOtherRoleDrafts(undefined, currentRole);
  }, [location.pathname]);
}
