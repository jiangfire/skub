// ─── Cookie Configuration ───
// JWT is stored in an HTTP-only cookie to prevent XSS access.

export const AUTH_COOKIE_NAME = "sh_token";

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days (matches JWT_EXPIRES_IN default)
};
