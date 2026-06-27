import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("Password Utilities", () => {
  describe("hashPassword", () => {
    it("returns a hash different from the plaintext", async () => {
      const hash = await hashPassword("mypassword123");
      expect(hash).not.toBe("mypassword123");
      expect(hash.length).toBeGreaterThan(20);
    });

    it("produces different hashes for the same password (salt)", async () => {
      const hash1 = await hashPassword("samepassword");
      const hash2 = await hashPassword("samepassword");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("returns true for correct password", async () => {
      const hash = await hashPassword("correctpass");
      expect(await verifyPassword("correctpass", hash)).toBe(true);
    });

    it("returns false for wrong password", async () => {
      const hash = await hashPassword("correctpass");
      expect(await verifyPassword("wrongpass", hash)).toBe(false);
    });

    it("returns false for empty password", async () => {
      const hash = await hashPassword("correctpass");
      expect(await verifyPassword("", hash)).toBe(false);
    });
  });
});
