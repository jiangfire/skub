import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/api/session";
import { listUsers } from "@/server/admin.service";
import UserManagementTable from "@/components/admin/UserManagementTable";

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "Owner") {
    redirect("/login");
  }

  const { users, total, page, pageSize, totalPages } = await listUsers(user);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">用户与角色管理</h1>
      <UserManagementTable
        users={users.map((u) => ({
          ...u,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
        }))}
        currentUserId={user.id}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
      />
    </div>
  );
}
