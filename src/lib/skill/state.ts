import type { SkillStatus, SkillAction } from "@/types/domain";

// Re-export for convenience (consumers of state.ts get types from one place)
export type { SkillStatus, SkillAction };

// ─── Transition Definition ───
// Single source of truth for all valid state transitions (DRY).
// Adding a new transition = adding one entry here (Open/Closed Principle).
interface TransitionDef {
  from: SkillStatus[];
  to: SkillStatus;
}

const TRANSITIONS: Readonly<Record<SkillAction, TransitionDef>> = Object.freeze({
  submit: { from: ["Draft", "Rejected"], to: "Pending" },
  approve: { from: ["Pending"], to: "Approved" },
  reject: { from: ["Pending"], to: "Rejected" },
  requestChanges: { from: ["Pending"], to: "Draft" },
  edit: { from: ["Rejected"], to: "Draft" },
  selfOffline: { from: ["Approved"], to: "Offline" },
  forceOffline: { from: ["Approved"], to: "Offline" },
  republish: { from: ["Offline"], to: "Pending" },
});

// ─── Public API ───

/**
 * Check whether a transition is valid without performing it.
 */
export function canTransition(from: SkillStatus, action: SkillAction): boolean {
  const def = TRANSITIONS[action];
  return def !== undefined && def.from.includes(from);
}

/**
 * Perform a state transition.
 * @throws Error with "STATE_INVALID" if the transition is not valid.
 */
export function transition(from: SkillStatus, action: SkillAction): SkillStatus {
  if (!canTransition(from, action)) {
    throw new Error(`STATE_INVALID: cannot perform "${action}" from "${from}"`);
  }
  return TRANSITIONS[action].to;
}

/**
 * Get all valid actions from a given state.
 */
export function getValidActions(from: SkillStatus): SkillAction[] {
  return (Object.keys(TRANSITIONS) as SkillAction[]).filter((action) =>
    canTransition(from, action),
  );
}
