import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/api/session";
import { queryAuditLogs } from "@/server/admin.service";
import AuditLogViewer from "@/components/admin/AuditLogViewer";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "Owner") {
    redirect("/login");
  }

  const params = await searchParams;
  const query = {
    from: params.from,
    to: params.to,
    action: params.action,
    actor: params.actor,
    page: Number(params.page ?? "1"),
    pageSize: 20,
  };

  const { logs, total, page, pageSize, totalPages } = await queryAuditLogs(user, query);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">审计日志</h1>
      <AuditLogViewer
        logs={logs.map((l) => ({
          id: l.id,
          createdAt: l.createdAt.toISOString(),
          action: l.action,
          targetType: l.targetType,
          targetId: l.targetId,
          payload: (l.payload ?? null) as Record<string, unknown> | null,
          user: l.user ? { name: l.user.name, email: l.user.email } : null,
        }))}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        currentAction={query.action ?? ""}
      />
    </div>
  );
}
