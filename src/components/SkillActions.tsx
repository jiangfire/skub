"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SkillStatus } from "@/types/domain";
import { useToast } from "@/components/Toast";

const ACTION_SUCCESS_MESSAGES: Record<string, string> = {
  submit: "已提交审核，请等待审核结果",
  offline: "技能已下架",
  republish: "已提交重新发布审核",
};

export default function SkillActions({
  skillId,
  status,
}: {
  skillId: string;
  status: SkillStatus;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);

  async function performAction(action: string) {
    setLoading(true);
    setActionType(action);
    try {
      const res = await fetch(`/api/studio/skills/${skillId}/${action}`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "操作失败");
      }

      showToast(ACTION_SUCCESS_MESSAGES[action] || "操作成功", "success");
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "操作失败", "error");
    } finally {
      setLoading(false);
      setActionType(null);
    }
  }

  return (
    <div className="mb-6 flex gap-3">
      {(status === "Draft" || status === "Rejected") && (
        <button
          type="button"
          onClick={() => performAction("submit")}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading && actionType === "submit" ? "提交中..." : "提交审核"}
        </button>
      )}
      {status === "Approved" && (
        <button
          type="button"
          onClick={() => {
            if (confirm("确认下架此技能？")) performAction("offline");
          }}
          disabled={loading}
          className="rounded-md border border-orange-300 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50"
        >
          {loading && actionType === "offline" ? "下架中..." : "下架"}
        </button>
      )}
      {status === "Offline" && (
        <button
          type="button"
          onClick={() => performAction("republish")}
          disabled={loading}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading && actionType === "republish" ? "发布中..." : "重新发布"}
        </button>
      )}
    </div>
  );
}
