// @ts-nocheck
// Este archivo se ejecuta en Deno, no en Node.js
// Los errores de TypeScript son falsos positivos del linter
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
  console.log("[stripe-create-connected-account] Request received:", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    console.log("[stripe-create-connected-account] Handling OPTIONS preflight");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[stripe-create-connected-account] Processing POST request");
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
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { userId, roleType } = await req.json();

    console.log("[stripe-create-connected-account] Body received:", { userId, roleType });

    if (!userId || !roleType) {
      return new Response(
        JSON.stringify({ error: "userId and roleType are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Determinar tabla según roleType
    let tableName: string;
    switch (roleType) {
      case "maestro":
        tableName = "profiles_teacher";
        break;
      case "academia":
        tableName = "profiles_academy";
        break;
      case "organizador":
        tableName = "profiles_organizer";
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid roleType" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
    }

    // Obtener perfil y email del usuario
    const { data: profile, error: profileError } = await supabase
      .from(tableName)
      .select("id, stripe_account_id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    let accountId = profile.stripe_account_id as string | null;

    // Si ya existe cuenta, retornarla
    if (accountId) {
      return new Response(
        JSON.stringify({ accountId }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Obtener email del usuario
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Crear cuenta Stripe Express
    const account = await stripe.accounts.create({
      type: "express",
      country: "MX",
      email: userData.user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        userId,
        roleType,
      },
    });

    accountId = account.id;

    // Guardar en Supabase
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        stripe_account_id: account.id,
        stripe_onboarding_status: "created",
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save Stripe account" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ accountId }),
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
