import { NextResponse } from "next/server";
import type { ApiError } from "@/types/domain";
import { ERROR_CODES } from "@/types/domain";

// ─── Unified API Error Responses ───
// Single source of truth for error response shapes (DRY).

export function unauthorized(message = "Authentication required"): NextResponse<ApiError> {
  return NextResponse.json<ApiError>({ code: ERROR_CODES.UNAUTHORIZED, message }, { status: 401 });
}

export function forbidden(message = "Insufficient permissions"): NextResponse<ApiError> {
  return NextResponse.json<ApiError>({ code: ERROR_CODES.FORBIDDEN, message }, { status: 403 });
}

export function notFound(message = "Resource not found"): NextResponse<ApiError> {
  return NextResponse.json<ApiError>({ code: ERROR_CODES.NOT_FOUND, message }, { status: 404 });
}

export function validationError(
  message = "Validation failed",
  details?: unknown,
): NextResponse<ApiError> {
  return NextResponse.json<ApiError>(
    { code: ERROR_CODES.VALIDATION_ERROR, message, details },
    { status: 422 },
  );
}

export function stateInvalid(message = "Invalid state transition"): NextResponse<ApiError> {
  return NextResponse.json<ApiError>({ code: ERROR_CODES.STATE_INVALID, message }, { status: 409 });
}

export function rateLimited(message = "Rate limit exceeded"): NextResponse<ApiError> {
  return NextResponse.json<ApiError>({ code: ERROR_CODES.RATE_LIMITED, message }, { status: 429 });
}

export function conflict(message: string): NextResponse<ApiError> {
  return NextResponse.json<ApiError>({ code: ERROR_CODES.CONFLICT, message }, { status: 409 });
}

export function internal(message = "Internal server error"): NextResponse<ApiError> {
  return NextResponse.json<ApiError>({ code: ERROR_CODES.INTERNAL, message }, { status: 500 });
}
