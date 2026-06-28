import Link from "next/link";
import { listSkills } from "@/server/skill.service";
import SkillCard from "@/components/SkillCard";
import Pagination from "@/components/Pagination";

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

  const sortOptions = [
    { value: "latest", label: "最新" },
    { value: "popular", label: "最热" },
    { value: "rating", label: "评分" },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
      {/* --- Page Header --- */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">技能市场</h1>
        <p className="mt-1 text-sm text-neutral-500">
          发现和安装适用于 AI 工具的 Skills 与数字员工
        </p>
      </div>

      {/* --- Search & Sort Bar --- */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <form className="relative flex-1 sm:max-w-md">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="搜索技能..."
            className="input pl-9"
          />
        </form>

        {/* Sort Tabs */}
        <div className="flex shrink-0 rounded-lg bg-neutral-100 p-1">
          {sortOptions.map((opt) => (
            <Link
              key={opt.value}
              href={`/skills?${new URLSearchParams({ ...(q && { q }), sort: opt.value })}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                sort === opt.value
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* --- Results --- */}
      {result.skills.length === 0 ? (
        <EmptyState query={q} />
      ) : (
        <>
          {/* Results Count */}
          <p className="mb-4 text-sm text-neutral-500">
            找到 <span className="font-medium text-neutral-900">{result.total}</span> 个技能
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.skills.map((skill, i) => (
              <div
                key={skill.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <SkillCard skill={skill} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={result.totalPages}
                baseUrl="/skills"
                queryParams={{ ...(q && { q }), sort }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* --- Empty State --- */
function EmptyState({ query }: { query?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center sm:py-24">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-400"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-neutral-900">
        {query ? "未找到匹配的技能" : "暂无技能"}
      </h3>
      <p className="mt-2 max-w-md text-sm text-neutral-500">
        {query ? (
          <>
            没有找到与 <span className="font-medium text-neutral-700">{`"${query}"`}</span>{" "}
            匹配的技能。
            <br />
            试试其他关键词，或浏览全部技能。
          </>
        ) : (
          <>
            还没有人发布技能。
            <br />
            成为第一个贡献者，分享你的 AI Skill！
          </>
        )}
      </p>
      {query ? (
        <Link href="/skills" className="btn-secondary mt-6 text-sm">
          查看全部技能
        </Link>
      ) : (
        <Link href="/studio/new" className="btn-primary mt-6 text-sm">
          发布第一个 Skill
        </Link>
      )}
    </div>
  );
}
