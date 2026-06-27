import { NextRequest, NextResponse } from "next/server";
import { markAsRead } from "@/server/notification.service";
import { requireSessionUser } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";

// POST /api/notifications/:id/read — Mark a single notification as read
export const POST = withErrorHandler(async (_request: NextRequest, ctx) => {
  const { id } = await ctx!.params;
  const user = await requireSessionUser();
  await markAsRead(user.id, id);
  return NextResponse.json({ ok: true });
});
