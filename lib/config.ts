import { ConfigurationError } from "@/lib/errors";

export const APP_NAME = "Handshake Archive";
export const PAGE_SIZE = 20;
export const PROFILE_TTL_DAYS = 90;
export const FLAG_THRESHOLD = 3;
export const EDIT_SESSION_SECONDS = 60 * 60 * 6;
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

const isProduction = process.env.NODE_ENV === "production";

function normalizeUrl(value?: string) {
  if (!value) return null;

  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

export const config = {
  isProduction,
  appBaseUrl: normalizeUrl(process.env.APP_BASE_URL),
  supabaseUrl: normalizeUrl(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseSecretKey:
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  appSecret:
    process.env.APP_SECRET ?? "development-secret-change-me-before-production",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? "",
  sessionCookieSecure:
    process.env.SESSION_COOKIE_SECURE === "false" ? false : isProduction,
};

export function isDatabaseConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseSecretKey);
}

export function isTurnstileConfigured() {
  return Boolean(config.turnstileSiteKey && config.turnstileSecretKey);
}

export function assertDatabaseConfigured() {
  if (!config.supabaseUrl || !config.supabaseSecretKey) {
    throw new ConfigurationError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY to enable submissions and moderation.",
    );
  }
}

export function assertAdminPasswordConfigured() {
  if (!config.adminPassword && !config.adminPasswordHash) {
    throw new ConfigurationError(
      "Admin authentication is not configured. Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH.",
    );
  }
}
