"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface SkillRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  downloadCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  owner: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  Draft: "草稿",
  Pending: "待审",
  Approved: "已上架",
  Rejected: "已驳回",
  Offline: "已下架",
};

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Offline: "bg-purple-100 text-purple-700",
};

export default function SkillManagementTable({
  skills: initialSkills,
  q,
  status,
  total: initialTotal,
  page,
  totalPages,
}: {
  skills: SkillRow[];
  q: string;
  status: string;
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [skills, setSkills] = useState(initialSkills);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState(q);
  const [statusFilter, setStatusFilter] = useState(status);

  function buildUrl(nextPage: number) {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/admin/skills?${params.toString()}`;
  }

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl(1));
  }

  async function handleDelete(skillId: string, name: string) {
    if (!confirm(`确定要永久删除技能 "${name}" 吗？此操作不可恢复。`)) return;

    const res = await fetch(`/api/admin/skills/${skillId}`, { method: "DELETE" });
    if (res.ok) {
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      setTotal((prev) => Math.max(0, prev - 1));
      showToast("技能已删除", "success");
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.message ?? "删除失败", "error");
    }
  }

  return (
    <div>
      <form onSubmit={applyFilters} className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="搜索技能名称或摘要"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">全部状态</option>
          <option value="Draft">草稿</option>
          <option value="Pending">待审</option>
          <option value="Approved">已上架</option>
          <option value="Rejected">已驳回</option>
          <option value="Offline">已下架</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          筛选
        </button>
      </form>

      <p className="mb-3 text-sm text-gray-500">共 {total} 个技能</p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                技能
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                分类
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                下载
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                评分
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                创建时间
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {skills.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  没有匹配的技能
                </td>
              </tr>
            ) : (
              skills.map((skill) => (
                <tr key={skill.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/skills/${skill.slug}`}
                      className="text-sm font-medium text-gray-900 hover:underline"
                    >
                      {skill.name}
                    </Link>
                    <div className="text-xs text-gray-500">by {skill.owner?.name ?? "未知"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[skill.status]}`}
                    >
                      {STATUS_LABELS[skill.status] ?? skill.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{skill.category?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{skill.downloadCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {skill.ratingCount > 0
                      ? `${skill.ratingAvg.toFixed(1)} (${skill.ratingCount})`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(skill.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/skills/${skill.slug}`}
                        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                      >
                        查看
                      </Link>
                      <button
                        onClick={() => handleDelete(skill.id, skill.name)}
                        aria-label={`删除 ${skill.name}`}
                        className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-500">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => router.push(buildUrl(page - 1))}
            className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 disabled:opacity-40"
          >
            上一页
          </button>
          <span>
            第 {page} / {totalPages} 页
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => router.push(buildUrl(page + 1))}
            className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
