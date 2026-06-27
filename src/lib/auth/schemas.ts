import { z } from "zod";

// ─── Auth Schemas ───

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(8).max(128),
});

// ─── Skill Schemas ───

// Slug: lowercase letters, numbers, hyphens only
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Digital Employee persona schema (defined here so createSkillSchema can reference it)
export const digitalEmployeeSchema = z.object({
  personaName: z.string().min(1).max(80),
  avatarUrl: z.string().url(),
  personaIntro: z.string().min(1).max(2000),
  welcomeMessage: z.string().min(1).max(500),
  roleDesc: z.string().min(1).max(500),
});

export const createSkillSchema = z.object({
  slug: z.string().min(2).max(80).regex(slugRegex, "slug must be lowercase kebab-case"),
  name: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  tags: z.array(z.string()).optional().default([]),
  categoryId: z.string().optional().nullable(),
  endpointUrl: z.string().url().optional().nullable(),
  skillMd: z.string().min(1),
  inputSchema: z.record(z.unknown()),
  outputSchema: z.record(z.unknown()),
  // Optional: attach digital employee persona at creation time
  digitalEmployee: digitalEmployeeSchema.optional(),
});

export const createVersionSchema = z.object({
  skillMd: z.string().min(1),
  inputSchema: z.record(z.unknown()),
  outputSchema: z.record(z.unknown()),
  changelog: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "version must be SemVer (e.g. 1.0.0)"),
});

// ─── Review Schemas ───

export const reviewDecisionSchema = z.object({
  decision: z.enum(["Approve", "Reject", "RequestChanges"]),
  comment: z.string().min(1).max(5000),
});

// ─── Comment Schemas ───

export const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().optional().nullable(),
});

// ─── Rating Schemas ───

export const createRatingSchema = z.object({
  stars: z.number().int().min(1).max(5),
});

// ─── API Key Schemas ───

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(50),
});

// ─── Force Offline Schemas ───

export const forceOfflineSchema = z.object({
  reason: z.string().min(10).max(500),
});

// ─── Admin: User Management Schemas ───

export const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(8).max(128),
  role: z.enum(["Visitor", "Contributor", "Reviewer", "Owner"]),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  status: z.enum(["Active", "Disabled"]).optional(),
});

export const assignRoleSchema = z.object({
  role: z.enum(["Visitor", "Contributor", "Reviewer", "Owner"]),
});

// ─── Admin: Category Management Schemas ───

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  parentId: z.string().optional().nullable(),
  sort: z.number().int().optional().default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  parentId: z.string().optional().nullable(),
  sort: z.number().int().optional(),
});

// ─── Admin: Audit Log Query Schema ───

export const auditLogQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  actor: z.string().optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  format: z.enum(["json", "csv"]).optional(),
});

// ─── Digital Employee Schemas (definition moved above createSkillSchema) ───

// ─── Types (inferred from schemas) ───

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateRatingInput = z.infer<typeof createRatingSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type ForceOfflineInput = z.infer<typeof forceOfflineSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
export type DigitalEmployeeInput = z.infer<typeof digitalEmployeeSchema>;
