function readEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAppUrl() {
  return process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function getUploadDir() {
  return process.env.UPLOAD_DIR ?? "./uploads";
}

export function getStripeSecretKey() {
  return readEnv("STRIPE_SECRET_KEY");
}

export function getStripePublishableKey() {
  return readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}

export function getStripeWebhookSecret() {
  return readEnv("STRIPE_WEBHOOK_SECRET");
}

export function getNextAuthSecret() {
  return process.env.NEXTAUTH_SECRET || "development-secret-change-me";
}
