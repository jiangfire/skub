"use client";

import { useState } from "react";

interface AuditLogRow {
  id: string;
  createdAt: string;
  action: string;
  targetType: string;
  targetId: string | null;
  payload: Record<string, unknown> | null;
  user: { name: string; email: string } | null;
}

const ACTION_LABELS: Record<string, string> = {
  USER_REGISTERED: "用户注册",
  USER_INVITED: "用户邀请",
  USER_ROLE_CHANGED: "角色变更",
  USER_DISABLED: "用户停用",
  SKILL_CREATED: "技能创建",
  SKILL_SUBMITTED: "提交审核",
  SKILL_APPROVED: "审核通过",
  SKILL_REJECTED: "审核驳回",
  SKILL_CHANGES_REQUESTED: "打回修改",
  SKILL_SELF_OFFLINE: "自主下架",
  SKILL_FORCE_OFFLINE: "强制下架",
  SKILL_REPUBLISHED: "重新发布",
  CATEGORY_CREATED: "分类创建",
  CATEGORY_UPDATED: "分类更新",
  CATEGORY_DELETED: "分类删除",
  DIGITAL_EMPLOYEE_CREATED: "数字员工创建",
};

export default function AuditLogViewer({
  logs: initialLogs,
  total,
  page,
  pageSize: _pageSize,
  totalPages,
  currentAction,
}: {
  logs: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentAction: string;
}) {
  const [logs] = useState(initialLogs);
  const [action, setAction] = useState(currentAction);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function applyFilter() {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    params.set("page", "1");
    window.location.search = params.toString();
  }

  function exportCsv() {
    const params = new URLSearchParams();
    params.set("format", "csv");
    if (action) params.set("action", action);
    window.open(`/api/admin/audit-logs?${params.toString()}`, "_blank");
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">全部操作</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={applyFilter}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          查询
        </button>
        <button
          onClick={exportCsv}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          导出 CSV
        </button>
        <span className="text-sm text-gray-500">共 {total} 条记录</span>
      </div>

      {/* Log Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                时间
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                操作人
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                操作
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                目标
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                详情
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString("zh-CN")}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {log.user ? `${log.user.name}` : "系统"}
                  {log.user && <div className="text-xs text-gray-400">{log.user.email}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {log.targetType}
                  {log.targetId && (
                    <span className="block text-gray-400">{log.targetId.slice(0, 8)}...</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {log.payload && (
                    <button
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {expandedId === log.id ? "收起" : "查看"}
                    </button>
                  )}
                  {expandedId === log.id && log.payload && (
                    <pre className="mt-1 max-w-xs overflow-x-auto rounded bg-gray-900 p-2 text-xs text-green-400">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("page", String(Math.max(1, page - 1)));
              window.location.search = params.toString();
            }}
            disabled={page <= 1}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
          >
            上一页
          </button>
          <span>
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("page", String(Math.min(totalPages, page + 1)));
              window.location.search = params.toString();
            }}
            disabled={page >= totalPages}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
