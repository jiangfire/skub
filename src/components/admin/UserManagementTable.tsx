"use client";

import { useState } from "react";

interface UserRow {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { skills: number };
}

const ROLE_LABELS: Record<string, string> = {
  Visitor: "普通用户",
  Contributor: "贡献者",
  Reviewer: "审核员",
  Owner: "超级管理员",
};

const ROLE_COLORS: Record<string, string> = {
  Visitor: "bg-gray-100 text-gray-700",
  Contributor: "bg-blue-100 text-blue-700",
  Reviewer: "bg-purple-100 text-purple-700",
  Owner: "bg-red-100 text-red-700",
};

export default function UserManagementTable({
  users: initialUsers,
  currentUserId,
  total,
  page,
  pageSize: _pageSize,
  totalPages,
}: {
  users: UserRow[];
  currentUserId: string;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "Visitor",
  });
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  async function handleInvite() {
    setInviteError("");
    setInviteLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "邀请失败");
      }
      const newUser = await res.json();
      setUsers((prev) => [
        {
          ...newUser,
          avatar: null,
          lastLoginAt: null,
          createdAt: new Date().toISOString(),
          _count: { skills: 0 },
        },
        ...prev,
      ]);
      setShowInvite(false);
      setInviteForm({ email: "", name: "", password: "", role: "Visitor" });
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "邀请失败");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } else {
      const data = await res.json();
      alert(data.message ?? "角色分配失败");
    }
  }

  async function handleToggleStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === "Active" ? "Disabled" : "Active";
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
    } else {
      const data = await res.json();
      alert(data.message ?? "状态更新失败");
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("确定要停用此用户吗？该操作不可逆。")) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: "Disabled" } : u)));
    } else {
      const data = await res.json();
      alert(data.message ?? "停用失败");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">共 {total} 个用户</p>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showInvite ? "取消" : "邀请新用户"}
        </button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-gray-900">邀请新用户</h3>
          {inviteError && <p className="mb-2 text-sm text-red-600">{inviteError}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="email"
              placeholder="邮箱"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="姓名"
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="初始密码（至少8位）"
              value={inviteForm.password}
              onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="Visitor">普通用户</option>
              <option value="Contributor">贡献者</option>
              <option value="Reviewer">审核员</option>
              <option value="Owner">超级管理员</option>
            </select>
          </div>
          <button
            onClick={handleInvite}
            disabled={inviteLoading}
            className="mt-3 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {inviteLoading ? "创建中..." : "创建用户"}
          </button>
        </div>
      )}

      {/* User Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                用户
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                角色
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                技能数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                最近登录
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role]}`}
                  >
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs ${u.status === "Active" ? "text-green-600" : "text-red-600"}`}
                  >
                    {u.status === "Active" ? "正常" : "已停用"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{u._count.skills}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("zh-CN") : "未登录"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === currentUserId}
                      className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-50"
                    >
                      <option value="Visitor">普通用户</option>
                      <option value="Contributor">贡献者</option>
                      <option value="Reviewer">审核员</option>
                      <option value="Owner">超管</option>
                    </select>
                    <button
                      onClick={() => handleToggleStatus(u.id, u.status)}
                      disabled={u.id === currentUserId}
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {u.status === "Active" ? "停用" : "启用"}
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={u.id === currentUserId}
                      className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
          第 {page} / {totalPages} 页
        </div>
      )}
    </div>
  );
}
