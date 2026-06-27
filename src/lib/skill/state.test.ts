import { describe, it, expect } from "vitest";
import {
  canTransition,
  transition,
  getValidActions,
  type SkillStatus,
  type SkillAction,
} from "./state";

describe("Skill State Machine", () => {
  // ── Valid Transitions ──
  describe("valid transitions", () => {
    it("Draft → Pending via submit", () => {
      expect(transition("Draft", "submit")).toBe("Pending");
    });

    it("Pending → Approved via approve", () => {
      expect(transition("Pending", "approve")).toBe("Approved");
    });

    it("Pending → Rejected via reject", () => {
      expect(transition("Pending", "reject")).toBe("Rejected");
    });

    it("Pending → Draft via requestChanges", () => {
      expect(transition("Pending", "requestChanges")).toBe("Draft");
    });

    it("Rejected → Draft via edit", () => {
      expect(transition("Rejected", "edit")).toBe("Draft");
    });

    it("Rejected → Pending via submit (direct resubmit)", () => {
      expect(transition("Rejected", "submit")).toBe("Pending");
    });

    it("Approved → Offline via selfOffline", () => {
      expect(transition("Approved", "selfOffline")).toBe("Offline");
    });

    it("Approved → Offline via forceOffline", () => {
      expect(transition("Approved", "forceOffline")).toBe("Offline");
    });

    it("Offline → Pending via republish", () => {
      expect(transition("Offline", "republish")).toBe("Pending");
    });
  });

  // ── Invalid Transitions ──
  describe("invalid transitions throw STATE_INVALID", () => {
    const invalidCases: Array<[SkillStatus, SkillAction]> = [
      // Can't submit from non-Draft/Rejected states
      ["Pending", "submit"],
      ["Approved", "submit"],
      ["Offline", "submit"],
      // Can't approve from non-Pending states
      ["Draft", "approve"],
      ["Approved", "approve"],
      ["Rejected", "approve"],
      ["Offline", "approve"],
      // Can't reject from non-Pending states
      ["Draft", "reject"],
      ["Approved", "reject"],
      ["Rejected", "reject"],
      ["Offline", "reject"],
      // Can't requestChanges from non-Pending states
      ["Draft", "requestChanges"],
      ["Approved", "requestChanges"],
      ["Rejected", "requestChanges"],
      ["Offline", "requestChanges"],
      // Can't edit from non-Rejected states
      ["Draft", "edit"],
      ["Pending", "edit"],
      ["Approved", "edit"],
      ["Offline", "edit"],
      // Can't selfOffline from non-Approved states
      ["Draft", "selfOffline"],
      ["Pending", "selfOffline"],
      ["Rejected", "selfOffline"],
      ["Offline", "selfOffline"],
      // Can't forceOffline from non-Approved states
      ["Draft", "forceOffline"],
      ["Pending", "forceOffline"],
      ["Rejected", "forceOffline"],
      ["Offline", "forceOffline"],
      // Can't republish from non-Offline states
      ["Draft", "republish"],
      ["Pending", "republish"],
      ["Approved", "republish"],
      ["Rejected", "republish"],
    ];

    it.each(invalidCases)("rejects %s + %s", (from, action) => {
      expect(() => transition(from, action)).toThrowError(/STATE_INVALID/);
    });
  });

  // ── Rejected supports both edit and direct resubmit ──
  describe("Rejected transitions", () => {
    it("can submit directly from Rejected (resubmit after rejection)", () => {
      expect(transition("Rejected", "submit")).toBe("Pending");
    });

    it("can edit to go back to Draft first, then submit", () => {
      const draft = transition("Rejected", "edit");
      expect(draft).toBe("Draft");
      const pending = transition(draft, "submit");
      expect(pending).toBe("Pending");
    });
  });

  // ── canTransition (boolean check) ──
  describe("canTransition", () => {
    it("returns true for valid transitions", () => {
      expect(canTransition("Draft", "submit")).toBe(true);
      expect(canTransition("Pending", "approve")).toBe(true);
      expect(canTransition("Approved", "selfOffline")).toBe(true);
      expect(canTransition("Offline", "republish")).toBe(true);
    });

    it("returns false for invalid transitions", () => {
      expect(canTransition("Draft", "approve")).toBe(false);
      expect(canTransition("Approved", "submit")).toBe(false);
      expect(canTransition("Rejected", "approve")).toBe(false);
    });
  });

  // ── getValidActions ──
  describe("getValidActions", () => {
    it("returns submit for Draft", () => {
      expect(getValidActions("Draft")).toEqual(["submit"]);
    });

    it("returns approve, reject, requestChanges for Pending", () => {
      expect(getValidActions("Pending").sort()).toEqual(["approve", "reject", "requestChanges"]);
    });

    it("returns edit and submit for Rejected", () => {
      expect(getValidActions("Rejected").sort()).toEqual(["edit", "submit"]);
    });

    it("returns selfOffline and forceOffline for Approved", () => {
      expect(getValidActions("Approved").sort()).toEqual(["forceOffline", "selfOffline"]);
    });

    it("returns republish for Offline", () => {
      expect(getValidActions("Offline")).toEqual(["republish"]);
    });
  });

  // ── Full lifecycle ──
  describe("full lifecycle", () => {
    it("Draft → Pending → Approved → Offline → Pending (republish)", () => {
      let status: SkillStatus = "Draft";
      status = transition(status, "submit");
      expect(status).toBe("Pending");
      status = transition(status, "approve");
      expect(status).toBe("Approved");
      status = transition(status, "selfOffline");
      expect(status).toBe("Offline");
      status = transition(status, "republish");
      expect(status).toBe("Pending");
    });

    it("Draft → Pending → Rejected → Draft → Pending → Approved", () => {
      let status: SkillStatus = "Draft";
      status = transition(status, "submit");
      status = transition(status, "reject");
      expect(status).toBe("Rejected");
      status = transition(status, "edit");
      expect(status).toBe("Draft");
      status = transition(status, "submit");
      expect(status).toBe("Pending");
      status = transition(status, "approve");
      expect(status).toBe("Approved");
    });

    it("Draft → Pending → Rejected → Pending (direct resubmit) → Approved", () => {
      let status: SkillStatus = "Draft";
      status = transition(status, "submit");
      status = transition(status, "reject");
      expect(status).toBe("Rejected");
      status = transition(status, "submit");
      expect(status).toBe("Pending");
      status = transition(status, "approve");
      expect(status).toBe("Approved");
    });

    it("Draft → Pending → Draft (requestChanges) → Pending → Approved", () => {
      let status: SkillStatus = "Draft";
      status = transition(status, "submit");
      status = transition(status, "requestChanges");
      expect(status).toBe("Draft");
      status = transition(status, "submit");
      status = transition(status, "approve");
      expect(status).toBe("Approved");
    });
  });
});
