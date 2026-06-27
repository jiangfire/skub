import { NextResponse } from "next/server";
import { createApiKey, listApiKeys } from "@/server/apikey.service";
import { requireSessionUser } from "@/lib/api/session";
import { createApiKeySchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// GET /api/account/api-keys — List my API keys
export const GET = withErrorHandler(async () => {
  const user = await requireSessionUser();
  const keys = await listApiKeys(user.id);
  return NextResponse.json({ keys });
});

// POST /api/account/api-keys — Create a new API key
export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireSessionUser();

  const body = await request.json().catch(() => null);
  if (!body) return validationError("Invalid JSON body");

  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  const { apiKey, plaintext } = await createApiKey(user.id, parsed.data.name);
  return NextResponse.json({ key: plaintext, id: apiKey.id, name: apiKey.name }, { status: 201 });
});
