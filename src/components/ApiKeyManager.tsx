"use client";

import { useState } from "react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | Date | null;
  createdAt: string | Date;
}

export default function ApiKeyManager({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/account/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "创建失败");
      }

      const data = await res.json();
      setNewKey(data.key);
      setName("");
      // Refresh keys list
      const listRes = await fetch("/api/account/api-keys");
      const listData = await listRes.json();
      setKeys(listData.keys ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("确认吊销此 API Key？此操作不可撤销。")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/account/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("吊销失败");
      setKeys(keys.filter((k) => k.id !== id));
    } catch {
      setError("吊销失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">API Keys</h2>

      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</div>}

      {/* New key display (shown once after creation) */}
      {newKey && (
        <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm font-medium text-yellow-800">
            ⚠️ 请立即复制你的 API Key，它不会再次显示：
          </p>
          <code className="mt-1 block break-all rounded bg-yellow-100 p-2 font-mono text-sm">
            {newKey}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(newKey);
              setNewKey(null);
            }}
            className="mt-2 rounded-md bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700"
          >
            已复制，关闭
          </button>
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="mb-4 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key 名称（如：生产环境）"
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          生成
        </button>
      </form>

      {/* Keys list */}
      {keys.length === 0 ? (
        <p className="text-sm text-gray-400">暂无 API Key</p>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-md border border-gray-200 p-2"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{key.name}</p>
                <p className="text-xs text-gray-400">
                  {key.prefix}... · 创建于 {new Date(key.createdAt).toLocaleDateString("zh-CN")}
                  {key.lastUsedAt &&
                    ` · 最后使用 ${new Date(key.lastUsedAt).toLocaleDateString("zh-CN")}`}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(key.id)}
                disabled={loading}
                className="text-xs text-red-600 hover:underline"
              >
                吊销
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
