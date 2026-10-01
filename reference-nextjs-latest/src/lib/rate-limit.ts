interface RateLimitRecord {
  count: number;
  timestamp: number;
}

const store = new Map<string, RateLimitRecord>();

// Periodically clean up expired entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now - record.timestamp > 24 * 60 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 60 * 60 * 1000);

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now - record.timestamp > windowMs) {
    store.set(key, { count: 1, timestamp: now });
    return { allowed: true };
  }

  if (record.count >= limit) {
    return { allowed: false };
  }

  record.count += 1;
  return { allowed: true };
}
