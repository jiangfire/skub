import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { recordAudit, AUDIT_ACTIONS } from "@/server/audit.service";

// ─── API Key Service ───
// Key format: "sk_" + 40 random hex chars = 43 chars total
// Storage: SHA-256 hash (never store plaintext)
// Display: prefix "sk_" + first 8 chars of the random part

const KEY_PREFIX = "sk_";
const RANDOM_LENGTH = 40; // hex chars = 20 bytes

/**
 * Generate a new API key for a user.
 * Returns the plaintext key (shown once) and the DB record.
 */
export async function createApiKey(userId: string, name: string) {
  const random = randomBytes(RANDOM_LENGTH / 2).toString("hex"); // 20 bytes → 40 hex chars
  const plaintext = KEY_PREFIX + random;
  const keyHash = hashKey(plaintext);
  const prefix = KEY_PREFIX + random.slice(0, 8);

  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash,
      prefix,
    },
  });

  await recordAudit({
    userId,
    action: AUDIT_ACTIONS.API_KEY_CREATED,
    targetType: "ApiKey",
    targetId: apiKey.id,
    payload: { name },
  });

  return { apiKey, plaintext };
}

/**
 * List all active API keys for a user.
 */
export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
}

/**
 * Revoke an API key.
 */
export async function revokeApiKey(userId: string, keyId: string) {
  const apiKey = await prisma.apiKey.findUnique({ where: { id: keyId } });
  if (!apiKey || apiKey.userId !== userId) {
    throw new Error("NOT_FOUND: API key not found");
  }

  await prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });

  await recordAudit({
    userId,
    action: AUDIT_ACTIONS.API_KEY_REVOKED,
    targetType: "ApiKey",
    targetId: keyId,
  });
}

/**
 * Validate an API key from the Authorization header.
 * Returns the API key record + user if valid, null otherwise.
 */
export async function validateApiKey(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const plaintext = authHeader.slice(7);
  if (!plaintext.startsWith(KEY_PREFIX)) return null;

  const keyHash = hashKey(plaintext);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKey || apiKey.revokedAt) return null;
  if (apiKey.user.status !== "Active") return null;

  // Update last used (fire and forget)
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return apiKey;
}

// ─── Helpers ───

function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}
