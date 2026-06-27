import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ─── Audit Log Service ───
// Single entry point for recording auditable actions (DRY).
// All key operations (publish/review/offline/role-change/force-offline) must call this.

export interface AuditEntry {
  userId?: string;
  action: string; // e.g. "SKILL_PUBLISHED", "FORCE_OFFLINE"
  targetType: string; // "Skill" | "User" | "Category"
  targetId?: string;
  payload?: Record<string, unknown>;
}

/**
 * Record an audit log entry.
 * Non-blocking: errors are logged but never thrown (audit should not break the main flow).
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        payload: (entry.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    console.error("Failed to record audit log:", e);
  }
}

// ─── Audit Action Constants ───
// Centralized action names to prevent typos (DRY).
export const AUDIT_ACTIONS = {
  USER_REGISTERED: "USER_REGISTERED",
  USER_INVITED: "USER_INVITED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
  USER_DISABLED: "USER_DISABLED",
  SKILL_CREATED: "SKILL_CREATED",
  SKILL_SUBMITTED: "SKILL_SUBMITTED",
  SKILL_APPROVED: "SKILL_APPROVED",
  SKILL_REJECTED: "SKILL_REJECTED",
  SKILL_CHANGES_REQUESTED: "SKILL_CHANGES_REQUESTED",
  SKILL_SELF_OFFLINE: "SKILL_SELF_OFFLINE",
  SKILL_FORCE_OFFLINE: "SKILL_FORCE_OFFLINE",
  SKILL_REPUBLISHED: "SKILL_REPUBLISHED",
  CATEGORY_CREATED: "CATEGORY_CREATED",
  CATEGORY_UPDATED: "CATEGORY_UPDATED",
  CATEGORY_DELETED: "CATEGORY_DELETED",
  DIGITAL_EMPLOYEE_CREATED: "DIGITAL_EMPLOYEE_CREATED",
  API_KEY_CREATED: "API_KEY_CREATED",
  API_KEY_REVOKED: "API_KEY_REVOKED",
} as const;
