import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export interface CreateCheckoutSessionParams {
  price: number; // Precio en pesos (se convertirá a centavos)
  description: string;
  connectedAccountId: string;
  origin: 'clase' | 'fecha';
  bookingId: string | number;
}

export function useCreateCheckoutSession() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateCheckoutSessionParams) => {
      const { price, description, connectedAccountId, origin, bookingId } = params;

      // Validar que el precio sea válido
      if (!price || price <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      // Validar que la cuenta de Stripe esté conectada
      if (!connectedAccountId) {
        throw new Error('La cuenta de Stripe no está conectada');
      }

      console.log('[useStripeCheckout] Creando sesión de checkout:', {
        price,
        description,
        connectedAccountId,
        origin,
        bookingId,
      });

      const { data, error } = await supabase.functions.invoke(
        'stripe-create-checkout-session',
        {
          body: {
            price: price, // Precio en pesos
            description,
            connectedAccountId,
            origin,
            bookingId: String(bookingId),
          },
        }
      );

      if (error) {
        console.error('[useStripeCheckout] Error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No se pudo crear la sesión de pago');
      }

      console.log('[useStripeCheckout] Sesión creada exitosamente:', data.url);
      
      // Redirigir a Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error: any) => {
      console.error('[useStripeCheckout] Error creando checkout:', error);
      showToast(
        error?.message || 'Error al crear la sesión de pago. Intenta de nuevo.',
        'error'
      );
    },
  });
}

