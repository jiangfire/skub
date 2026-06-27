import { prisma } from "@/lib/prisma";

// ─── Stats Service ───
// Aggregates CallLog data for skill detail pages and dashboards.
// Follows DRY: all stat computations go through this single service.

export interface SkillStats {
  totalCalls: number;
  last7DaysCalls: number;
  successRate: number;
  avgLatencyMs: number;
  recentCalls: Array<{
    id: string;
    status: string;
    latencyMs: number;
    createdAt: Date;
    error: string | null;
  }>;
}

/**
 * Get aggregated stats for a single skill.
 */
export async function getSkillStats(skillId: string): Promise<SkillStats> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalCalls, last7DaysCalls, statusAgg, latencyAgg, recentCalls] = await Promise.all([
    prisma.callLog.count({ where: { skillId } }),
    prisma.callLog.count({
      where: { skillId, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.callLog.groupBy({
      by: ["status"],
      where: { skillId, createdAt: { gte: sevenDaysAgo } },
      _count: true,
    }),
    prisma.callLog.aggregate({
      where: { skillId, createdAt: { gte: sevenDaysAgo } },
      _avg: { latencyMs: true },
    }),
    prisma.callLog.findMany({
      where: { skillId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        latencyMs: true,
        createdAt: true,
        error: true,
      },
    }),
  ]);

  const successCount = statusAgg.find((s) => s.status === "Success")?._count ?? 0;
  const recentTotal = statusAgg.reduce((sum, s) => sum + s._count, 0);
  const successRate = recentTotal > 0 ? (successCount / recentTotal) * 100 : 0;

  return {
    totalCalls,
    last7DaysCalls,
    successRate: Math.round(successRate * 100) / 100,
    avgLatencyMs: latencyAgg._avg.latencyMs ? Math.round(latencyAgg._avg.latencyMs) : 0,
    recentCalls,
  };
}

/**
 * Get contributor stats: published skills, total calls across their skills.
 */
export async function getContributorStats(userId: string) {
  const [publishedCount, totalCalls, skillBreakdown] = await Promise.all([
    prisma.skill.count({
      where: { ownerId: userId, status: "Approved" },
    }),
    prisma.callLog.count({
      where: { skill: { ownerId: userId } },
    }),
    prisma.skill.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        callCount: true,
        ratingAvg: true,
        ratingCount: true,
      },
      orderBy: { callCount: "desc" },
    }),
  ]);

  return {
    publishedCount,
    totalCalls,
    skills: skillBreakdown,
  };
}
