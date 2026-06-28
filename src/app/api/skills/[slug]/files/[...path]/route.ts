import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ slug: string; path: string[] }>;
}

export const GET = async (request: NextRequest, ctx: RouteContext) => {
  const params = await ctx.params;
  const { slug, path: pathParts } = params;

  const skill = await prisma.skill.findUnique({
    where: { slug, status: "Approved" },
    select: { id: true },
  });

  if (!skill) return notFound("Skill not found");

  const filePath = pathParts.join("/");

  const file = await prisma.skillFile.findFirst({
    where: {
      skillId: skill.id,
      path: filePath,
    },
  });

  if (!file) return notFound("File not found");

  const headers = new Headers();
  if (file.mimeType) {
    headers.set("Content-Type", file.mimeType);
  }

  return new NextResponse(file.content, { headers });
};
