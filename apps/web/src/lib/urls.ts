/**
 * Helper central de URLs para la aplicación
 * Evita hardcodear rutas y facilita el mantenimiento
 */

// =====================================================
// RUTAS PÚBLICAS (LIVE)
// =====================================================

/**
 * URL pública de un organizador aprobado
 * @param id ID del organizador
 */
export function organizerLive(id: number | string): string {
  return `/organizer/${id}`;
}

/**
 * URL pública de una fecha de evento publicada
 * @param id ID de la fecha del evento (events_date.id)
 */
export function eventDateLive(id: number | string): string {
  return `/social/fecha/${id}`;
}

/**
 * URL pública de un evento padre
 * @param id ID del evento padre (events_parent.id)
 */
export function eventParentLive(id: number | string): string {
  return `/events/parent/${id}`;
}

/**
 * URL pública de un perfil de usuario
 * @param userId user_id del usuario
 */
export function userLive(userId: string): string {
  return `/u/${userId}`;
}

/**
 * URL pública de una academia
 * @param id ID de la academia
 */
export function academyLive(id: number | string): string {
  return `/academia/${id}`;
}

/**
 * URL pública de un maestro
 * @param id ID del maestro
 */
export function teacherLive(id: number | string): string {
  return `/maestro/${id}`;
}

/**
 * URL pública de una marca
 * @param id ID de la marca
 */
export function brandLive(id: number | string): string {
  return `/marca/${id}`;
}

// =====================================================
// RUTAS DE EXPLORACIÓN
// =====================================================

/**
 * Pantalla principal de exploración
 */
export function exploreHome(): string {
  return `/explore`;
}

/**
 * Listado de exploración con filtros
 * @param type Tipo de contenido a explorar
 */
export function exploreList(type?: string): string {
  return type ? `/explore/list?type=${type}` : `/explore/list`;
}

// =====================================================
// RUTAS DE EDICIÓN/OWNER (Protegidas)
// =====================================================

/**
 * Editar perfil de organizador (requiere ser owner)
 */
export function organizerEdit(): string {
  return `/profile/organizer/edit`;
}

/**
 * Editar fecha de evento (requiere ser owner)
 * @param id ID de la fecha del evento
 */
export function eventDateEdit(id: number | string): string {
  return `/profile/organizer/events/date/${id}/edit`;
}

/**
 * Editar evento padre (requiere ser owner)
 * @param id ID del evento padre
 */
export function eventParentEdit(id: number | string): string {
  return `/events/parent/${id}/edit`;
}

/**
 * Crear nueva fecha de evento
 * @param parentId ID del evento padre
 */
export function eventDateCreate(parentId: number | string): string {
  return `/profile/organizer/date/new/${parentId}`;
}

/**
 * Crear nuevo evento padre
 */
export function eventParentCreate(): string {
  return `/events/parent/new`;
}

/**
 * Dashboard de fechas de un evento padre
 * @param parentId ID del evento padre
 */
export function eventDashboard(parentId: number | string): string {
  return `/profile/organizer/dashboard/${parentId}`;
}

/**
 * Editar perfil de usuario
 */
export function profileEdit(): string {
  return `/profile/edit`;
}

/**
 * Pantalla de perfil (vista personal)
 */
export function profile(): string {
  return `/profile`;
}

// =====================================================
// RUTAS DE PERFIL (Otros tipos)
// =====================================================

/**
 * Editar perfil de maestro
 */
export function teacherEdit(): string {
  return `/profile/teacher/edit`;
}

/**
 * Editar perfil de academia
 */
export function schoolEdit(): string {
  return `/profile/school/edit`;
}

/**
 * Editar perfil de marca
 */
export function brandEdit(): string {
  return `/profile/brand/edit`;
}

// =====================================================
// RUTAS ESPECIALES
// =====================================================

/**
 * Mis RSVPs (eventos a los que asistiré)
 */
export function myRsvps(): string {
  return `/me/rsvps`;
}

/**
 * Selección de roles
 */
export function roleSelector(): string {
  return `/profile/roles`;
}

/**
 * Admin - Solicitudes de roles
 */
export function adminRoles(): string {
  return `/admin/roles`;
}

/**
 * Onboarding - Información básica
 */
export function onboardingBasics(): string {
  return `/onboarding/basics`;
}

/**
 * Onboarding - Seleccionar ritmos
 */
export function onboardingRitmos(): string {
  return `/onboarding/ritmos`;
}

/**
 * Onboarding - Seleccionar zonas
 */
export function onboardingZonas(): string {
  return `/onboarding/zonas`;
}

/**
 * Login
 */
export function login(): string {
  return `/auth/login`;
}

/**
 * Signup
 */
export function signup(): string {
  return `/auth/signup`;
}

// =====================================================
// OBJETO DE EXPORTACIÓN (alternativa)
// =====================================================

/**
 * Objeto con todas las URLs disponibles
 * Uso alternativo: import { urls } from '@/lib/urls'; urls.eventDateLive(123)
 */
export const urls = {
  // Públicas LIVE
  organizerLive,
  eventDateLive,
  eventParentLive,
  userLive,
  academyLive,
  teacherLive,
  brandLive,
  
  // Exploración
  exploreHome,
  exploreList,
  
  // Edición/Owner
  organizerEdit,
  eventDateEdit,
  eventParentEdit,
  eventDateCreate,
  eventParentCreate,
  eventDashboard,
  profileEdit,
  profile,
  
  // Otros perfiles
  teacherEdit,
  schoolEdit,
  brandEdit,
  
  // Especiales
  myRsvps,
  roleSelector,
  adminRoles,
  
  // Onboarding
  onboardingBasics,
  onboardingRitmos,
  onboardingZonas,
  
  // Auth
  login,
  signup,
};

// Export por defecto para uso directo de funciones
export default urls;

