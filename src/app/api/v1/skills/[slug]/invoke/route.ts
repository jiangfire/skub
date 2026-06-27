import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/server/apikey.service";
import { checkRateLimit } from "@/server/ratelimit.service";
import { getSessionUser } from "@/lib/api/session";
import { can } from "@/lib/auth/permissions";
import { unauthorized, notFound, forbidden } from "@/lib/api/errors";
import type { ApiError } from "@/types/domain";

const INVOKE_TIMEOUT_MS = 30_000; // 30s per spec §3.4

// ─── SSRF Protection ───
// Block requests to private/internal IP ranges and localhost.
// Only allow public HTTP(S) URLs.
function isInternalUrl(urlStr: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return true; // invalid URL → block
  }

  // Only allow http/https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost variants
  if (hostname === "localhost" || hostname === "::1" || hostname === "0.0.0.0") return true;

  // Block IPv4 private ranges: 10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number) as unknown as number[];
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 0) return true;
  }

  // Block IPv6 private: fc00::/7, fe80::/10
  if (hostname.startsWith("fc") || hostname.startsWith("fd") || hostname.startsWith("fe80")) {
    return true;
  }

  return false;
}

// POST /api/v1/skills/:slug/invoke — Synchronous skill invocation
// Auth: API Key (Bearer token) for external calls, or session cookie for try-run
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // ── 1. Authenticate: try API key first, then session ──
  const authHeader = request.headers.get("authorization");
  let apiKey = null;
  let sessionUser = null;

  if (authHeader?.startsWith("Bearer ")) {
    apiKey = await validateApiKey(authHeader);
    if (!apiKey) {
      return unauthorized("Invalid or missing API key");
    }
  } else {
    // Try session auth (for try-run console)
    sessionUser = await getSessionUser();
    if (!sessionUser) {
      return unauthorized("Authentication required (API key or login)");
    }
    // Disabled users cannot invoke (bypasses can() in other routes)
    if (!can(sessionUser, "browse")) {
      return forbidden("Account is disabled");
    }
  }

  // ── 2. Rate limit check (API key only) ──
  // Note: session-based try-run is not rate-limited in v1 (no Redis).
  // The PG-based limiter has a known TOCTOU gap under concurrent load;
  // acceptable for v1 per spec §3.4.
  let rateLimitRemaining: number | null = null;
  if (apiKey) {
    const rateLimit = await checkRateLimit(apiKey.id);
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiError>(
        { code: "RATE_LIMITED", message: "Rate limit exceeded (60/min)" },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } },
      );
    }
    rateLimitRemaining = rateLimit.remaining;
  }

  // ── 3. Look up skill (must be Approved) ──
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: { latestVersion: true },
  });

  if (!skill || skill.status !== "Approved") {
    return notFound("Skill not found or not available");
  }

  if (!skill.endpointUrl) {
    return NextResponse.json<ApiError>(
      { code: "STATE_INVALID", message: "Skill has no endpoint configured" },
      { status: 503 },
    );
  }

  // ── 3.5 SSRF protection: block internal URLs ──
  if (isInternalUrl(skill.endpointUrl)) {
    return NextResponse.json<ApiError>(
      {
        code: "STATE_INVALID",
        message: "Skill endpoint URL is not allowed (internal address blocked)",
      },
      { status: 502 },
    );
  }

  // ── 4. Parse input ──
  const input = await request.json().catch(() => ({}));

  // ── 5. Invoke skill endpoint ──
  const startTime = Date.now();
  let status: "Success" | "Failed" | "Timeout" = "Success";
  let errorMsg: string | null = null;
  let result: unknown = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), INVOKE_TIMEOUT_MS);

    const response = await fetch(skill.endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      status = "Failed";
      errorMsg = `Skill endpoint returned ${response.status}`;
      // Don't expose raw endpoint response to caller (information leak)
      await response.text().catch(() => null);
    } else {
      try {
        result = await response.json();
      } catch {
        result = await response.text().catch(() => null);
      }
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      status = "Timeout";
      errorMsg = "Skill invocation timed out (30s)";
    } else {
      status = "Failed";
      // Don't expose internal error details to caller
      errorMsg = "Skill invocation failed";
    }
  }

  const latencyMs = Date.now() - startTime;

  // ── 6. Record call log ──
  await prisma.callLog.create({
    data: {
      skillId: skill.id,
      versionId: skill.latestVersionId,
      userId: apiKey?.userId ?? sessionUser?.id ?? null,
      apiKeyId: apiKey?.id ?? null,
      status,
      latencyMs,
      error: errorMsg,
    },
  });

  // Update aggregate call count (fire and forget)
  prisma.skill
    .update({
      where: { id: skill.id },
      data: { callCount: { increment: 1 } },
    })
    .catch(() => {});

  // ── 7. Return result ──
  if (status === "Timeout") {
    return NextResponse.json<ApiError>(
      { code: "TIMEOUT", message: errorMsg ?? "Request timed out" },
      { status: 504 },
    );
  }

  if (status === "Failed") {
    // Do not leak endpoint response details (removed `details: result`)
    return NextResponse.json<ApiError>(
      { code: "INTERNAL", message: errorMsg ?? "Skill invocation failed" },
      { status: 502 },
    );
  }

  const headers: Record<string, string> = {};
  if (rateLimitRemaining !== null) {
    headers["X-RateLimit-Remaining"] = String(rateLimitRemaining);
  }

  return NextResponse.json({ result, latencyMs }, { headers });
}
