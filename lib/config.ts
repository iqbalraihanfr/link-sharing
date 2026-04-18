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
  databaseUrl: process.env.DATABASE_URL ?? "",
  appSecret:
    process.env.APP_SECRET ?? "development-secret-change-me-before-production",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? "",
  sessionCookieSecure:
    process.env.SESSION_COOKIE_SECURE === "false" ? false : isProduction,
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL ?? "",
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
};

export function isDatabaseConfigured() {
  return Boolean(config.databaseUrl);
}

export function isTurnstileConfigured() {
  return Boolean(config.turnstileSiteKey && config.turnstileSecretKey);
}

export function isUpstashConfigured() {
  return Boolean(config.upstashRedisRestUrl && config.upstashRedisRestToken);
}

export function assertDatabaseConfigured() {
  if (!config.databaseUrl) {
    throw new ConfigurationError(
      "DATABASE_URL is missing. Set your Postgres connection string to enable submissions and moderation.",
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
