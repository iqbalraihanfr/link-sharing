import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { config, isUpstashConfigured } from "@/lib/config";
import { AppError } from "@/lib/errors";

const memoryStore = new Map<string, { count: number; resetAt: number }>();

const redis = isUpstashConfigured()
  ? new Redis({
      url: config.upstashRedisRestUrl,
      token: config.upstashRedisRestToken,
    })
  : null;

function durationToSeconds(duration: `${number} ${"m" | "s" | "h"}`) {
  const [amountRaw, unit] = duration.split(" ");
  const amount = Number(amountRaw);

  if (unit === "s") return amount;
  if (unit === "m") return amount * 60;
  return amount * 60 * 60;
}

async function limitWithMemory(
  bucket: string,
  key: string,
  limit: number,
  windowDuration: `${number} ${"m" | "s" | "h"}`,
) {
  const now = Date.now();
  const resetAt = now + durationToSeconds(windowDuration) * 1000;
  const storeKey = `${bucket}:${key}`;
  const current = memoryStore.get(storeKey);

  if (!current || current.resetAt <= now) {
    memoryStore.set(storeKey, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  const next = { ...current, count: current.count + 1 };
  memoryStore.set(storeKey, next);

  return {
    success: next.count <= limit,
    limit,
    remaining: Math.max(0, limit - next.count),
    reset: next.resetAt,
  };
}

export async function enforceRateLimit(
  bucket: string,
  key: string,
  limit: number,
  windowDuration: `${number} ${"m" | "s" | "h"}`,
) {
  const result = redis
    ? await new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, windowDuration),
        prefix: `handshake:${bucket}`,
      }).limit(key)
    : await limitWithMemory(bucket, key, limit, windowDuration);

  if (!result.success) {
    throw new AppError("Terlalu banyak percobaan. Coba lagi sebentar lagi.", {
      status: 429,
      code: "RATE_LIMITED",
    });
  }

  return result;
}
