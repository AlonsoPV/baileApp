/**
 * Plan de suscripción (producto / monetización).
 *
 * No incluye rol de app (academy, teacher, organizer, user): eso vive en auth/perfil de negocio.
 * Para reglas de UI o límites según plan, usar `planCapabilities` (`hasCapability`, `profileHasCapability`).
 *
 * La fuente de verdad en BD es `subscription_plan` (+ `subscription_status`, `subscription_expires_at` cuando apliquen).
 * No usar `is_verified`, `estado_aprobacion` ni flags análogos para lógica de pago o límites de plan.
 */

export type SubscriptionPlan = 'basic' | 'pro' | 'premium';

export function getPlan(plan?: string | null): SubscriptionPlan {
  if (plan === 'pro' || plan === 'premium') return plan;
  return 'basic';
}
