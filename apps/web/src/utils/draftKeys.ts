/**
 * Utilidades para generar claves de draft consistentes
 * Asegura que cada rol tenga su propio namespace de draft
 */

export type ProfileRole = 'user' | 'organizer' | 'teacher' | 'academy' | 'brand';

/**
 * Genera una clave de draft única para cada rol y usuario
 * Formato: draft:{role}:profile:{userId}:{role}
 * 
 * @param userId - ID del usuario
 * @param role - Rol del perfil
 * @returns Clave única para el draft
 */
export function getDraftKey(userId: string | undefined, role: ProfileRole): string {
  const safeUserId = userId ?? 'anon';
  return `draft:${role}:profile:${safeUserId}:${role}`;
}

/**
 * Genera claves de draft para todos los roles de un usuario
 * Útil para limpiar drafts cuando se cambia de rol
 * 
 * @param userId - ID del usuario
 * @returns Array de claves de draft para todos los roles
 */
export function getAllRoleDraftKeys(userId: string | undefined): string[] {
  const roles: ProfileRole[] = ['user', 'organizer', 'teacher', 'academy', 'brand'];
  return roles.map(role => getDraftKey(userId, role));
}

/**
 * Limpia todos los drafts de un usuario excepto el rol actual
 * Útil cuando se cambia de rol para evitar conflictos
 * 
 * @param userId - ID del usuario
 * @param currentRole - Rol actual (no se limpia)
 */
export function clearOtherRoleDrafts(userId: string | undefined, currentRole: ProfileRole): void {
  const allKeys = getAllRoleDraftKeys(userId);
  const currentKey = getDraftKey(userId, currentRole);
  
  // Limpiar todos los drafts excepto el actual
  allKeys.forEach(key => {
    if (key !== currentKey) {
      localStorage.removeItem(key);
    }
  });
}
