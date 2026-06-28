import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api/errors";
import { buildFileTree } from "@/lib/file-tree";

interface RouteContext {
  params: Promise<Record<string, string>>;
}

export const GET = async (request: NextRequest, ctx: RouteContext) => {
  const { slug } = await ctx.params;
  const skill = await prisma.skill.findUnique({
    where: { slug, status: "Approved" },
    select: { id: true },
  });

  if (!skill) return notFound("Skill not found");

  const files = await prisma.skillFile.findMany({
    where: { skillId: skill.id },
    orderBy: { path: "asc" },
    select: { path: true, mimeType: true, size: true },
  });

  const tree = buildFileTree(files);

  return NextResponse.json({ files, tree });
};
