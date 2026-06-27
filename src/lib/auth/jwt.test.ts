import { describe, it, expect, beforeEach } from "vitest";
import { signToken, verifyToken } from "./jwt";

const TEST_SECRET = "test-secret-for-vitest";

describe("JWT Utilities", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.JWT_EXPIRES_IN = "1h";
  });

  describe("signToken", () => {
    it("returns a non-empty string", () => {
      const token = signToken({ userId: "u1", role: "Owner" });
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("produces a token with three dot-separated parts", () => {
      const token = signToken({ userId: "u1", role: "Owner" });
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("verifyToken", () => {
    it("returns the payload for a valid token", () => {
      const token = signToken({ userId: "u1", role: "Owner" });
      const payload = verifyToken(token);
      expect(payload.userId).toBe("u1");
      expect(payload.role).toBe("Owner");
    });

    it("throws for an invalid token string", () => {
      expect(() => verifyToken("not.a.valid.token")).toThrow();
    });

    it("throws for a token signed with a different secret", () => {
      process.env.JWT_SECRET = "different-secret";
      const token = signToken({ userId: "u1", role: "Owner" });
      process.env.JWT_SECRET = TEST_SECRET;
      expect(() => verifyToken(token)).toThrow();
    });

    it("throws for an expired token", () => {
      process.env.JWT_EXPIRES_IN = "0s";
      const token = signToken({ userId: "u1", role: "Owner" });
      // Token expires immediately; give it a tiny delay
      expect(() => verifyToken(token)).toThrow();
    });
  });
});
