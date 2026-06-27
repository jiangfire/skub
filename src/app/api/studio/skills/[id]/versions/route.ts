import { NextRequest, NextResponse } from "next/server";
import { createVersion } from "@/server/skill.service";
import { requireSessionUser } from "@/lib/api/session";
import { createVersionSchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// POST /api/studio/skills/:id/versions — Create a new version
export const POST = withErrorHandler(async (request: NextRequest, ctx) => {
  const { id } = await ctx!.params;
  const user = await requireSessionUser();

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = createVersionSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  const version = await createVersion(user, id, parsed.data);
  return NextResponse.json({ version }, { status: 201 });
});
