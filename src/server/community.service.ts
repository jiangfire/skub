import { prisma } from "@/lib/prisma";

// ─── Community Service ───
// Handles user interactions: comments, ratings, favorites, likes.
// Each function validates ownership/visibility where needed.

// ── Comments ──

export async function createComment(
  userId: string,
  skillId: string,
  content: string,
  parentId?: string | null,
) {
  // If parentId provided, validate it belongs to the same skill and is a top-level comment
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.skillId !== skillId) {
      throw new Error("VALIDATION_ERROR: Invalid parent comment");
    }
    if (parent.parentId !== null) {
      throw new Error("VALIDATION_ERROR: Cannot reply to a reply (one-level only)");
    }
  }

  return prisma.comment.create({
    data: { userId, skillId, content, parentId: parentId ?? null },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });
}

export async function listComments(skillId: string, page = 1, pageSize = 50) {
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { skillId, parentId: null },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    }),
    prisma.comment.count({ where: { skillId, parentId: null } }),
  ]);

  return { comments, total, page, pageSize };
}

// ── Ratings ──

export async function upsertRating(userId: string, skillId: string, stars: number) {
  const result = await prisma.$transaction(async (tx) => {
    await tx.rating.upsert({
      where: { skillId_userId: { skillId, userId } },
      create: { userId, skillId, stars },
      update: { stars },
    });

    // Recalculate aggregate
    const agg = await tx.rating.aggregate({
      where: { skillId },
      _avg: { stars: true },
      _count: { stars: true },
    });

    await tx.skill.update({
      where: { id: skillId },
      data: {
        ratingAvg: agg._avg.stars ?? 0,
        ratingCount: agg._count.stars,
      },
    });

    return { stars, ratingAvg: agg._avg.stars ?? 0, ratingCount: agg._count.stars };
  });
  return result;
}

// ── Favorites (toggle, race-safe via upsert) ──

export async function toggleFavorite(userId: string, skillId: string): Promise<boolean> {
  const existing = await prisma.favorite.findUnique({
    where: { userId_skillId: { userId, skillId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return false; // un-favorited
  }

  try {
    await prisma.favorite.create({ data: { userId, skillId } });
    return true; // favorited
  } catch (e: unknown) {
    // P2002 = unique constraint violation (race: another request created it first)
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      await prisma.favorite.delete({
        where: { userId_skillId: { userId, skillId } },
      });
      return false; // treat as toggle-off
    }
    throw e;
  }
}

// ── Likes (toggle, race-safe via upsert) ──

export async function toggleLike(userId: string, skillId: string): Promise<boolean> {
  const existing = await prisma.like.findUnique({
    where: { userId_skillId: { userId, skillId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return false; // un-liked
  }

  try {
    await prisma.like.create({ data: { userId, skillId } });
    return true; // liked
  } catch (e: unknown) {
    // P2002 = unique constraint violation (race: another request created it first)
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      await prisma.like.delete({
        where: { userId_skillId: { userId, skillId } },
      });
      return false; // treat as toggle-off
    }
    throw e;
  }
}
