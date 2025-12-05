// @ts-nocheck
// Este archivo se ejecuta en Deno, no en Node.js
// Los errores de TypeScript son falsos positivos del linter
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    // Obtener variables de entorno de Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: "Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Edge Functions secrets." 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Manejar checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const origin = session.metadata?.origin;
      const bookingId = session.metadata?.bookingId;

      if (!origin || !bookingId) {
        console.warn("Missing origin or bookingId in session metadata");
        return new Response(
          JSON.stringify({ received: true }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (origin === "clase") {
        // Actualizar reserva de clase
        const { error } = await supabase
          .from("clase_asistencias")
          .update({ status: "pagado" })
          .eq("id", bookingId);

        if (error) {
          console.error("Error updating clase_asistencias:", error);
        }
      } else if (origin === "fecha") {
        // Actualizar RSVP de evento
        const { error } = await supabase
          .from("event_rsvp")
          .update({ status: "pagado" })
          .eq("id", bookingId);

        if (error) {
          console.error("Error updating event_rsvp:", error);
        }
      }
    }

    // Manejar account.updated para actualizar estado de Stripe
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      
      // Buscar en todas las tablas de perfiles
      const tables = ["profiles_teacher", "profiles_academy", "profiles_organizer"];
      
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .update({
            stripe_charges_enabled: account.charges_enabled,
            stripe_payouts_enabled: account.payouts_enabled,
            stripe_onboarding_status: account.details_submitted 
              ? (account.charges_enabled && account.payouts_enabled ? "active" : "pending")
              : "created",
          })
          .eq("stripe_account_id", account.id);

        if (error) {
          console.error(`Error updating ${table}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error handling webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

