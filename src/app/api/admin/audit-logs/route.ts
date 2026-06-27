import { NextRequest, NextResponse } from "next/server";
import { queryAuditLogs, exportAuditLogsCsv } from "@/server/admin.service";
import { requirePermission } from "@/lib/api/session";
import { auditLogQuerySchema } from "@/lib/auth/schemas";
import { withErrorHandler } from "@/lib/api/handler";
import { validationError } from "@/lib/api/errors";

// GET /api/admin/audit-logs — Query audit logs (Owner only)
// Supports ?format=csv for CSV export
export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requirePermission("viewAuditLogs");

  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());

  const parsed = auditLogQuerySchema.safeParse(params);
  if (!parsed.success) {
    return validationError("Validation failed", parsed.error.flatten());
  }

  // CSV export
  if (parsed.data.format === "csv") {
    const csv = await exportAuditLogsCsv(user, parsed.data);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const result = await queryAuditLogs(user, parsed.data);
  return NextResponse.json(result);
});
