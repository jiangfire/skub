import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/api/session";
import { listCategories } from "@/server/admin.service";
import CategoryManager from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "Owner") {
    redirect("/login");
  }

  const categories = await listCategories(user);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">分类管理</h1>
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          parentId: c.parentId,
          sort: c.sort,
          createdAt: c.createdAt.toISOString(),
          _count: { skills: c._count.skills },
          children: c.children.map((ch) => ({ id: ch.id, name: ch.name })),
        }))}
      />
    </div>
  );
}
