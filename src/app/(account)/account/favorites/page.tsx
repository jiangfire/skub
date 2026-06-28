import { requireActiveUser } from "@/lib/api/session";
import { listUserFavorites } from "@/server/community.service";
import UserSkillsListPage from "@/components/account/UserSkillsListPage";

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireActiveUser();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1"));

  const { skills, total, totalPages } = await listUserFavorites(user.id, page, 20);

  return (
    <UserSkillsListPage
      title="我的收藏"
      skills={skills}
      total={total}
      page={page}
      totalPages={totalPages}
      baseUrl="/account/favorites"
      emptyText="暂无收藏的技能"
      accentColor="amber"
      secondaryMetric="likes"
    />
  );
}
