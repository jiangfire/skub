import { NextResponse } from "next/server";
import { getHubOverview } from "@/server/admin.service";
import { requirePermission } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";

// GET /api/admin/stats/overview — Hub dashboard stats (Owner only)
export const GET = withErrorHandler(async () => {
  const user = await requirePermission("manageUsers");
  const overview = await getHubOverview(user);
  return NextResponse.json(overview);
});
