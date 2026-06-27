import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAudit, AUDIT_ACTIONS } from "@/server/audit.service";
import type { AuthUser } from "@/types/domain";
import type { DigitalEmployeeInput } from "@/lib/auth/schemas";

// ─── Digital Employee Service ───
// Manages the persona layer on top of a Skill.
// Digital Employee = Skill + persona fields (Spec §3.3).

export class DigitalEmployeeServiceError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Attach a digital employee persona to an existing skill.
 * The skill must belong to the requesting user.
 */
export async function createDigitalEmployee(
  user: AuthUser,
  skillId: string,
  input: DigitalEmployeeInput,
) {
  assertCan(user, "editOwnSkill");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    throw new DigitalEmployeeServiceError("NOT_FOUND", "Skill not found");
  }

  if (skill.ownerId !== user.id) {
    throw new DigitalEmployeeServiceError("FORBIDDEN", "You can only modify your own skills");
  }

  // Check if already has a digital employee
  const existing = await prisma.digitalEmployee.findUnique({ where: { skillId } });
  if (existing) {
    throw new DigitalEmployeeServiceError(
      "CONFLICT",
      "This skill already has a digital employee persona",
    );
  }

  const de = await prisma.digitalEmployee.create({
    data: {
      skillId,
      personaName: input.personaName,
      avatarUrl: input.avatarUrl,
      personaIntro: input.personaIntro,
      welcomeMessage: input.welcomeMessage,
      roleDesc: input.roleDesc,
    },
  });

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.DIGITAL_EMPLOYEE_CREATED,
    targetType: "Skill",
    targetId: skillId,
    payload: { personaName: input.personaName },
  });

  return de;
}

/**
 * Update an existing digital employee persona.
 */
export async function updateDigitalEmployee(
  user: AuthUser,
  skillId: string,
  input: Partial<DigitalEmployeeInput>,
) {
  assertCan(user, "editOwnSkill");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    throw new DigitalEmployeeServiceError("NOT_FOUND", "Skill not found");
  }

  if (skill.ownerId !== user.id) {
    throw new DigitalEmployeeServiceError("FORBIDDEN", "You can only modify your own skills");
  }

  const existing = await prisma.digitalEmployee.findUnique({ where: { skillId } });
  if (!existing) {
    throw new DigitalEmployeeServiceError("NOT_FOUND", "Digital employee not found for this skill");
  }

  const updateData: Record<string, unknown> = {};
  if (input.personaName) updateData.personaName = input.personaName;
  if (input.avatarUrl) updateData.avatarUrl = input.avatarUrl;
  if (input.personaIntro) updateData.personaIntro = input.personaIntro;
  if (input.welcomeMessage) updateData.welcomeMessage = input.welcomeMessage;
  if (input.roleDesc) updateData.roleDesc = input.roleDesc;

  return prisma.digitalEmployee.update({
    where: { skillId },
    data: updateData,
  });
}

/**
 * Remove the digital employee persona from a skill.
 */
export async function deleteDigitalEmployee(user: AuthUser, skillId: string) {
  assertCan(user, "editOwnSkill");

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    throw new DigitalEmployeeServiceError("NOT_FOUND", "Skill not found");
  }

  if (skill.ownerId !== user.id) {
    throw new DigitalEmployeeServiceError("FORBIDDEN", "You can only modify your own skills");
  }

  await prisma.digitalEmployee.delete({ where: { skillId } });
}
