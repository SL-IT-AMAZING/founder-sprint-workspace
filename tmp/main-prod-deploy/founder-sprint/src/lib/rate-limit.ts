interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 60s to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetTime) store.delete(key);
    }
  }, 60_000);
}

export function rateLimit(options: { windowMs: number; max: number }) {
  return {
    check(key: string): { success: boolean; remaining: number } {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetTime) {
        store.set(key, { count: 1, resetTime: now + options.windowMs });
        return { success: true, remaining: options.max - 1 };
      }

      if (entry.count >= options.max) {
        return { success: false, remaining: 0 };
      }

      entry.count++;
      return { success: true, remaining: options.max - entry.count };
    },
  };
}
