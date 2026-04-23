import { loadStripe, Stripe } from "@stripe/stripe-js";

// Singleton — Stripe.js is heavy (~100 KB), only load it once per page.
// loadStripe returns the same Promise for repeated calls with the same key.
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("VITE_STRIPE_PUBLISHABLE_KEY is not set — embedded checkout will fail.");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
