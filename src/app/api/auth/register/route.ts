import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/auth/schemas";
import { registerUser, AuthError } from "@/server/auth.service";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/auth/cookies";
import { validationError, conflict, internal } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return validationError("Invalid JSON body");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  try {
    const { user, token } = await registerUser(parsed.data);

    const response = NextResponse.json({
      user: { id: user.id, role: user.role, status: user.status },
    });
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return response;
  } catch (e) {
    if (e instanceof AuthError && e.code === "CONFLICT") {
      return conflict(e.message);
    }
    console.error("Register error:", e);
    return internal();
  }
}
