import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/api/session";
import { getHubOverview } from "@/server/admin.service";

export default async function AdminStatsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "Owner") {
    redirect("/login");
  }

  const overview = await getHubOverview(user).catch(() => null);

  if (!overview) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-gray-500">统计数据加载失败</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">数据大盘</h1>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">技能总数</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{overview.skills.total}</p>
          <p className="mt-1 text-xs text-gray-400">
            上架 {overview.skills.approved} · 待审 {overview.skills.pending}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">用户总数</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{overview.users.total}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">调用总数</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{overview.calls.total}</p>
          <p className="mt-1 text-xs text-gray-400">近7天 {overview.calls.last7Days}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">成功率（7天）</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{overview.calls.successRate}%</p>
          <p className="mt-1 text-xs text-gray-400">
            成功 {overview.calls.breakdown.success} · 失败 {overview.calls.breakdown.failed} · 超时{" "}
            {overview.calls.breakdown.timeout}
          </p>
        </div>
      </div>

      {/* Calls by Day Chart (simple bar) */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">近 7 天调用趋势</h2>
        {overview.callsByDay.length > 0 ? (
          <div className="flex items-end gap-2" style={{ height: "200px" }}>
            {overview.callsByDay.map((d) => {
              const maxCount = Math.max(...overview.callsByDay.map((x) => x.count), 1);
              const heightPct = (d.count / maxCount) * 100;
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{d.count}</span>
                  <div
                    className="w-full rounded-t bg-blue-500 transition-all"
                    style={{ height: `${heightPct}%`, minHeight: "2px" }}
                  />
                  <span className="text-xs text-gray-400">{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">暂无调用数据</p>
        )}
      </div>

      {/* Top 10 Skills */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Top 10 技能（按调用量）</h2>
        {overview.topSkills.length > 0 ? (
          <ol className="space-y-2">
            {overview.topSkills.map((skill, i) => (
              <li key={skill.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {i + 1}
                  </span>
                  <Link
                    href={`/skills/${skill.slug}`}
                    className="text-sm font-medium text-gray-900 hover:underline"
                  >
                    {skill.name}
                  </Link>
                  <span className="text-xs text-gray-400">by {skill.owner.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {skill.callCount} 次调用
                  {skill.ratingCount > 0 && (
                    <span className="ml-2 text-xs text-gray-400">
                      ★ {skill.ratingAvg.toFixed(1)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-gray-500">暂无数据</p>
        )}
      </div>

      {/* Top Contributors */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">活跃贡献者</h2>
        {overview.topContributors.length > 0 ? (
          <ol className="space-y-2">
            {overview.topContributors.map((contributor, i) => (
              <li key={contributor.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{contributor.name}</span>
                  <span className="text-xs text-gray-400">{contributor.email}</span>
                </div>
                <div className="text-sm text-gray-600">{contributor._count.skills} 个技能</div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-gray-500">暂无数据</p>
        )}
      </div>
    </div>
  );
}
