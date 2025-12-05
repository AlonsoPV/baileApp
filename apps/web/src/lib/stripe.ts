import Stripe from "stripe";

// Stripe SDK helper
// Note: This is for server-side use only (Edge Functions)
// Client-side code should call Edge Functions, not use this directly

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || import.meta.env.VITE_STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('[stripe] STRIPE_SECRET_KEY not found. Stripe functionality will be disabled.');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    })
  : null;

export type StripeAccountStatus = 'not_connected' | 'created' | 'pending' | 'active';

