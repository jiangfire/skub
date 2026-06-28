import { requireActiveUser } from "@/lib/api/session";
import { listUserFavorites } from "@/server/community.service";
import UserSkillsListPage from "@/components/account/UserSkillsListPage";

export default async function FavoritesPage() {
  const user = await requireActiveUser();
  const skills = await listUserFavorites(user.id);

  return (
    <UserSkillsListPage
      title="我的收藏"
      skills={skills}
      emptyText="暂无收藏的技能"
      accentColor="amber"
      secondaryMetric="likes"
    />
  );
}
