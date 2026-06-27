import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createComment, listComments } from "@/server/community.service";
import { requireSessionUser } from "@/lib/api/session";
import { createCommentSchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError, notFound, stateInvalid, forbidden } from "@/lib/api/errors";

// GET /api/skills/:slug/comments
export const GET = withErrorHandler(async (_request: NextRequest, ctx) => {
  const { slug } = await ctx!.params;
  const skill = await prisma.skill.findUnique({ where: { slug } });
  if (!skill || skill.status !== "Approved") return notFound("Skill not found");

  const result = await listComments(skill.id);
  return NextResponse.json(result);
});

// POST /api/skills/:slug/comments
export const POST = withErrorHandler(async (request: NextRequest, ctx) => {
  const { slug } = await ctx!.params;
  const user = await requireSessionUser();
  if (user.status !== "Active") return forbidden("Account is disabled");

  const skill = await prisma.skill.findUnique({ where: { slug } });
  if (!skill) return notFound("Skill not found");
  if (skill.status !== "Approved") return stateInvalid("Skill is not available for comments");

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  const comment = await createComment(user.id, skill.id, parsed.data.content, parsed.data.parentId);
  return NextResponse.json({ comment }, { status: 201 });
});
