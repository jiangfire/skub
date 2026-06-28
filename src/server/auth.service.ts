import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signToken, type JwtPayload } from "@/lib/auth/jwt";
import type { AuthUser } from "@/types/domain";

// ─── Auth Service ───
// Handles registration, login, and user retrieval (Single Responsibility).
// Depends on abstractions (prisma, password, jwt) not concrete implementations (DIP).

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Register a new user.
 * @throws AuthError if email already exists.
 */
export async function registerUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<{ user: AuthUser; token: string }> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AuthError("CONFLICT", "Email already registered");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: "Visitor",
      status: "Active",
    },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { user: toAuthUser(user), token };
}

/**
 * Login with email and password.
 * @throws AuthError if credentials are invalid or user is disabled.
 */
export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; token: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (!user) {
    throw new AuthError("UNAUTHORIZED", "Invalid email or password");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("UNAUTHORIZED", "Invalid email or password");
  }

  if (user.status !== "Active") {
    throw new AuthError("FORBIDDEN", "Account is disabled");
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { user: toAuthUser(user), token };
}

/**
 * Get a user by ID (for session resolution).
 */
export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return toAuthUser(user);
}

/**
 * Resolve a JWT payload to an AuthUser (re-fetches from DB to get latest role/status).
 */
export async function resolveUser(payload: JwtPayload): Promise<AuthUser | null> {
  return getUserById(payload.userId);
}

// ─── Helpers ───

function toAuthUser(user: { id: string; name: string; role: string; status: string }): AuthUser {
  return {
    id: user.id,
    name: user.name,
    role: user.role as AuthUser["role"],
    status: user.status as AuthUser["status"],
  };
}
