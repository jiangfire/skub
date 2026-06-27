import { NextResponse } from "next/server";
import type { ApiError } from "@/types/domain";
import { unauthorized, forbidden, notFound, stateInvalid, conflict, internal } from "./errors";
import { SkillServiceError } from "@/server/skill.service";
import { AuthError } from "@/server/auth.service";
import { AdminServiceError } from "@/server/admin.service";
import { DigitalEmployeeServiceError } from "@/server/digital-employee.service";

// ─── Unified Error Handler ───
// Converts service-layer errors to HTTP responses (DRY).
// Each API route wraps its handler with this.

// Pragmatic typing: Next.js route handlers vary in signature,
// actual type safety is provided at each call site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: any, ctx?: any) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      // Auth errors
      if (e instanceof AuthError) {
        if (e.code === "UNAUTHORIZED") return unauthorized(e.message);
        if (e.code === "FORBIDDEN") return forbidden(e.message);
        if (e.code === "CONFLICT") return conflict(e.message);
      }

      // Skill service errors
      if (e instanceof SkillServiceError) {
        const codeMap: Record<string, () => NextResponse<ApiError>> = {
          NOT_FOUND: () => notFound(e.message),
          FORBIDDEN: () => forbidden(e.message),
          CONFLICT: () => conflict(e.message),
          STATE_INVALID: () => stateInvalid(e.message),
        };
        const handler = codeMap[e.code];
        if (handler) return handler();
      }

      // Admin service errors
      if (e instanceof AdminServiceError) {
        const codeMap: Record<string, () => NextResponse<ApiError>> = {
          NOT_FOUND: () => notFound(e.message),
          FORBIDDEN: () => forbidden(e.message),
          CONFLICT: () => conflict(e.message),
          VALIDATION_ERROR: () =>
            NextResponse.json<ApiError>(
              { code: "VALIDATION_ERROR", message: e.message },
              { status: 422 },
            ),
        };
        const handler = codeMap[e.code];
        if (handler) return handler();
      }

      // Digital employee service errors
      if (e instanceof DigitalEmployeeServiceError) {
        const codeMap: Record<string, () => NextResponse<ApiError>> = {
          NOT_FOUND: () => notFound(e.message),
          FORBIDDEN: () => forbidden(e.message),
          CONFLICT: () => conflict(e.message),
        };
        const handler = codeMap[e.code];
        if (handler) return handler();
      }

      // Permission / session errors (thrown as plain Error)
      if (e instanceof Error) {
        if (e.message.startsWith("UNAUTHORIZED")) return unauthorized();
        if (e.message.startsWith("FORBIDDEN")) return forbidden(e.message);
        if (e.message.startsWith("STATE_INVALID")) return stateInvalid(e.message);
        if (e.message.startsWith("VALIDATION_ERROR")) {
          return NextResponse.json<ApiError>(
            { code: "VALIDATION_ERROR", message: e.message },
            { status: 422 },
          );
        }
        if (e.message.startsWith("NOT_FOUND")) return notFound(e.message);
      }

      console.error("Unhandled API error:", e);
      return internal();
    }
  };
}
