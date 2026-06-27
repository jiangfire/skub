import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth/schemas";
import { loginUser, AuthError } from "@/server/auth.service";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/auth/cookies";
import { validationError, unauthorized, forbidden, internal } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return validationError("Invalid JSON body");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  try {
    const { user, token } = await loginUser(parsed.data);

    const response = NextResponse.json({
      user: { id: user.id, role: user.role, status: user.status },
    });
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return response;
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.code === "UNAUTHORIZED") return unauthorized(e.message);
      if (e.code === "FORBIDDEN") return forbidden(e.message);
    }
    console.error("Login error:", e);
    return internal();
  }
}
