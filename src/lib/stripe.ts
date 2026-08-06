import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeServerClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-06-24.dahlia",
    });
  }

  return stripeClient;
}
