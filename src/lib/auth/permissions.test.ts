import { describe, it, expect } from "vitest";
import { can, assertCan, ROLE_PERMISSIONS } from "./permissions";
import type { AuthUser, Role, PermissionAction } from "@/types/domain";

// ── Helpers ──
function makeUser(role: Role, status: "Active" | "Disabled" = "Active"): AuthUser {
  return { id: "u1", name: "test", role, status };
}

const ALL_ROLES: Role[] = ["Visitor", "Contributor", "Reviewer", "Owner"];

describe("Permission System", () => {
  // ── Public actions (all roles) ──
  describe("public actions (all active roles)", () => {
    const publicActions: PermissionAction[] = ["browse", "rate", "comment", "favorite", "like"];

    it.each(publicActions)("allows Visitor to %s", (action) => {
      expect(can(makeUser("Visitor"), action)).toBe(true);
    });

    it.each(ALL_ROLES)("allows %s to browse", (role) => {
      expect(can(makeUser(role), "browse")).toBe(true);
    });

    it.each(ALL_ROLES)("allows %s to rate", (role) => {
      expect(can(makeUser(role), "rate")).toBe(true);
    });
  });

  // ── Contributor+ actions ──
  describe("contributor+ actions", () => {
    const contributorActions: PermissionAction[] = [
      "createSkill",
      "editOwnSkill",
      "submitForReview",
      "selfOffline",
      "republish",
    ];

    it.each(contributorActions)("denies Visitor to %s", (action) => {
      expect(can(makeUser("Visitor"), action)).toBe(false);
    });

    it.each(contributorActions)("allows Contributor to %s", (action) => {
      expect(can(makeUser("Contributor"), action)).toBe(true);
    });

    it.each(contributorActions)("allows Reviewer to %s", (action) => {
      expect(can(makeUser("Reviewer"), action)).toBe(true);
    });

    it.each(contributorActions)("allows Owner to %s", (action) => {
      expect(can(makeUser("Owner"), action)).toBe(true);
    });
  });

  // ── Reviewer+ actions ──
  describe("reviewer+ actions", () => {
    const reviewerActions: PermissionAction[] = ["review"];

    it.each(reviewerActions)("denies Visitor to %s", (action) => {
      expect(can(makeUser("Visitor"), action)).toBe(false);
    });

    it.each(reviewerActions)("denies Contributor to %s", (action) => {
      expect(can(makeUser("Contributor"), action)).toBe(false);
    });

    it.each(reviewerActions)("allows Reviewer to %s", (action) => {
      expect(can(makeUser("Reviewer"), action)).toBe(true);
    });

    it.each(reviewerActions)("allows Owner to %s", (action) => {
      expect(can(makeUser("Owner"), action)).toBe(true);
    });
  });

  // ── Owner-only actions ──
  describe("owner-only actions", () => {
    const ownerActions: PermissionAction[] = [
      "forceOffline",
      "manageUsers",
      "manageCategories",
      "viewAuditLogs",
    ];

    it.each(ownerActions)("denies Visitor to %s", (action) => {
      expect(can(makeUser("Visitor"), action)).toBe(false);
    });

    it.each(ownerActions)("denies Contributor to %s", (action) => {
      expect(can(makeUser("Contributor"), action)).toBe(false);
    });

    it.each(ownerActions)("denies Reviewer to %s", (action) => {
      expect(can(makeUser("Reviewer"), action)).toBe(false);
    });

    it.each(ownerActions)("allows Owner to %s", (action) => {
      expect(can(makeUser("Owner"), action)).toBe(true);
    });
  });

  // ── Disabled users ──
  describe("disabled users", () => {
    it("denies all actions for disabled users regardless of role", () => {
      const disabledOwner = makeUser("Owner", "Disabled");
      expect(can(disabledOwner, "browse")).toBe(false);
      expect(can(disabledOwner, "manageUsers")).toBe(false);
      expect(can(disabledOwner, "forceOffline")).toBe(false);
    });
  });

  // ── assertCan (throws on denial) ──
  describe("assertCan", () => {
    it("does not throw when user has permission", () => {
      expect(() => assertCan(makeUser("Owner"), "manageUsers")).not.toThrow();
    });

    it("throws FORBIDDEN when user lacks permission", () => {
      expect(() => assertCan(makeUser("Visitor"), "createSkill")).toThrowError(/FORBIDDEN/);
    });

    it("throws FORBIDDEN when user is disabled", () => {
      expect(() => assertCan(makeUser("Owner", "Disabled"), "browse")).toThrowError(/FORBIDDEN/);
    });

    it("error includes action and role in message", () => {
      try {
        assertCan(makeUser("Contributor"), "forceOffline");
        expect.fail("should have thrown");
      } catch (e) {
        expect(e instanceof Error).toBe(true);
        expect((e as Error).message).toContain("forceOffline");
        expect((e as Error).message).toContain("Contributor");
      }
    });
  });

  // ── Permission table completeness ──
  describe("ROLE_PERMISSIONS table", () => {
    it("every PermissionAction is defined for every role", () => {
      const allActions: PermissionAction[] = [
        "browse",
        "rate",
        "comment",
        "favorite",
        "like",
        "createSkill",
        "editOwnSkill",
        "submitForReview",
        "selfOffline",
        "republish",
        "review",
        "forceOffline",
        "manageUsers",
        "manageCategories",
        "viewAuditLogs",
      ];

      for (const role of ALL_ROLES) {
        for (const action of allActions) {
          expect(ROLE_PERMISSIONS[role]).toHaveProperty(action);
        }
      }
    });
  });
});
