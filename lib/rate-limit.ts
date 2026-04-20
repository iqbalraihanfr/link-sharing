type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const counters = new Map<string, RateLimitEntry>();

function pruneExpired(now: number) {
  for (const [key, entry] of counters.entries()) {
    if (entry.resetAt <= now) {
      counters.delete(key);
    }
  }
}

export function consumeRateLimit(
  key: string,
  options: { windowMs: number; maxAttempts: number },
) {
  const now = Date.now();
  pruneExpired(now);

  const current = counters.get(key);
  if (!current || current.resetAt <= now) {
    counters.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  current.count += 1;
  counters.set(key, current);

  if (current.count > options.maxAttempts) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
