import { rateLimited } from "@/lib/api/errors";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS = 10;

const store = new Map<string, RateLimitEntry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(key: string) {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse(key: string) {
  const result = checkRateLimit(key);
  if (!result.allowed) {
    return rateLimited(
      `操作过于频繁，请 ${Math.ceil((result.resetAt - Date.now()) / 1000)} 秒后再试`,
    );
  }
  return null;
}
