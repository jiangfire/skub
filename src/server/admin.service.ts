import { prisma } from "@/lib/prisma";
import type { Prisma, Role } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { assertCan } from "@/lib/auth/permissions";
import { recordAudit, AUDIT_ACTIONS } from "@/server/audit.service";
import { notify, NOTIFICATION_TYPES } from "@/server/notification.service";
import type { AuthUser } from "@/types/domain";
import type {
  InviteUserInput,
  UpdateUserInput,
  AssignRoleInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  AuditLogQueryInput,
} from "@/lib/auth/schemas";

// ─── Admin Service ───
// Handles user management, category management, audit logs, and stats.
// All operations require Owner permission (Plan §5 权限矩阵).

export class AdminServiceError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// ═══════════════════════════════════════
// User Management
// ═══════════════════════════════════════

/**
 * List all users with pagination.
 */
export async function listUsers(user: AuthUser, page = 1, pageSize = 20) {
  assertCan(user, "manageUsers");

  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { skills: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(total / safePageSize),
  };
}

/**
 * Invite (create) a new user with a specific role.
 * Owner-only operation.
 */
export async function inviteUser(user: AuthUser, input: InviteUserInput) {
  assertCan(user, "manageUsers");

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AdminServiceError("CONFLICT", "Email already registered");
  }

  const passwordHash = await hashPassword(input.password);
  const newUser = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role as Role,
      status: "Active",
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.USER_INVITED,
    targetType: "User",
    targetId: newUser.id,
    payload: { email: input.email, name: input.name, role: input.role },
  });

  return newUser;
}

/**
 * Update a user's profile or status.
 */
export async function updateUser(user: AuthUser, userId: string, input: UpdateUserInput) {
  assertCan(user, "manageUsers");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    throw new AdminServiceError("NOT_FOUND", "User not found");
  }

  // Prevent self-disabling
  if (input.status === "Disabled" && userId === user.id) {
    throw new AdminServiceError("FORBIDDEN", "Cannot disable your own account");
  }

  const updateData: Prisma.UserUpdateInput = {};
  if (input.name) updateData.name = input.name;
  if (input.status) updateData.status = input.status;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  if (input.status === "Disabled") {
    await recordAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.USER_DISABLED,
      targetType: "User",
      targetId: userId,
      payload: { email: target.email },
    });
  }

  return updated;
}

/**
 * Assign a role to a user.
 */
export async function assignRole(user: AuthUser, userId: string, input: AssignRoleInput) {
  assertCan(user, "manageUsers");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    throw new AdminServiceError("NOT_FOUND", "User not found");
  }

  // Prevent self-demotion (Owner demoting themselves could lock the system)
  if (userId === user.id && input.role !== "Owner") {
    throw new AdminServiceError(
      "FORBIDDEN",
      "Cannot demote yourself; ask another Owner to change your role",
    );
  }

  const oldRole = target.role;
  await prisma.user.update({
    where: { id: userId },
    data: { role: input.role as Role },
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
    targetType: "User",
    targetId: userId,
    payload: { from: oldRole, to: input.role, email: target.email },
  });

  await notify({
    userId,
    type: NOTIFICATION_TYPES.ROLE_CHANGED,
    title: "角色已变更",
    content: `您的角色已从 ${oldRole} 变更为 ${input.role}。`,
  });
}

/**
 * Delete (soft-disable) a user.
 * We don't hard-delete to preserve referential integrity of audit logs and skills.
 */
export async function deleteUser(user: AuthUser, userId: string) {
  assertCan(user, "manageUsers");

  if (userId === user.id) {
    throw new AdminServiceError("FORBIDDEN", "Cannot delete your own account");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    throw new AdminServiceError("NOT_FOUND", "User not found");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "Disabled" },
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.USER_DISABLED,
    targetType: "User",
    targetId: userId,
    payload: { email: target.email, name: target.name },
  });
}

// ═══════════════════════════════════════
// Category Management
// ═══════════════════════════════════════

/**
 * List all categories as a flat list (UI can build tree).
 */
export async function listCategories(user: AuthUser) {
  assertCan(user, "manageCategories");

  return prisma.category.findMany({
    include: {
      _count: { select: { skills: true } },
      children: { select: { id: true, name: true } },
    },
    orderBy: [{ sort: "asc" }, { name: "asc" }],
  });
}

/**
 * Create a new category.
 */
export async function createCategory(user: AuthUser, input: CreateCategoryInput) {
  assertCan(user, "manageCategories");

  if (input.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent) {
      throw new AdminServiceError("NOT_FOUND", "Parent category not found");
    }
  }

  const category = await prisma.category.create({
    data: {
      name: input.name,
      parentId: input.parentId ?? null,
      sort: input.sort,
    },
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.CATEGORY_CREATED,
    targetType: "Category",
    targetId: category.id,
    payload: { name: input.name, parentId: input.parentId },
  });

  return category;
}

/**
 * Update a category.
 */
export async function updateCategory(
  user: AuthUser,
  categoryId: string,
  input: UpdateCategoryInput,
) {
  assertCan(user, "manageCategories");

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new AdminServiceError("NOT_FOUND", "Category not found");
  }

  // Prevent circular reference (direct and indirect)
  if (input.parentId === categoryId) {
    throw new AdminServiceError("VALIDATION_ERROR", "Category cannot be its own parent");
  }

  if (input.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent) {
      throw new AdminServiceError("NOT_FOUND", "Parent category not found");
    }
    // Walk up the parent chain to detect indirect circular reference
    let current: { parentId: string | null } | null = parent;
    const visited = new Set<string>([categoryId]);
    while (current?.parentId) {
      if (visited.has(current.parentId)) {
        throw new AdminServiceError("VALIDATION_ERROR", "Circular category reference detected");
      }
      visited.add(current.parentId);
      current = await prisma.category.findUnique({
        where: { id: current.parentId },
        select: { parentId: true },
      });
    }
  }

  const updateData: Prisma.CategoryUpdateInput = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.sort !== undefined) updateData.sort = input.sort;
  if (input.parentId !== undefined) {
    updateData.parent = input.parentId ? { connect: { id: input.parentId } } : { disconnect: true };
  }

  await prisma.category.update({ where: { id: categoryId }, data: updateData });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.CATEGORY_UPDATED,
    targetType: "Category",
    targetId: categoryId,
    payload: { name: input.name, parentId: input.parentId, sort: input.sort },
  });
}

/**
 * Delete a category. Skills in it will have categoryId set to null.
 */
export async function deleteCategory(user: AuthUser, categoryId: string) {
  assertCan(user, "manageCategories");

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { skills: true, children: true } } },
  });
  if (!category) {
    throw new AdminServiceError("NOT_FOUND", "Category not found");
  }

  if (category._count.children > 0) {
    throw new AdminServiceError(
      "VALIDATION_ERROR",
      "Cannot delete a category with sub-categories; remove them first",
    );
  }

  // Unlink skills before deleting
  await prisma.$transaction(async (tx) => {
    await tx.skill.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    });
    await tx.category.delete({ where: { id: categoryId } });
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.CATEGORY_DELETED,
    targetType: "Category",
    targetId: categoryId,
    payload: { name: category.name },
  });
}

// ═══════════════════════════════════════
// Audit Logs
// ═══════════════════════════════════════

/**
 * Query audit logs with filtering and pagination.
 */
export async function queryAuditLogs(user: AuthUser, params: AuditLogQueryInput) {
  assertCan(user, "viewAuditLogs");

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (params.from) dateFilter.gte = new Date(params.from);
  if (params.to) dateFilter.lte = new Date(params.to);

  const where: Prisma.AuditLogWhereInput = {};
  if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;
  if (params.actor) where.userId = params.actor;
  if (params.action) where.action = params.action;

  const page = params.page;
  const pageSize = params.pageSize;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Export audit logs as CSV string.
 */
export async function exportAuditLogsCsv(user: AuthUser, params: AuditLogQueryInput) {
  assertCan(user, "viewAuditLogs");

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (params.from) dateFilter.gte = new Date(params.from);
  if (params.to) dateFilter.lte = new Date(params.to);

  const where: Prisma.AuditLogWhereInput = {};
  if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;
  if (params.actor) where.userId = params.actor;
  if (params.action) where.action = params.action;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000, // cap at 10k rows for export
    include: { user: { select: { name: true, email: true } } },
  });

  const header = "id,createdAt,actor,action,targetType,targetId,payload\n";
  const rows = logs
    .map((log) => {
      const actor = log.user ? `${log.user.name} (${log.user.email})` : "system";
      // Escape CSV special chars: wrap in quotes and double any embedded quotes
      const escapeCsv = (s: string) => `"${s.replace(/"/g, '""')}"`;
      // Prevent formula injection: prefix dangerous chars (=, +, -, @) with single quote
      const safeActor = /^[=+@-]/.test(actor) ? `'${actor}` : actor;
      const payload = JSON.stringify(log.payload).replace(/"/g, '""');
      const safePayload = /^[=+@-]/.test(payload) ? `'${payload}` : payload;
      return [
        log.id,
        log.createdAt.toISOString(),
        escapeCsv(safeActor),
        log.action,
        log.targetType,
        log.targetId ?? "",
        escapeCsv(safePayload),
      ].join(",");
    })
    .join("\n");

  return header + rows;
}

// ═══════════════════════════════════════
// Hub Stats / Dashboard
// ═══════════════════════════════════════

/**
 * Hub overview stats for Owner dashboard.
 */
export async function getHubOverview(user: AuthUser) {
  assertCan(user, "manageUsers"); // Owner-only

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalSkills,
    approvedSkills,
    pendingSkills,
    totalUsers,
    totalCalls,
    recentCalls,
    recentCallStatus,
    topSkills,
    topContributors,
    callsByDay,
  ] = await Promise.all([
    prisma.skill.count(),
    prisma.skill.count({ where: { status: "Approved" } }),
    prisma.skill.count({ where: { status: "Pending" } }),
    prisma.user.count(),
    prisma.callLog.count(),
    prisma.callLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.callLog.groupBy({
      by: ["status"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: true,
    }),
    // Top 10 skills by call count
    prisma.skill.findMany({
      where: { status: "Approved" },
      orderBy: { callCount: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        callCount: true,
        ratingAvg: true,
        ratingCount: true,
        owner: { select: { name: true } },
      },
    }),
    // Top 10 active contributors
    prisma.user.findMany({
      where: { role: { in: ["Contributor", "Reviewer", "Owner"] } },
      orderBy: { skills: { _count: "desc" } },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: { select: { skills: true } },
      },
    }),
    // Calls by day (last 7 days)
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "CallLog"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
  ]);

  // Compute success rate for last 7 days
  const successCount = recentCallStatus.find((s) => s.status === "Success")?._count ?? 0;
  const failedCount = recentCallStatus.find((s) => s.status === "Failed")?._count ?? 0;
  const timeoutCount = recentCallStatus.find((s) => s.status === "Timeout")?._count ?? 0;
  const successRate = recentCalls > 0 ? (successCount / recentCalls) * 100 : 0;

  return {
    skills: {
      total: totalSkills,
      approved: approvedSkills,
      pending: pendingSkills,
    },
    users: {
      total: totalUsers,
    },
    calls: {
      total: totalCalls,
      last7Days: recentCalls,
      successRate: Math.round(successRate * 100) / 100,
      breakdown: {
        success: successCount,
        failed: failedCount,
        timeout: timeoutCount,
      },
    },
    topSkills,
    topContributors,
    callsByDay: callsByDay.map((d) => ({
      date: d.date,
      count: Number(d.count),
    })),
  };
}
