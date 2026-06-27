import { NextResponse } from "next/server";
import { revokeApiKey } from "@/server/apikey.service";
import { requireSessionUser } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";

// DELETE /api/account/api-keys/:id — Revoke an API key
export const DELETE = withErrorHandler(async (_request: Request, ctx) => {
  const { id } = await ctx!.params;
  const user = await requireSessionUser();

  await revokeApiKey(user.id, id);
  return NextResponse.json({ ok: true });
});
