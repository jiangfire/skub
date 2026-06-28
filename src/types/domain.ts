// ─── Domain Types ───
// Central type definitions for the Skills Hub domain.
// Following SOLID: these are stable abstractions that downstream modules depend on.

// ── Roles (hierarchy: Visitor < Contributor < Reviewer < Owner) ──
export type Role = "Visitor" | "Contributor" | "Reviewer" | "Owner";

export const ROLE_HIERARCHY: readonly Role[] = [
  "Visitor",
  "Contributor",
  "Reviewer",
  "Owner",
] as const;

// ── Skill Lifecycle States ──
export type SkillStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Offline";

// ── Review Decisions ──
export type ReviewDecision = "Approve" | "Reject" | "RequestChanges";

// ── State Machine Actions ──
// Each action maps to exactly one state transition (Single Responsibility).
export type SkillAction =
  | "submit" // Draft → Pending
  | "approve" // Pending → Approved
  | "reject" // Pending → Rejected
  | "requestChanges" // Pending → Draft
  | "edit" // Rejected → Draft
  | "selfOffline" // Approved → Offline (by owner of skill)
  | "forceOffline" // Approved → Offline (by Hub Owner, requires reason)
  | "republish"; // Offline → Pending

// ── Permission Actions ──
// Granular actions that can be checked against user roles.
export type PermissionAction =
  | "browse"
  | "rate"
  | "comment"
  | "favorite"
  | "like"
  | "createSkill"
  | "editOwnSkill"
  | "submitForReview"
  | "selfOffline"
  | "republish"
  | "review"
  | "forceOffline"
  | "manageUsers"
  | "manageCategories"
  | "viewAuditLogs"
  | "deleteSkill"
  | "manageSkills"
  | "viewStats";

// ── User (minimal shape for permission checks) ──
export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  status: "Active" | "Disabled";
}

// ── API Error ──
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ── Common Error Codes ──
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  STATE_INVALID: "STATE_INVALID",
  CONFLICT: "CONFLICT",
  INTERNAL: "INTERNAL",
} as const;
