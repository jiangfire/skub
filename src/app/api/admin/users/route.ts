import { NextRequest, NextResponse } from "next/server";
import { listUsers, inviteUser } from "@/server/admin.service";
import { requirePermission } from "@/lib/api/session";
import { inviteUserSchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// GET /api/admin/users — List all users (Owner only)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requirePermission("manageUsers");
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? "20") || 20),
  );

  const result = await listUsers(user, page, pageSize);
  return NextResponse.json(result);
});

// POST /api/admin/users — Invite a new user (Owner only)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requirePermission("manageUsers");

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = inviteUserSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  const newUser = await inviteUser(user, parsed.data);
  return NextResponse.json(newUser, { status: 201 });
});
