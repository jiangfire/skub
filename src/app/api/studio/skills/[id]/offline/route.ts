import { NextResponse } from "next/server";
import { selfOfflineSkill } from "@/server/skill.service";
import { requireSessionUser } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";

// POST /api/studio/skills/:id/offline — Self-offline (Approved → Offline)
export const POST = withErrorHandler(async (_request: Request, ctx) => {
  const { id } = await ctx!.params;
  const user = await requireSessionUser();

  await selfOfflineSkill(user, id);
  return NextResponse.json({ ok: true });
});
