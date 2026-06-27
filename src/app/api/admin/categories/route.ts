import { NextRequest, NextResponse } from "next/server";
import { listCategories, createCategory } from "@/server/admin.service";
import { requirePermission } from "@/lib/api/session";
import { createCategorySchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// GET /api/admin/categories — List all categories (Owner only)
export const GET = withErrorHandler(async () => {
  const user = await requirePermission("manageCategories");
  const categories = await listCategories(user);
  return NextResponse.json({ categories });
});

// POST /api/admin/categories — Create category (Owner only)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requirePermission("manageCategories");

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  const category = await createCategory(user, parsed.data);
  return NextResponse.json(category, { status: 201 });
});
