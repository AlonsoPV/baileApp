import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "../Toast";

interface StripePayoutSettingsProps {
  userId: string;
  roleType: "maestro" | "academia" | "organizador";
  stripeAccountId?: string | null;
  stripeOnboardingStatus?: string | null;
  stripeChargesEnabled?: boolean | null;
  stripePayoutsEnabled?: boolean | null;
}

export const StripePayoutSettings: React.FC<StripePayoutSettingsProps> = ({
  userId,
  roleType,
  stripeAccountId,
  stripeOnboardingStatus,
  stripeChargesEnabled,
  stripePayoutsEnabled,
}) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  
  const hasAccount = !!stripeAccountId;
  const isActive = !!stripeChargesEnabled && !!stripePayoutsEnabled;

  const handleConnectOrUpdate = async () => {
    setLoading(true);
    try {
      let accountId = stripeAccountId;

      // Si no hay cuenta, crear una
      if (!accountId) {
        const { data: createData, error: createError } = await supabase.functions.invoke(
          'stripe-create-connected-account',
          {
            body: {
              userId,
              roleType,
            },
          }
        );

        if (createError) {
          console.error('[StripePayoutSettings] Error creating account:', createError);
          showToast('Error al crear cuenta de Stripe. Intenta más tarde.', 'error');
          return;
        }

        accountId = createData?.accountId;
        
        if (!accountId) {
          showToast('No se pudo crear la cuenta de Stripe.', 'error');
          return;
        }
      }

      // Crear Account Link para onboarding/actualización
      const { data: linkData, error: linkError } = await supabase.functions.invoke(
        'stripe-create-account-link',
        {
          body: {
            userId,
            roleType,
          },
        }
      );

      if (linkError || !linkData?.url) {
        console.error('[StripePayoutSettings] Error creating account link:', linkError);
        showToast('Error al generar enlace de Stripe. Intenta más tarde.', 'error');
        return;
      }

      // Redirigir a Stripe
      window.location.href = linkData.url;
    } catch (err) {
      console.error('[StripePayoutSettings] Unexpected error:', err);
      showToast('Hubo un error al conectar con Stripe.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    switch (roleType) {
      case 'organizador':
        return 'eventos';
      case 'academia':
      case 'maestro':
        return 'clases';
      default:
        return 'servicios';
    }
  };

  return (
    <div
      style={{
        borderRadius: 16,
        padding: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'rgba(255, 255, 255, 0.05)',
        marginTop: '1.5rem',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
        }}>
          💳
        </div>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>
          Cobros con Stripe
        </h3>
      </div>

      {!hasAccount && (
        <p style={{ marginTop: 0, marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}>
          Conecta tu cuenta con Stripe para recibir pagos por tus {getRoleLabel()}.
          Stripe es una plataforma segura y confiable para procesar pagos.
        </p>
      )}

      {hasAccount && !isActive && (
        <p style={{ marginTop: 0, marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}>
          Tu cuenta de Stripe está creada pero aún no está totalmente activa.
          Puedes actualizar tus datos para completar la verificación.
        </p>
      )}

      {isActive && (
        <div style={{
          marginTop: 0,
          marginBottom: '1rem',
          padding: '0.75rem',
          borderRadius: '8px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
        }}>
          <p style={{ margin: 0, color: '#22c55e', fontWeight: 600 }}>
            ✅ Tus cobros con Stripe están activos. Ya puedes recibir pagos.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleConnectOrUpdate}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: 8,
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: '0.95rem',
          background: loading
            ? 'rgba(255, 255, 255, 0.1)'
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          transition: 'all 0.2s',
          opacity: loading ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {loading
          ? "Conectando..."
          : hasAccount
          ? "Actualizar datos de Stripe"
          : "Conectar con Stripe"}
      </button>
    </div>
  );
};

