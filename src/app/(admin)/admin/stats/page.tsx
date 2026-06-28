import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/api/session";
import { can } from "@/lib/auth/permissions";
import { getHubOverview } from "@/server/admin.service";

import StatCard from "@/components/admin/StatCard";

export default async function AdminStatsPage() {
  const user = await getSessionUser();
  if (!user || !can(user, "viewStats")) {
    redirect("/login");
  }

  const overview = await getHubOverview(user).catch((e) => {
    console.error("Failed to load hub overview", e);
    return null;
  });

  if (!overview) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-gray-500">统计数据加载失败</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">平台概览</h1>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="技能总数"
          value={overview.skills.total}
          subtext={`上架 ${overview.skills.approved} · 待审 ${overview.skills.pending}`}
        />
        <StatCard label="用户总数" value={overview.users.total} />
        <StatCard label="总下载次数" value={overview.downloads.total} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top 10 Skills by Rating */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Top 10 技能（按评分）</h2>
          {overview.topSkills.length > 0 ? (
            <ol className="space-y-2">
              {overview.topSkills.map(
                (
                  skill: {
                    id: string;
                    name: string;
                    slug: string;
                    owner: { name: string };
                    ratingCount: number;
                    ratingAvg: number;
                    downloadCount: number;
                  },
                  i: number,
                ) => (
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
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="text-xs text-gray-400">↓ {skill.downloadCount}</span>
                      {skill.ratingCount > 0 && (
                        <span className="text-xs text-gray-400">
                          ★ {skill.ratingAvg.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </li>
                ),
              )}
            </ol>
          ) : (
            <p className="text-sm text-gray-500">暂无数据</p>
          )}
        </div>

        {/* Top 10 Skills by Downloads */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Top 10 技能（按下载量）</h2>
          {overview.topDownloadedSkills.length > 0 ? (
            <ol className="space-y-2">
              {overview.topDownloadedSkills.map(
                (
                  skill: {
                    id: string;
                    name: string;
                    slug: string;
                    owner: { name: string };
                    ratingCount: number;
                    ratingAvg: number;
                    downloadCount: number;
                  },
                  i: number,
                ) => (
                  <li key={skill.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
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
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="text-xs font-medium text-gray-700">
                        ↓ {skill.downloadCount}
                      </span>
                      {skill.ratingCount > 0 && (
                        <span className="text-xs text-gray-400">
                          ★ {skill.ratingAvg.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </li>
                ),
              )}
            </ol>
          ) : (
            <p className="text-sm text-gray-500">暂无数据</p>
          )}
        </div>
      </div>

      {/* Top Contributors */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">活跃贡献者</h2>
        {overview.topContributors.length > 0 ? (
          <ol className="space-y-2">
            {overview.topContributors.map(
              (
                contributor: {
                  id: string;
                  name: string;
                  email: string;
                  _count: { skills: number };
                },
                i: number,
              ) => (
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
              ),
            )}
          </ol>
        ) : (
          <p className="text-sm text-gray-500">暂无数据</p>
        )}
      </div>
    </div>
  );
}
