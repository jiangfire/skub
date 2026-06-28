import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/api/session";
import { can } from "@/lib/auth/permissions";
import { listSkills } from "@/server/admin.service";
import SkillManagementTable from "@/components/admin/SkillManagementTable";
import type { SkillStatus } from "@prisma/client";

export default async function AdminSkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await getSessionUser();
  if (!user || !can(user, "manageSkills")) {
    redirect("/login");
  }

  const { q, status, page } = await searchParams;
  const safeStatus = ["Draft", "Pending", "Approved", "Rejected", "Offline"].includes(status ?? "")
    ? (status as SkillStatus)
    : undefined;

  const {
    skills,
    total,
    page: currentPage,
    totalPages,
  } = await listSkills(user, {
    q,
    status: safeStatus,
    page: page ? Number(page) : 1,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">技能管理</h1>
      <SkillManagementTable
        skills={skills.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
        }))}
        q={q ?? ""}
        status={safeStatus ?? ""}
        total={total}
        page={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
