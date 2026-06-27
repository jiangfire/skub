"use client";

import { useState } from "react";

interface CategoryRow {
  id: string;
  name: string;
  parentId: string | null;
  sort: number;
  createdAt: string;
  _count: { skills: number };
  children: Array<{ id: string; name: string }>;
}

export default function CategoryManager({
  categories: initialCategories,
}: {
  categories: CategoryRow[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", parentId: "" as string | null, sort: 0 });
  const [error, setError] = useState("");

  const roots = categories.filter((c) => !c.parentId);

  async function handleSubmit() {
    setError("");
    const isEdit = !!editId;
    const url = isEdit ? `/api/admin/categories/${editId}` : "/api/admin/categories";
    const method = isEdit ? "PATCH" : "POST";
    const body = {
      name: form.name,
      parentId: form.parentId || null,
      sort: form.sort,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.message ?? "操作失败");
      return;
    }

    // Refresh: refetch all categories
    const listRes = await fetch("/api/admin/categories");
    if (listRes.ok) {
      const data = await listRes.json();
      setCategories(
        data.categories.map((c: CategoryRow & { createdAt: Date | string }) => ({
          ...c,
          createdAt: typeof c.createdAt === "string" ? c.createdAt : new Date().toISOString(),
        })),
      );
    }
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", parentId: null, sort: 0 });
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此分类？关联技能将变为未分类。")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
    } else {
      const data = await res.json();
      alert(data.message ?? "删除失败");
    }
  }

  function startEdit(cat: CategoryRow) {
    setEditId(cat.id);
    setForm({ name: cat.name, parentId: cat.parentId, sort: cat.sort });
    setShowForm(true);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">共 {categories.length} 个分类</p>
        <button
          onClick={() => {
            setEditId(null);
            setForm({ name: "", parentId: null, sort: 0 });
            setShowForm(!showForm);
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "取消" : "新建分类"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-gray-900">{editId ? "编辑分类" : "新建分类"}</h3>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder="分类名称"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              type="number"
              placeholder="排序"
              value={form.sort}
              onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={form.parentId ?? ""}
              onChange={(e) => setForm({ ...form, parentId: e.target.value || null })}
              className="rounded border border-gray-300 px-3 py-2 text-sm sm:col-span-3"
            >
              <option value="">顶级分类</option>
              {categories
                .filter((c) => c.id !== editId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <button
            onClick={handleSubmit}
            className="mt-3 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {editId ? "保存" : "创建"}
          </button>
        </div>
      )}

      {/* Category Tree */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {roots.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            暂无分类，点击&ldquo;新建分类&rdquo;创建
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {roots.map((cat) => (
              <li key={cat.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {cat._count.skills} 个技能 · 排序 {cat.sort}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(cat)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      删除
                    </button>
                  </div>
                </div>
                {/* Sub-categories */}
                {cat.children.length > 0 && (
                  <ul className="ml-6 mt-2 space-y-1 border-l border-gray-200 pl-4">
                    {cat.children.map((child) => {
                      const childCat = categories.find((c) => c.id === child.id);
                      return (
                        <li key={child.id} className="flex items-center justify-between py-1">
                          <div>
                            <span className="text-sm text-gray-700">{child.name}</span>
                            {childCat && (
                              <span className="ml-2 text-xs text-gray-400">
                                {childCat._count.skills} 个技能
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => childCat && startEdit(childCat)}
                              className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDelete(child.id)}
                              className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                            >
                              删除
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
