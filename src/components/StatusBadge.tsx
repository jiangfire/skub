import type { SkillStatus } from "@/types/domain";

const STATUS_CONFIG: Record<SkillStatus, { label: string; className: string }> = {
  Draft: {
    label: "草稿",
    className: "badge-neutral",
  },
  Pending: {
    label: "待审核",
    className: "badge-warning",
  },
  Approved: {
    label: "已上架",
    className: "badge-success",
  },
  Rejected: {
    label: "已驳回",
    className: "badge-error",
  },
  Offline: {
    label: "已下架",
    className: "badge-neutral",
  },
};

export default function StatusBadge({ status }: { status: SkillStatus }) {
  const config = STATUS_CONFIG[status];
  return <span className={`badge ${config.className}`}>{config.label}</span>;
}
