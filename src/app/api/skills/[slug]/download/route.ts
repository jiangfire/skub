import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDownloadZip } from "@/lib/skill-package";
import { notFound } from "@/lib/api/errors";
import { recordAudit, AUDIT_ACTIONS } from "@/server/audit.service";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export const GET = async (request: NextRequest, ctx: RouteContext) => {
  const { slug } = await ctx.params;
  const skill = await prisma.skill.findUnique({
    where: { slug, status: "Approved" },
    select: { id: true, name: true },
  });

  if (!skill) return notFound("Skill not found");

  const zipBuffer = await createDownloadZip(skill.id);

  if (!zipBuffer) return notFound("No downloadable content for this skill");

  // Best-effort: bump download counter + audit. Don't fail the download if these error.
  // `increment` is atomic at the DB level; no CallLog/event-table aggregation needed in v1.
  try {
    await prisma.skill.update({
      where: { id: skill.id },
      data: { downloadCount: { increment: 1 } },
    });
    void recordAudit({
      action: AUDIT_ACTIONS.SKILL_DOWNLOADED,
      targetType: "Skill",
      targetId: skill.id,
      payload: { name: skill.name, slug },
    });
  } catch (e) {
    console.error("Failed to record download:", e);
  }

  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");
  const filename = `${safeSlug}.zip`;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
};
