import { NextRequest, NextResponse } from "next/server";
import { listSkills } from "@/server/skill.service";
import { withErrorHandler } from "@/lib/api/handler";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const result = await listSkills({
    q: searchParams.get("q") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
    sort: (searchParams.get("sort") as "latest" | "popular" | "rating") ?? "latest",
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 20,
  });
  return NextResponse.json(result);
});
