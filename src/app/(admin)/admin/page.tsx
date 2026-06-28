import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/api/session";
import { can } from "@/lib/auth/permissions";
import { getHubOverview } from "@/server/admin.service";

import StatCard from "@/components/admin/StatCard";

export default async function AdminHomePage() {
  const user = await getSessionUser();
  if (!user || !can(user, "viewStats")) {
    redirect("/login");
  }

  const overview = await getHubOverview(user).catch((e) => {
    console.error("Failed to load hub overview", e);
    return null;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">管理后台</h1>

      {/* Quick Stats Cards */}
      {overview && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="技能总数"
            value={overview.skills.total}
            subtext={`上架 ${overview.skills.approved} · 待审 ${overview.skills.pending}`}
          />
          <StatCard label="用户总数" value={overview.users.total} />
          <StatCard label="总下载次数" value={overview.downloads.total} />
        </div>
      )}

      {/* Management Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link
          href="/admin/skills"
          className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-sm"
        >
          <h2 className="font-semibold text-gray-900">技能管理</h2>
          <p className="mt-1 text-sm text-gray-500">查看、搜索、删除 Skill</p>
        </Link>
        <Link
          href="/admin/users"
          className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-sm"
        >
          <h2 className="font-semibold text-gray-900">用户与角色管理</h2>
          <p className="mt-1 text-sm text-gray-500">邀请用户、分配角色、停用账号</p>
        </Link>
        <Link
          href="/admin/categories"
          className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-sm"
        >
          <h2 className="font-semibold text-gray-900">分类管理</h2>
          <p className="mt-1 text-sm text-gray-500">树形分类增删改</p>
        </Link>
        <Link
          href="/admin/audit-logs"
          className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-sm"
        >
          <h2 className="font-semibold text-gray-900">审计日志</h2>
          <p className="mt-1 text-sm text-gray-500">关键操作留痕、可检索、可导出</p>
        </Link>
        <Link
          href="/admin/stats"
          className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-sm"
        >
          <h2 className="font-semibold text-gray-900">平台概览</h2>
          <p className="mt-1 text-sm text-gray-500">Top 10 技能、活跃贡献者</p>
        </Link>
      </div>
    </div>
  );
}
