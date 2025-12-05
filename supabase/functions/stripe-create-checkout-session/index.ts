// @ts-nocheck
// Este archivo se ejecuta en Deno, no en Node.js
// Los errores de TypeScript son falsos positivos del linter
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Log de depuración - verificar que la función se está ejecutando
  console.log("[stripe-create-checkout-session] Request received:", {
    method: req.method,
    url: req.url,
  });

  // Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    console.log("[stripe-create-checkout-session] Handling OPTIONS preflight");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[stripe-create-checkout-session] Processing POST request");
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const { price, description, connectedAccountId, origin, bookingId } = await req.json();

    if (!price || !description || !connectedAccountId || !origin || !bookingId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Validar que price sea un número (en pesos)
    const priceNumber = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(priceNumber) || priceNumber <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid price. Must be a positive number (in MXN)" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Convertir a centavos (Stripe trabaja en la unidad más pequeña)
    const unitAmount = Math.round(priceNumber * 100); // 120 MXN -> 12000 centavos

    // Mínimo de Stripe: 10 MXN (1000 centavos)
    if (unitAmount < 1000) {
      return new Response(
        JSON.stringify({ error: "El monto mínimo de Stripe es 10 MXN." }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Calcular fee de la plataforma (15%) en centavos
    const fee = Math.round(unitAmount * 0.15);

    // Obtener URL base desde env o usar default
    let baseUrl = Deno.env.get("SITE_URL") || "https://dondebailar.com.mx";
    // Limpiar URL: remover todas las barras finales y espacios
    baseUrl = baseUrl.trim().replace(/\/+$/, '');

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            unit_amount: unitAmount,
            product_data: { name: description },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: fee,
        transfer_data: {
          destination: connectedAccountId,
        },
        metadata: {
          origin,
          bookingId,
        },
      },
      metadata: {
        origin,
        bookingId,
      },
      success_url: `${baseUrl}/pago/exitoso?session_id={CHECKOUT_SESSION_ID}&origin=${origin}`,
      cancel_url: `${baseUrl}/pago/cancelado`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
