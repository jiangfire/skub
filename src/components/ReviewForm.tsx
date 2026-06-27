"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({ skillId }: { skillId: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitDecision(decision: "Approve" | "Reject" | "RequestChanges") {
    if (!comment.trim()) {
      setError("请填写审核意见");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/review/${skillId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "审核失败");
      }

      router.push("/review");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "审核失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">审核决策</h2>

      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</div>}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="填写审核意见..."
        rows={4}
        className="mb-3 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="flex gap-3">
        <button
          onClick={() => submitDecision("Approve")}
          disabled={loading}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          通过
        </button>
        <button
          onClick={() => submitDecision("Reject")}
          disabled={loading}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          驳回
        </button>
        <button
          onClick={() => submitDecision("RequestChanges")}
          disabled={loading}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          打回修改
        </button>
      </div>
    </div>
  );
}
