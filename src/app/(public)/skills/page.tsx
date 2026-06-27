import Link from "next/link";
import { listSkills } from "@/server/skill.service";
import SkillCard from "@/components/SkillCard";

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const sort =
    typeof params.sort === "string" ? (params.sort as "latest" | "popular" | "rating") : "latest";
  const page = typeof params.page === "string" ? Number(params.page) : 1;

  const result = await listSkills({ q, sort, page });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">技能市场</h1>

      {/* Search & Sort */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <form className="min-w-[200px] flex-1">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="搜索技能..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <div className="flex gap-2">
          {(["latest", "popular", "rating"] as const).map((s) => (
            <Link
              key={s}
              href={`/skills?${new URLSearchParams({ ...(q && { q }), sort: s })}`}
              className={`rounded-md px-3 py-2 text-sm ${
                sort === s
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "latest" ? "最新" : s === "popular" ? "最热" : "评分"}
            </Link>
          ))}
        </div>
      </div>

      {/* Results */}
      {result.skills.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          {q ? `未找到匹配"${q}"的技能` : "暂无技能"}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/skills?${new URLSearchParams({ ...(q && { q }), sort, page: String(page - 1) })}`}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  上一页
                </Link>
              )}
              <span className="px-3 py-1.5 text-sm text-gray-500">
                第 {page} / {result.totalPages} 页
              </span>
              {page < result.totalPages && (
                <Link
                  href={`/skills?${new URLSearchParams({ ...(q && { q }), sort, page: String(page + 1) })}`}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  下一页
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
