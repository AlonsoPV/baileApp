/**
 * Capacidades por plan (monetización / producto).
 *
 * - Rol (academy | teacher | …) ≠ plan (basic | pro | premium). No mezclar: el plan solo entra aquí normalizado.
 * - `verifiedBadge` en el mapa = badge de perfil asociado al **plan de pago**, no al estado de moderación (KYC/aprobación).
 * - Para nuevas features (límites, visibilidad, Stripe): añadir claves en `PLAN_CAPABILITIES` y consultar con `hasCapability` / `profileHasCapability`.
 */

import { getPlan, type SubscriptionPlan } from './subscription';

export type SubscribableProfileRole = 'academy' | 'teacher' | 'organizer' | 'user';

/** Fila mínima con plan (cualquier tabla de perfil con `subscription_plan`). */
export type SubscriptionPlanRow = {
  subscription_plan?: string | null;
};

/**
 * Vista unificada rol + plan normalizado (extensible cuando organizer/user tengan plan en BD).
 * El rol no altera el plan; sirve para reglas futuras que sí dependan del tipo de perfil.
 */
export type SubscribableProfile = {
  role: SubscribableProfileRole;
  subscription_plan: SubscriptionPlan;
};

export const PLAN_CAPABILITIES = {
  basic: {
    /** Badge "Verificado" en perfil por tier de pago; no confundir con aprobación manual del equipo. */
    verifiedBadge: false,
    featuredVisibility: false,
    /** Métricas de clases (dashboard estadísticas) en perfil academia. */
    canViewClassMetrics: false,
    /** Métricas agregadas por alumno en perfil academia. */
    canViewStudentMetrics: false,
    /** Página de perfil visible en rutas públicas (/academia/:id); solo Premium. */
    canHavePublicProfile: false,
    /** En métricas de academia: marcar asistió / pago en reservas. Solo Premium. */
    canEditAcademyMetricsAttendanceAndPayment: false,
    /** Máximo de clases con fecha específica en cronograma de academia; null = sin límite numérico. */
    specificDateClassesLimit: 5 as number,
    canCreateUnlimitedSpecificDateClasses: false,
    /** Modalidad semanal en clases de academia (cronograma). */
    canCreateWeeklyClasses: false,
    /** Máx. días distintos por clase semanal; `0` = no aplica; `null` = ilimitado (Premium). */
    maxWeeklyDaysPerClass: 0 as const,
    /** Máx. sedes/ubicaciones en perfil academia; `null` = ilimitado. */
    maxLocations: 1 as const,
  },
  pro: {
    verifiedBadge: true,
    featuredVisibility: true,
    canViewClassMetrics: true,
    canViewStudentMetrics: false,
    canHavePublicProfile: false,
    canEditAcademyMetricsAttendanceAndPayment: false,
    specificDateClassesLimit: null as null,
    canCreateUnlimitedSpecificDateClasses: true,
    canCreateWeeklyClasses: true,
    maxWeeklyDaysPerClass: 1 as const,
    maxLocations: null as null,
  },
  premium: {
    verifiedBadge: true,
    featuredVisibility: true,
    canViewClassMetrics: true,
    canViewStudentMetrics: true,
    canHavePublicProfile: true,
    canEditAcademyMetricsAttendanceAndPayment: true,
    specificDateClassesLimit: null as null,
    canCreateUnlimitedSpecificDateClasses: true,
    canCreateWeeklyClasses: true,
    maxWeeklyDaysPerClass: null as null,
    maxLocations: null as null,
  },
} as const;

/** Capacidades booleanas consultables con `hasCapability` (límites numéricos: helpers dedicados). */
export type PlanCapability = Exclude<
  keyof (typeof PLAN_CAPABILITIES)[SubscriptionPlan],
  'specificDateClassesLimit' | 'maxWeeklyDaysPerClass' | 'maxLocations'
>;

/** Snapshot de capacidades del plan (base para gates de monetización sin duplicar literales). */
export function capabilitiesForPlan(plan: SubscriptionPlan): (typeof PLAN_CAPABILITIES)[SubscriptionPlan] {
  return PLAN_CAPABILITIES[plan];
}

/** Límite de clases con fecha específica (academia); `null` = ilimitado. */
export function specificDateClassLimitForPlan(plan: SubscriptionPlan): number | null {
  const cap = PLAN_CAPABILITIES[plan].specificDateClassesLimit;
  return cap === null ? null : cap;
}

export function canCreateUnlimitedSpecificDateClasses(plan: SubscriptionPlan): boolean {
  return PLAN_CAPABILITIES[plan].canCreateUnlimitedSpecificDateClasses;
}

/** Academia: modalidad semanal en cronograma. */
export function canCreateWeeklyClasses(plan: SubscriptionPlan): boolean {
  return PLAN_CAPABILITIES[plan].canCreateWeeklyClasses;
}

/**
 * Máx. días de la semana por clase en modalidad semanal.
 * - `null` = ilimitado (Premium)
 * - `1` = Pro
 * - `0` = Basic (sin modalidad semanal)
 */
export function maxWeeklyDaysPerClassForPlan(plan: SubscriptionPlan): number | null {
  return PLAN_CAPABILITIES[plan].maxWeeklyDaysPerClass;
}

/** Academia: máximo de ubicaciones/sedes; `null` = ilimitado (Pro/Premium). */
export function maxLocationsForPlan(plan: SubscriptionPlan): number | null {
  return PLAN_CAPABILITIES[plan].maxLocations;
}

export function hasCapability(plan: SubscriptionPlan, capability: PlanCapability): boolean {
  return PLAN_CAPABILITIES[plan][capability] as boolean;
}

/** Normaliza `subscription_plan` de fila/API y evalúa capacidad; válido para cualquier rol con columna de plan. */
export function profileHasCapability(row: SubscriptionPlanRow, capability: PlanCapability): boolean {
  return hasCapability(getPlan(row.subscription_plan), capability);
}

/**
 * Único criterio para mostrar el badge de suscriptor en UI.
 * Centraliza plan + capacidad; los componentes no deben reimplementar esta condición.
 */
export function showsSubscriberVerifiedBadge(subscriptionPlanRaw?: string | null): boolean {
  return profileHasCapability({ subscription_plan: subscriptionPlanRaw }, 'verifiedBadge');
}

/** Combina rol de negocio con plan normalizado (sin mezclar reglas: el plan sigue viniendo solo de la fila). */
export function subscribableProfileFromRow(
  role: SubscribableProfileRole,
  row: SubscriptionPlanRow
): SubscribableProfile {
  return {
    role,
    subscription_plan: getPlan(row.subscription_plan),
  };
}
