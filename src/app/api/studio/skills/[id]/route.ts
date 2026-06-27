import { NextRequest, NextResponse } from "next/server";
import { updateSkill } from "@/server/skill.service";
import { requireSessionUser } from "@/lib/api/session";
import { createSkillSchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// PATCH /api/studio/skills/:id — Update skill (Draft/Rejected only)
export const PATCH = withErrorHandler(async (request: NextRequest, ctx) => {
  const { id } = await ctx!.params;
  const user = await requireSessionUser();

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  // Partial validation — allow any subset of fields
  const parsed = createSkillSchema.partial().safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  await updateSkill(user, id, parsed.data);
  return NextResponse.json({ ok: true });
});
