import { NextResponse } from "next/server";
import { createSkill, getMySkills } from "@/server/skill.service";
import { requireSessionUser } from "@/lib/api/session";
import { createSkillSchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// POST /api/studio/skills — Create a new skill (Draft)
export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireSessionUser();

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = createSkillSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  const skill = await createSkill(user, parsed.data);
  return NextResponse.json({ skill }, { status: 201 });
});

// GET /api/studio/skills — List my skills
export const GET = withErrorHandler(async (request: Request) => {
  const user = await requireSessionUser();

  const { searchParams } = new URL(request.url);
  const result = await getMySkills(
    user,
    Number(searchParams.get("page")) || 1,
    Number(searchParams.get("pageSize")) || 20,
  );
  return NextResponse.json(result);
});
