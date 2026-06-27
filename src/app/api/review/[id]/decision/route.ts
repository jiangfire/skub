import { NextRequest, NextResponse } from "next/server";
import { approveSkill, rejectSkill, requestChanges } from "@/server/skill.service";
import { requirePermission } from "@/lib/api/session";
import { reviewDecisionSchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// POST /api/review/:id/decision — Submit review decision
export const POST = withErrorHandler(async (request: NextRequest, ctx) => {
  const { id } = await ctx!.params;
  const user = await requirePermission("review");

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = reviewDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  const { decision, comment } = parsed.data;

  switch (decision) {
    case "Approve":
      await approveSkill(user, id, comment);
      break;
    case "Reject":
      await rejectSkill(user, id, comment);
      break;
    case "RequestChanges":
      await requestChanges(user, id, comment);
      break;
  }

  return NextResponse.json({ ok: true });
});
