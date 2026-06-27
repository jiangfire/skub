import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { transition } from "@/lib/skill/state";
import { assertCan } from "@/lib/auth/permissions";
import { recordAudit, AUDIT_ACTIONS } from "@/server/audit.service";
import { notify, NOTIFICATION_TYPES } from "@/server/notification.service";
import type { AuthUser, SkillStatus } from "@/types/domain";
import type { CreateSkillInput } from "@/lib/auth/schemas";

// ─── Skill Service ───
// Core business logic for skill lifecycle management.
// Every state change goes through the state machine (Plan §3).
// Every operation goes through permission checks (Plan §5).
// Every key action is recorded in the audit log (Spec AC-9).

export class SkillServiceError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// Helper: cast Record<string, unknown> to Prisma JSON input type
function asJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

// ─── Create ───

/**
 * Create a new skill in Draft state with initial version 1.0.0.
 * Requires Contributor+ permission.
 */
export async function createSkill(user: AuthUser, input: CreateSkillInput) {
  assertCan(user, "createSkill");

  // Check slug uniqueness
  const existing = await prisma.skill.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new SkillServiceError("CONFLICT", `Skill with slug "${input.slug}" already exists`);
  }

  // Create skill + initial version in a transaction (atomic)
  const skill = await prisma.$transaction(async (tx) => {
    const skill = await tx.skill.create({
      data: {
        slug: input.slug,
        name: input.name,
        summary: input.summary,
        tags: input.tags ?? [],
        categoryId: input.categoryId ?? null,
        endpointUrl: input.endpointUrl ?? null,
        ownerId: user.id,
        status: "Draft",
        skillMd: input.skillMd,
        inputSchema: asJson(input.inputSchema),
        outputSchema: asJson(input.outputSchema),
      },
    });

    const version = await tx.skillVersion.create({
      data: {
        skillId: skill.id,
        version: "1.0.0",
        skillMd: input.skillMd,
        inputSchema: asJson(input.inputSchema),
        outputSchema: asJson(input.outputSchema),
      },
    });

    // Link latest version
    await tx.skill.update({
      where: { id: skill.id },
      data: { latestVersionId: version.id },
    });

    // Optionally create digital employee persona
    if (input.digitalEmployee) {
      await tx.digitalEmployee.create({
        data: {
          skillId: skill.id,
          personaName: input.digitalEmployee.personaName,
          avatarUrl: input.digitalEmployee.avatarUrl,
          personaIntro: input.digitalEmployee.personaIntro,
          welcomeMessage: input.digitalEmployee.welcomeMessage,
          roleDesc: input.digitalEmployee.roleDesc,
        },
      });
    }

    return skill;
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.SKILL_CREATED,
    targetType: "Skill",
    targetId: skill.id,
    payload: { slug: input.slug, name: input.name },
  });

  return skill;
}

// ─── Read ───

/**
 * Get a skill by slug.
 * Visibility: Approved skills are visible to all. Other states only to owner/reviewer/owner.
 */
export async function getSkillBySlug(user: AuthUser | null, slug: string) {
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      category: true,
      latestVersion: true,
      digitalEmployee: true,
      _count: {
        select: { likes: true, favorites: true, comments: true },
      },
    },
  });

  if (!skill) {
    throw new SkillServiceError("NOT_FOUND", "Skill not found");
  }

  // Visibility check: non-Approved skills only visible to owner/reviewer/owner
  if (skill.status !== "Approved") {
    if (!user) {
      throw new SkillServiceError("NOT_FOUND", "Skill not found");
    }
    const isOwner = skill.ownerId === user.id;
    const canReview = user.role === "Reviewer" || user.role === "Owner";
    if (!isOwner && !canReview) {
      throw new SkillServiceError("NOT_FOUND", "Skill not found");
    }
  }

  return skill;
}

/**
 * List skills with filtering, sorting, and pagination.
 * Public listing only shows Approved skills.
 */
export async function listSkills(params: {
  q?: string;
  categoryId?: string;
  tag?: string;
  sort?: "latest" | "popular" | "rating";
  page?: number;
  pageSize?: number;
}) {
  const { q, categoryId, tag, sort = "latest", page = 1, pageSize = 20 } = params;

  // Clamp pagination to valid ranges
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

  const where: Prisma.SkillWhereInput = {
    status: "Approved",
    ...(categoryId && { categoryId }),
    ...(tag && { tags: { has: tag } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Prisma.SkillOrderByWithRelationInput = {
    latest: { createdAt: "desc" as const },
    popular: { callCount: "desc" as const },
    rating: { ratingAvg: "desc" as const },
  }[sort];

  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where,
      orderBy,
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        digitalEmployee: true,
        _count: {
          select: { likes: true, favorites: true },
        },
      },
    }),
    prisma.skill.count({ where }),
  ]);

  return {
    skills,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(total / safePageSize),
  };
}

// ─── Update ───

/**
 * Update a skill's editable fields.
 * Only allowed in Draft or Rejected state.
 * If Rejected, transitions to Draft (edit action).
 */
export async function updateSkill(
  user: AuthUser,
  skillId: string,
  input: Partial<
    Pick<
      CreateSkillInput,
      | "name"
      | "summary"
      | "tags"
      | "categoryId"
      | "endpointUrl"
      | "skillMd"
      | "inputSchema"
      | "outputSchema"
    >
  >,
) {
  assertCan(user, "editOwnSkill");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    throw new SkillServiceError("NOT_FOUND", "Skill not found");
  }

  if (skill.ownerId !== user.id) {
    throw new SkillServiceError("FORBIDDEN", "You can only edit your own skills");
  }

  // Only Draft and Rejected can be edited
  if (skill.status !== "Draft" && skill.status !== "Rejected") {
    throw new SkillServiceError("STATE_INVALID", `Cannot edit skill in "${skill.status}" state`);
  }

  // If Rejected, transition to Draft via edit action
  let newStatus: SkillStatus = skill.status as SkillStatus;
  if (skill.status === "Rejected") {
    newStatus = transition("Rejected", "edit"); // → Draft
  }

  // Determine if content changed (requires version sync)
  const contentChanged =
    input.skillMd !== undefined ||
    input.inputSchema !== undefined ||
    input.outputSchema !== undefined;

  const updateData: Prisma.SkillUpdateInput = {
    status: newStatus,
  };
  if (input.name) updateData.name = input.name;
  if (input.summary) updateData.summary = input.summary;
  if (input.tags) updateData.tags = input.tags;
  if (input.categoryId !== undefined) {
    updateData.category = input.categoryId
      ? { connect: { id: input.categoryId } }
      : { disconnect: true };
  }
  if (input.endpointUrl !== undefined) updateData.endpointUrl = input.endpointUrl ?? null;
  if (input.skillMd) updateData.skillMd = input.skillMd;
  if (input.inputSchema) updateData.inputSchema = asJson(input.inputSchema);
  if (input.outputSchema) updateData.outputSchema = asJson(input.outputSchema);

  await prisma.$transaction(async (tx) => {
    await tx.skill.update({ where: { id: skillId }, data: updateData });

    // If content changed, update the latest version too (keep in sync)
    if (contentChanged && skill.latestVersionId) {
      const versionUpdate: Prisma.SkillVersionUpdateInput = {};
      if (input.skillMd) versionUpdate.skillMd = input.skillMd;
      if (input.inputSchema) versionUpdate.inputSchema = asJson(input.inputSchema);
      if (input.outputSchema) versionUpdate.outputSchema = asJson(input.outputSchema);
      await tx.skillVersion.update({
        where: { id: skill.latestVersionId },
        data: versionUpdate,
      });
    }
  });
}

// ─── State Transitions ───

/**
 * Submit a skill for review (Draft → Pending).
 */
export async function submitForReview(user: AuthUser, skillId: string) {
  assertCan(user, "submitForReview");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    throw new SkillServiceError("NOT_FOUND", "Skill not found");
  }

  if (skill.ownerId !== user.id) {
    throw new SkillServiceError("FORBIDDEN", "You can only submit your own skills");
  }

  const newStatus = transition(skill.status as SkillStatus, "submit");

  await prisma.skill.update({
    where: { id: skillId },
    data: { status: newStatus },
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.SKILL_SUBMITTED,
    targetType: "Skill",
    targetId: skillId,
    payload: { from: skill.status, to: newStatus },
  });
}

/**
 * Reviewer approves a skill (Pending → Approved).
 */
export async function approveSkill(user: AuthUser, skillId: string, comment: string) {
  assertCan(user, "review");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    throw new SkillServiceError("NOT_FOUND", "Skill not found");
  }

  if (!skill.latestVersionId) {
    throw new SkillServiceError("STATE_INVALID", "Skill has no version to review");
  }
  const versionId = skill.latestVersionId;

  const newStatus = transition(skill.status as SkillStatus, "approve");

  await prisma.$transaction(async (tx) => {
    await tx.skill.update({
      where: { id: skillId },
      data: { status: newStatus },
    });

    await tx.review.create({
      data: {
        skillId,
        versionId,
        reviewerId: user.id,
        decision: "Approve",
        comment,
      },
    });
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.SKILL_APPROVED,
    targetType: "Skill",
    targetId: skillId,
    payload: { comment },
  });

  await notify({
    userId: skill.ownerId,
    type: NOTIFICATION_TYPES.REVIEW_APPROVED,
    title: "技能审核通过",
    content: `您的技能「${skill.name}」已通过审核，现已上架。${comment ? `审核意见：${comment}` : ""}`,
    link: `/skills/${skill.slug}`,
  });
}

/**
 * Reviewer rejects a skill (Pending → Rejected).
 */
export async function rejectSkill(user: AuthUser, skillId: string, comment: string) {
  assertCan(user, "review");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    throw new SkillServiceError("NOT_FOUND", "Skill not found");
  }

  if (!skill.latestVersionId) {
    throw new SkillServiceError("STATE_INVALID", "Skill has no version to review");
  }
  const versionId = skill.latestVersionId;

  const newStatus = transition(skill.status as SkillStatus, "reject");

  await prisma.$transaction(async (tx) => {
    await tx.skill.update({
      where: { id: skillId },
      data: { status: newStatus },
    });

    await tx.review.create({
      data: {
        skillId,
        versionId,
        reviewerId: user.id,
        decision: "Reject",
        comment,
      },
    });
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.SKILL_REJECTED,
    targetType: "Skill",
    targetId: skillId,
    payload: { comment },
  });

  await notify({
    userId: skill.ownerId,
    type: NOTIFICATION_TYPES.REVIEW_REJECTED,
    title: "技能审核被驳回",
    content: `您的技能「${skill.name}」被驳回。审核意见：${comment}`,
    link: `/studio/${skillId}`,
  });
}

/**
 * Reviewer requests changes (Pending → Draft).
 */
export async function requestChanges(user: AuthUser, skillId: string, comment: string) {
  assertCan(user, "review");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    throw new SkillServiceError("NOT_FOUND", "Skill not found");
  }

  if (!skill.latestVersionId) {
    throw new SkillServiceError("STATE_INVALID", "Skill has no version to review");
  }
  const versionId = skill.latestVersionId;

  const newStatus = transition(skill.status as SkillStatus, "requestChanges");

  await prisma.$transaction(async (tx) => {
    await tx.skill.update({
      where: { id: skillId },
      data: { status: newStatus },
    });

    await tx.review.create({
      data: {
        skillId,
        versionId,
        reviewerId: user.id,
        decision: "RequestChanges",
        comment,
      },
    });
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.SKILL_CHANGES_REQUESTED,
    targetType: "Skill",
    targetId: skillId,
    payload: { comment },
  });

  await notify({
    userId: skill.ownerId,
    type: NOTIFICATION_TYPES.REVIEW_CHANGES_REQUESTED,
    title: "技能需要修改",
    content: `您的技能「${skill.name}」被要求修改后重新提交。审核意见：${comment}`,
    link: `/studio/${skillId}`,
  });
}

/**
 * Contributor self-offline their skill (Approved → Offline).
 */
export async function selfOfflineSkill(user: AuthUser, skillId: string) {
  assertCan(user, "selfOffline");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    throw new SkillServiceError("NOT_FOUND", "Skill not found");
  }

  if (skill.ownerId !== user.id) {
    throw new SkillServiceError("FORBIDDEN", "You can only offline your own skills");
  }

  const newStatus = transition(skill.status as SkillStatus, "selfOffline");

  await prisma.skill.update({
    where: { id: skillId },
    data: { status: newStatus },
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.SKILL_SELF_OFFLINE,
    targetType: "Skill",
    targetId: skillId,
  });
}

/**
 * Hub Owner force-offline any skill (Approved → Offline).
 * Requires a reason (10-500 chars).
 */
export async function forceOfflineSkill(user: AuthUser, skillId: string, reason: string) {
  assertCan(user, "forceOffline");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    throw new SkillServiceError("NOT_FOUND", "Skill not found");
  }

  const newStatus = transition(skill.status as SkillStatus, "forceOffline");

  await prisma.skill.update({
    where: { id: skillId },
    data: { status: newStatus },
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.SKILL_FORCE_OFFLINE,
    targetType: "Skill",
    targetId: skillId,
    payload: { reason, skillName: skill.name, ownerId: skill.ownerId },
  });

  await notify({
    userId: skill.ownerId,
    type: NOTIFICATION_TYPES.SKILL_FORCE_OFFLINE,
    title: "技能被强制下架",
    content: `您的技能「${skill.name}」被管理员强制下架。原因：${reason}`,
    link: `/studio/${skillId}`,
  });
}

/**
 * Republish an offline skill (Offline → Pending).
 */
export async function republishSkill(user: AuthUser, skillId: string) {
  assertCan(user, "republish");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    throw new SkillServiceError("NOT_FOUND", "Skill not found");
  }

  if (skill.ownerId !== user.id) {
    throw new SkillServiceError("FORBIDDEN", "You can only republish your own skills");
  }

  const newStatus = transition(skill.status as SkillStatus, "republish");

  await prisma.skill.update({
    where: { id: skillId },
    data: { status: newStatus },
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.SKILL_REPUBLISHED,
    targetType: "Skill",
    targetId: skillId,
  });
}

// ─── Version Management ───

/**
 * Create a new version of a skill.
 * Auto-increments patch version if not specified.
 */
export async function createVersion(
  user: AuthUser,
  skillId: string,
  input: {
    skillMd: string;
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
    changelog?: string;
    version?: string;
  },
) {
  assertCan(user, "editOwnSkill");

  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!skill) {
    throw new SkillServiceError("NOT_FOUND", "Skill not found");
  }

  if (skill.ownerId !== user.id) {
    throw new SkillServiceError("FORBIDDEN", "You can only create versions for your own skills");
  }

  // Only Draft and Rejected can have new versions (same rule as updateSkill)
  if (skill.status !== "Draft" && skill.status !== "Rejected") {
    throw new SkillServiceError(
      "STATE_INVALID",
      `Cannot create version in "${skill.status}" state; only Draft or Rejected skills can be edited`,
    );
  }

  // Determine version number
  const version = input.version ?? incrementPatchVersion(skill.versions[0]?.version ?? "1.0.0");

  const newVersion = await prisma.$transaction(async (tx) => {
    const newVersion = await tx.skillVersion.create({
      data: {
        skillId,
        version,
        skillMd: input.skillMd,
        inputSchema: asJson(input.inputSchema),
        outputSchema: asJson(input.outputSchema),
        changelog: input.changelog ?? null,
      },
    });

    // Update skill's latest version and redundant fields
    await tx.skill.update({
      where: { id: skillId },
      data: {
        latestVersionId: newVersion.id,
        skillMd: input.skillMd,
        inputSchema: asJson(input.inputSchema),
        outputSchema: asJson(input.outputSchema),
      },
    });

    return newVersion;
  });

  return newVersion;
}

/**
 * Get the review queue (Pending skills) for reviewers.
 */
export async function getReviewQueue(user: AuthUser, page = 1, pageSize = 20) {
  assertCan(user, "review");

  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where: { status: "Pending" },
      orderBy: { updatedAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        latestVersion: true,
      },
    }),
    prisma.skill.count({ where: { status: "Pending" } }),
  ]);

  return { skills, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Get skills owned by a user (studio dashboard).
 */
export async function getMySkills(user: AuthUser, page = 1, pageSize = 20) {
  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        latestVersion: true,
        digitalEmployee: true,
        _count: { select: { callLogs: true } },
      },
    }),
    prisma.skill.count({ where: { ownerId: user.id } }),
  ]);

  return { skills, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ─── Helpers ───

function incrementPatchVersion(version: string): string {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "1.0.0";
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}
