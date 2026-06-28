import type { AuthUser, Role, PermissionAction } from "@/types/domain";

// ─── Permission Table ───
// Single source of truth for the role-permission matrix (DRY).
// Adding a new action or role = adding one column/row (Open/Closed Principle).
// Aligned with Plan §5 权限矩阵.
export const ROLE_PERMISSIONS: Readonly<Record<Role, Readonly<Record<PermissionAction, boolean>>>> =
  Object.freeze({
    Visitor: Object.freeze({
      browse: true,
      rate: true,
      comment: true,
      favorite: true,
      like: true,
      createSkill: false,
      editOwnSkill: false,
      submitForReview: false,
      selfOffline: false,
      republish: false,
      review: false,
      forceOffline: false,
      manageUsers: false,
      manageCategories: false,
      viewAuditLogs: false,
      deleteSkill: false,
      manageSkills: false,
      viewStats: false,
    }),
    Contributor: Object.freeze({
      browse: true,
      rate: true,
      comment: true,
      favorite: true,
      like: true,
      createSkill: true,
      editOwnSkill: true,
      submitForReview: true,
      selfOffline: true,
      republish: true,
      review: false,
      forceOffline: false,
      manageUsers: false,
      manageCategories: false,
      viewAuditLogs: false,
      deleteSkill: false,
      manageSkills: false,
      viewStats: false,
    }),
    Reviewer: Object.freeze({
      browse: true,
      rate: true,
      comment: true,
      favorite: true,
      like: true,
      createSkill: true,
      editOwnSkill: true,
      submitForReview: true,
      selfOffline: true,
      republish: true,
      review: true,
      forceOffline: false,
      manageUsers: false,
      manageCategories: false,
      viewAuditLogs: false,
      deleteSkill: false,
      manageSkills: false,
      viewStats: false,
    }),
    Owner: Object.freeze({
      browse: true,
      rate: true,
      comment: true,
      favorite: true,
      like: true,
      createSkill: true,
      editOwnSkill: true,
      submitForReview: true,
      selfOffline: true,
      republish: true,
      review: true,
      forceOffline: true,
      manageUsers: true,
      manageCategories: true,
      viewAuditLogs: true,
      deleteSkill: true,
      manageSkills: true,
      viewStats: true,
    }),
  });

// ─── Public API ───

/**
 * Check if a user can perform an action.
 * Returns false for disabled users regardless of role.
 */
export function can(user: AuthUser, action: PermissionAction): boolean {
  if (user.status !== "Active") return false;
  return ROLE_PERMISSIONS[user.role][action] ?? false;
}

/**
 * Assert that a user can perform an action.
 * @throws Error with "FORBIDDEN" if the user lacks permission.
 */
export function assertCan(user: AuthUser, action: PermissionAction): void {
  if (!can(user, action)) {
    throw new Error(
      `FORBIDDEN: role "${user.role}" (status: ${user.status}) cannot perform "${action}"`,
    );
  }
}
