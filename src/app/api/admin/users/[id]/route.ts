import { NextRequest, NextResponse } from "next/server";
import { updateUser, deleteUser } from "@/server/admin.service";
import { requirePermission } from "@/lib/api/session";
import { updateUserSchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// PATCH /api/admin/users/:id — Update user profile/status (Owner only)
export const PATCH = withErrorHandler(async (request: NextRequest, ctx) => {
  const { id } = await ctx!.params;
  const user = await requirePermission("manageUsers");

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  const updated = await updateUser(user, id, parsed.data);
  return NextResponse.json(updated);
});

// DELETE /api/admin/users/:id — Disable user (Owner only, soft delete)
export const DELETE = withErrorHandler(async (_request: NextRequest, ctx) => {
  const { id } = await ctx!.params;
  const user = await requirePermission("manageUsers");

  await deleteUser(user, id);
  return NextResponse.json({ ok: true });
});
