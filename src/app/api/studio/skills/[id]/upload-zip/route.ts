import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/api/session";
import { withErrorHandler } from "@/lib/api/handler";
import { processSkillZip } from "@/lib/skill-package";
import { forbidden, notFound, validationError } from "@/lib/api/errors";
import { recordAudit, AUDIT_ACTIONS } from "@/server/audit.service";

const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50 MB

export const POST = withErrorHandler(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireSessionUser();
    const { id } = await ctx!.params;

    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) return notFound("Skill not found");
    if (skill.ownerId !== user.id && user.role !== "Owner") {
      return forbidden("只能操作自己的技能");
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return validationError("未提供文件");
    }

    if (!file.name.endsWith(".zip")) {
      return validationError("请上传 .zip 格式的文件");
    }

    if (file.size > MAX_ZIP_SIZE) {
      return validationError(`文件大小不能超过 ${MAX_ZIP_SIZE / 1024 / 1024}MB`);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      const { fileCount, zipUrl } = await processSkillZip(skill.id, buffer);

      // Also try to extract skillMd from the ZIP if not already set
      if (!skill.skillMd) {
        const { getSkillFileContent } = await import("@/lib/skill-package");
        const skillMd = await getSkillFileContent(skill.id, "SKILL.md");
        if (skillMd) {
          await prisma.skill.update({
            where: { id: skill.id },
            data: { skillMd },
          });
        }
      }

      void recordAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.SKILL_ZIP_UPLOADED,
        targetType: "Skill",
        targetId: skill.id,
        payload: { fileCount, zipUrl },
      });

      return NextResponse.json({ fileCount, zipUrl });
    } catch (err) {
      console.error("ZIP processing error:", err);
      return NextResponse.json(
        { message: `ZIP 处理失败: ${(err as Error).message}` },
        { status: 500 },
      );
    }
  },
);
