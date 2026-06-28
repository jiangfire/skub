import { NextRequest, NextResponse } from "next/server";
import { deleteSkill } from "@/server/admin.service";
import { requirePermission } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";
import { rateLimitResponse } from "@/lib/api/rate-limit";

// DELETE /api/admin/skills/:id — Hard-delete a skill (Owner only)
export const DELETE = withErrorHandler(async (_request: NextRequest, ctx) => {
  const { id } = await ctx!.params;
  const user = await requirePermission("deleteSkill");

  const rateLimit = rateLimitResponse(`admin:delete-skill:${user.id}`);
  if (rateLimit) return rateLimit;

  await deleteSkill(user, id);
  return NextResponse.json({ ok: true });
});
