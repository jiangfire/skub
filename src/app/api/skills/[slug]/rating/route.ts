import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertRating } from "@/server/community.service";
import { requireSessionUser } from "@/lib/api/session";
import { createRatingSchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError, notFound, stateInvalid, forbidden } from "@/lib/api/errors";

// POST /api/skills/:slug/rating
export const POST = withErrorHandler(async (request: NextRequest, ctx) => {
  const { slug } = await ctx!.params;
  const user = await requireSessionUser();
  if (user.status !== "Active") return forbidden("Account is disabled");

  const skill = await prisma.skill.findUnique({ where: { slug } });
  if (!skill) return notFound("Skill not found");
  if (skill.status !== "Approved") return stateInvalid("Skill is not available for rating");

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = createRatingSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  const result = await upsertRating(user.id, skill.id, parsed.data.stars);
  return NextResponse.json(result);
});
