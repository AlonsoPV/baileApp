import React from 'react';
import { showsSubscriberVerifiedBadge } from '@/lib/planCapabilities';
import { useTranslation } from 'react-i18next';

export type SubscriptionTierBadgeProps = {
  /** Valor crudo de BD/API; ausente o inválido → basic (sin badge). */
  subscriptionPlan?: string | null;
  /**
   * default: bloque centrado con margen inferior (hero tipo academia).
   * inline: solo la pastilla, para alinear en fila con otros controles (p. ej. compartir en maestro público).
   */
  variant?: 'default' | 'inline';
};

/**
 * Badge "Verificado" según plan de suscripción (`showsSubscriberVerifiedBadge`).
 * No usar `estado_aprobacion` aquí: el badge es puramente de tier de pago.
 */
export function SubscriptionTierBadge({
  subscriptionPlan,
  variant = 'default',
}: SubscriptionTierBadgeProps) {
  const { t } = useTranslation();
  if (!showsSubscriberVerifiedBadge(subscriptionPlan)) return null;

  const label = t('verified', 'Verificado');

  const pill = (
    <div
      className="badge subscription-tier-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '.45rem',
        padding: '.35rem .6rem',
        borderRadius: '999px',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #106c37, #0b5)',
        border: '1px solid #13a65a',
        boxShadow: '0 8px 18px rgba(0,0,0,.35)',
        fontSize: '.82rem',
        color: '#fff',
      }}
    >
      <div
        className="dot"
        style={{
          width: '16px',
          height: '16px',
          display: 'grid',
          placeItems: 'center',
          background: '#16c784',
          borderRadius: '50%',
          color: '#062d1f',
          fontSize: '.75rem',
          fontWeight: 900,
        }}
      >
        ✓
      </div>
      <span>{label}</span>
    </div>
  );

  if (variant === 'inline') return pill;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        marginBottom: '1rem',
      }}
    >
      {pill}
    </div>
  );
}
