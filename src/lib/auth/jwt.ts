import jwt from "jsonwebtoken";
import type { Role } from "@/types/domain";

// ─── JWT Payload ───
export interface JwtPayload {
  userId: string;
  role: Role;
}

// ─── Public API ───

/**
 * Sign a JWT token containing user identity.
 * Reads JWT_SECRET and JWT_EXPIRES_IN from environment.
 */
export function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as unknown as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Verify a JWT token and return the payload.
 * @throws jwt.JsonWebTokenError | jwt.TokenExpiredError if invalid
 */
export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
  return {
    userId: decoded.userId,
    role: decoded.role,
  };
}
