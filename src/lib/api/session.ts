import { cookies } from "next/headers";
import { verifyToken, type JwtPayload } from "@/lib/auth/jwt";
import { resolveUser } from "@/server/auth.service";
import { assertCan } from "@/lib/auth/permissions";
import type { AuthUser, PermissionAction } from "@/types/domain";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";

// ─── Session Helpers ───
// Bridge between HTTP layer (cookies) and domain layer (AuthUser).

/**
 * Get the current session user from the request cookies.
 * Returns null if not authenticated or token is invalid.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    return null;
  }

  return resolveUser(payload);
}

/**
 * Get the current session user, or throw if not authenticated.
 */
export async function requireSessionUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  return user;
}

/**
 * Get the current active session user, or throw if not authenticated or disabled.
 */
export async function requireActiveUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user || user.status === "Disabled") {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  return user;
}

/**
 * Get the current session user and assert they can perform an action.
 * @throws Error with "UNAUTHORIZED" if not logged in.
 * @throws Error with "FORBIDDEN" if lacks permission.
 */
export async function requirePermission(action: PermissionAction): Promise<AuthUser> {
  const user = await requireSessionUser();
  assertCan(user, action);
  return user;
}
