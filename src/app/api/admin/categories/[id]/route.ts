import { NextRequest, NextResponse } from "next/server";
import { updateCategory, deleteCategory } from "@/server/admin.service";
import { requirePermission } from "@/lib/api/session";
import { updateCategorySchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// PATCH /api/admin/categories/:id — Update category (Owner only)
export const PATCH = withErrorHandler(async (request: NextRequest, ctx) => {
  const { id } = await ctx!.params;
  const user = await requirePermission("manageCategories");

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  await updateCategory(user, id, parsed.data);
  return NextResponse.json({ ok: true });
});

// DELETE /api/admin/categories/:id — Delete category (Owner only)
export const DELETE = withErrorHandler(async (_request: NextRequest, ctx) => {
  const { id } = await ctx!.params;
  const user = await requirePermission("manageCategories");

  await deleteCategory(user, id);
  return NextResponse.json({ ok: true });
});
