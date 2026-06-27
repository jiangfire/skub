import { prisma } from "@/lib/prisma";

// ─── Rate Limiter (v1 simplified) ───
// PG-based: counts recent CallLog entries per API key.
// Default: 60 requests per minute per key.
//
// Known limitation: TOCTOU race condition under concurrent load.
// The CallLog is recorded AFTER the fetch completes (up to 30s),
// so concurrent requests can all pass the count check before any
// log is written. This is acceptable for v1 (no Redis). A v2 fix
// would insert a "Pending" CallLog before fetch, or use Redis INCR.

const DEFAULT_LIMIT = 60;
const WINDOW_SECONDS = 60;

/**
 * Check if an API key is within its rate limit.
 * Returns true if allowed, false if rate limited.
 */
export async function checkRateLimit(
  apiKeyId: string,
  limit: number = DEFAULT_LIMIT,
): Promise<{ allowed: boolean; remaining: number }> {
  const since = new Date(Date.now() - WINDOW_SECONDS * 1000);

  const recentCount = await prisma.callLog.count({
    where: {
      apiKeyId,
      createdAt: { gte: since },
    },
  });

  const allowed = recentCount < limit;
  return {
    allowed,
    remaining: Math.max(0, limit - recentCount - (allowed ? 1 : 0)),
  };
}

export const RATE_LIMIT_DEFAULT = DEFAULT_LIMIT;
