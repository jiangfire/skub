import { NextRequest, NextResponse } from "next/server";
import { assignRole } from "@/server/admin.service";
import { requirePermission } from "@/lib/api/session";
import { assignRoleSchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// POST /api/admin/users/:id/role — Assign role (Owner only)
export const POST = withErrorHandler(async (request: NextRequest, ctx) => {
  const { id } = await ctx!.params;
  const user = await requirePermission("manageUsers");

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = assignRoleSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  await assignRole(user, id, parsed.data);
  return NextResponse.json({ ok: true });
});
