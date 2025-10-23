/**
 * Utilidades para control de acceso y permisos de edición
 * 
 * Estas funciones determinan si un usuario puede editar ciertos recursos.
 * Se usan para mostrar/ocultar botones de edición en la UI.
 * 
 * IMPORTANTE: El contenido SIEMPRE se muestra si está en las vistas "live".
 * Solo se ocultan los controles de edición si el usuario no es el dueño.
 */

// =====================================================
// TIPOS
// =====================================================

interface OrganizerRecord {
  user_id?: string;
}

interface EventRecord {
  organizador_user_id?: string;
}

interface UserProfileRecord {
  user_id?: string;
}

// =====================================================
// PERMISOS DE ORGANIZADOR
// =====================================================

/**
 * Verifica si el usuario actual puede editar un perfil de organizador
 * @param row Registro del organizador con user_id
 * @param currentUserId ID del usuario actual (auth.uid)
 * @returns true si el usuario es el dueño del perfil
 */
export function canEditOrganizer(
  row: OrganizerRecord | null | undefined,
  currentUserId?: string
): boolean {
  if (!row || !currentUserId) return false;
  return !!row.user_id && row.user_id === currentUserId;
}

/**
 * Verifica si el usuario actual es dueño de un organizador
 * @param organizerUserId user_id del organizador
 * @param currentUserId ID del usuario actual
 */
export function isOrganizerOwner(
  organizerUserId?: string,
  currentUserId?: string
): boolean {
  if (!organizerUserId || !currentUserId) return false;
  return organizerUserId === currentUserId;
}

// =====================================================
// PERMISOS DE EVENTOS
// =====================================================

/**
 * Verifica si el usuario actual puede editar una fecha de evento
 * @param row Registro del evento con organizador_user_id
 * @param currentUserId ID del usuario actual (auth.uid)
 * @returns true si el usuario es el dueño del evento (a través del organizador)
 */
export function canEditEventDate(
  row: EventRecord | null | undefined,
  currentUserId?: string
): boolean {
  if (!row || !currentUserId) return false;
  return !!row.organizador_user_id && row.organizador_user_id === currentUserId;
}

/**
 * Verifica si el usuario actual puede editar un evento
 * Alias de canEditEventDate para consistencia
 */
export function canEditEvent(
  row: EventRecord | null | undefined,
  currentUserId?: string
): boolean {
  return canEditEventDate(row, currentUserId);
}

// =====================================================
// PERMISOS DE PERFIL DE USUARIO
// =====================================================

/**
 * Verifica si el usuario actual puede editar un perfil de usuario
 * @param row Registro del perfil con user_id
 * @param currentUserId ID del usuario actual
 * @returns true si el usuario es el dueño del perfil
 */
export function canEditUserProfile(
  row: UserProfileRecord | null | undefined,
  currentUserId?: string
): boolean {
  if (!row || !currentUserId) return false;
  return !!row.user_id && row.user_id === currentUserId;
}

/**
 * Verifica si el usuario actual es dueño de un perfil
 * @param profileUserId user_id del perfil
 * @param currentUserId ID del usuario actual
 */
export function isProfileOwner(
  profileUserId?: string,
  currentUserId?: string
): boolean {
  if (!profileUserId || !currentUserId) return false;
  return profileUserId === currentUserId;
}

// =====================================================
// ROLES Y ADMINISTRACIÓN
// =====================================================

/**
 * Verifica si el usuario actual es administrador
 * @param userRoles Array de roles del usuario
 * @returns true si tiene rol de admin
 */
export function isAdmin(userRoles?: string[]): boolean {
  if (!userRoles) return false;
  return userRoles.includes("admin") || userRoles.includes("super_admin");
}

/**
 * Verifica si el usuario actual es organizador
 * @param userRoles Array de roles del usuario
 * @returns true si tiene rol de organizador
 */
export function isOrganizer(userRoles?: string[]): boolean {
  if (!userRoles) return false;
  return userRoles.includes("organizador");
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param userRoles Array de roles del usuario
 * @param role Rol a verificar
 * @returns true si tiene el rol especificado
 */
export function hasRole(userRoles?: string[], role?: string): boolean {
  if (!userRoles || !role) return false;
  return userRoles.includes(role);
}

// =====================================================
// UTILIDADES GENERALES
// =====================================================

/**
 * Verifica si un recurso pertenece al usuario actual
 * Función genérica para cualquier recurso con user_id
 */
export function isOwner(
  resourceUserId?: string,
  currentUserId?: string
): boolean {
  if (!resourceUserId || !currentUserId) return false;
  return resourceUserId === currentUserId;
}

/**
 * Verifica si el usuario puede realizar acciones de administración
 * sobre un recurso (es admin o es el dueño)
 */
export function canAdminister(
  resourceUserId?: string,
  currentUserId?: string,
  userRoles?: string[]
): boolean {
  if (isAdmin(userRoles)) return true;
  return isOwner(resourceUserId, currentUserId);
}

