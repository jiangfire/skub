import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  if (!plaintext || !hash) return false;
  return bcrypt.compare(plaintext, hash);
}
