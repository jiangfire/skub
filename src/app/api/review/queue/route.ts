import { NextResponse } from "next/server";
import { getReviewQueue } from "@/server/skill.service";
import { requirePermission } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";

// GET /api/review/queue — Pending review queue (Reviewer+)
export const GET = withErrorHandler(async (request: Request) => {
  const user = await requirePermission("review");

  const { searchParams } = new URL(request.url);
  const result = await getReviewQueue(
    user,
    Number(searchParams.get("page")) || 1,
    Number(searchParams.get("pageSize")) || 20,
  );
  return NextResponse.json(result);
});
