import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toggleFavorite } from "@/server/community.service";
import { requireSessionUser } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";
import { notFound, stateInvalid, forbidden } from "@/lib/api/errors";

// POST /api/skills/:slug/favorite
export const POST = withErrorHandler(async (_request: NextRequest, ctx) => {
  const { slug } = await ctx!.params;
  const user = await requireSessionUser();
  if (user.status !== "Active") return forbidden("Account is disabled");

  const skill = await prisma.skill.findUnique({ where: { slug } });
  if (!skill) return notFound("Skill not found");
  if (skill.status !== "Approved") return stateInvalid("Skill is not available for favorites");

  const favorited = await toggleFavorite(user.id, skill.id);
  return NextResponse.json({ favorited });
});
