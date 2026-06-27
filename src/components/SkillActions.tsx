"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SkillStatus } from "@/types/domain";

export default function SkillActions({
  skillId,
  status,
}: {
  skillId: string;
  status: SkillStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function performAction(action: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/skills/${skillId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "操作失败");
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 flex gap-3">
      {(status === "Draft" || status === "Rejected") && (
        <button
          onClick={() => performAction("submit")}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          提交审核
        </button>
      )}
      {status === "Approved" && (
        <button
          onClick={() => {
            if (confirm("确认下架此技能？")) performAction("offline");
          }}
          disabled={loading}
          className="rounded-md border border-orange-300 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50"
        >
          下架
        </button>
      )}
      {status === "Offline" && (
        <button
          onClick={() => performAction("republish")}
          disabled={loading}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          重新发布
        </button>
      )}
    </div>
  );
}
