import type { SkillStatus } from "@/types/domain";

const STATUS_STYLES: Record<SkillStatus, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  Offline: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<SkillStatus, string> = {
  Draft: "草稿",
  Pending: "待审核",
  Approved: "已上架",
  Rejected: "已驳回",
  Offline: "已下架",
};

export default function StatusBadge({ status }: { status: SkillStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
