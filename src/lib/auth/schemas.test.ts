import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, createSkillSchema } from "./schemas";

describe("Auth Validation Schemas", () => {
  // ── Login Schema ──
  describe("loginSchema", () => {
    it("accepts valid email + password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing fields", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ── Register Schema ──
  describe("registerSchema", () => {
    it("accepts valid email + name + password", () => {
      const result = registerSchema.safeParse({
        email: "new@example.com",
        name: "New User",
        password: "securepass123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects name shorter than 2 chars", () => {
      const result = registerSchema.safeParse({
        email: "new@example.com",
        name: "A",
        password: "securepass123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password shorter than 8 chars", () => {
      const result = registerSchema.safeParse({
        email: "new@example.com",
        name: "Valid Name",
        password: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = registerSchema.safeParse({
        email: "bad",
        name: "Valid Name",
        password: "securepass123",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Skill Validation Schemas", () => {
  describe("createSkillSchema", () => {
    const validInput = {
      slug: "contract-extractor",
      name: "Contract Extractor",
      summary: "Extracts key clauses from contracts",
      tags: ["legal", "nlp"],
      categoryId: "cat-1",
      skillMd: "---\nname: contract-extractor\n---\n# Contract Extractor",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object", properties: {} },
    };

    it("accepts valid skill input", () => {
      const result = createSkillSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("accepts without categoryId (nullable)", () => {
      const result = createSkillSchema.safeParse({ ...validInput, categoryId: undefined });
      expect(result.success).toBe(true);
    });

    it("accepts without tags (defaults to empty)", () => {
      const result = createSkillSchema.safeParse({ ...validInput, tags: undefined });
      expect(result.success).toBe(true);
    });

    it("rejects slug with spaces", () => {
      const result = createSkillSchema.safeParse({ ...validInput, slug: "has spaces" });
      expect(result.success).toBe(false);
    });

    it("rejects slug with uppercase", () => {
      const result = createSkillSchema.safeParse({ ...validInput, slug: "Has-Uppercase" });
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = createSkillSchema.safeParse({ ...validInput, name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects empty skillMd", () => {
      const result = createSkillSchema.safeParse({ ...validInput, skillMd: "" });
      expect(result.success).toBe(false);
    });

    it("rejects non-object inputSchema", () => {
      const result = createSkillSchema.safeParse({
        ...validInput,
        inputSchema: "not-an-object",
      });
      expect(result.success).toBe(false);
    });
  });
});
