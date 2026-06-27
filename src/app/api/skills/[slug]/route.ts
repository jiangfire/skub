import { NextRequest, NextResponse } from "next/server";
import { getSkillBySlug } from "@/server/skill.service";
import { getSessionUser } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";

export const GET = withErrorHandler(async (request: NextRequest, ctx) => {
  const { slug } = await ctx!.params;
  const user = await getSessionUser();
  const skill = await getSkillBySlug(user, slug);
  return NextResponse.json({ skill });
});
