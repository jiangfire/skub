import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/api/session";
import { getHubOverview } from "@/server/admin.service";

export default async function AdminHomePage() {
  const user = await getSessionUser();
  if (!user || user.role !== "Owner") {
    redirect("/login");
  }

  const overview = await getHubOverview(user).catch(() => null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">管理后台</h1>

      {/* Quick Stats Cards */}
      {overview && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">技能总数</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{overview.skills.total}</p>
            <p className="mt-1 text-xs text-gray-400">
              上架 {overview.skills.approved} · 待审 {overview.skills.pending}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">用户总数</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{overview.users.total}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">调用总数</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{overview.calls.total}</p>
            <p className="mt-1 text-xs text-gray-400">近7天 {overview.calls.last7Days}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">成功率（7天）</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{overview.calls.successRate}%</p>
            <p className="mt-1 text-xs text-gray-400">
              成功 {overview.calls.breakdown.success} · 失败 {overview.calls.breakdown.failed} ·
              超时 {overview.calls.breakdown.timeout}
            </p>
          </div>
        </div>
      )}

      {/* Management Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <h2 className="font-semibold text-gray-900">数据大盘</h2>
          <p className="mt-1 text-sm text-gray-500">调用趋势、Top 10、活跃贡献者</p>
        </Link>
      </div>
    </div>
  );
}
