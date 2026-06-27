import { NextRequest, NextResponse } from "next/server";
import { forceOfflineSkill } from "@/server/skill.service";
import { requirePermission } from "@/lib/api/session";
import { forceOfflineSchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// POST /api/admin/skills/:id/force-offline — Force offline (Owner only)
export const POST = withErrorHandler(async (request: NextRequest, ctx) => {
  const { id } = await ctx!.params;
  const user = await requirePermission("forceOffline");

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = forceOfflineSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  await forceOfflineSkill(user, id, parsed.data.reason);
  return NextResponse.json({ ok: true });
});
