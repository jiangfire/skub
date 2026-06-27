import { NextResponse } from "next/server";
import { republishSkill } from "@/server/skill.service";
import { requireSessionUser } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";

// POST /api/studio/skills/:id/republish — Republish (Offline → Pending)
export const POST = withErrorHandler(async (_request: Request, ctx) => {
  const { id } = await ctx!.params;
  const user = await requireSessionUser();

  await republishSkill(user, id);
  return NextResponse.json({ ok: true });
});
