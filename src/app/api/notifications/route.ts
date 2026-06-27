import { NextRequest, NextResponse } from "next/server";
import { listNotifications, markAllAsRead, getUnreadCount } from "@/server/notification.service";
import { requireSessionUser } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";

// GET /api/notifications — List current user's notifications
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireSessionUser();
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "20");

  const result = await listNotifications(user.id, page, pageSize);
  return NextResponse.json(result);
});

// POST /api/notifications — Mark all as read
export const POST = withErrorHandler(async () => {
  const user = await requireSessionUser();
  await markAllAsRead(user.id);
  const unreadCount = await getUnreadCount(user.id);
  return NextResponse.json({ ok: true, unreadCount });
});
