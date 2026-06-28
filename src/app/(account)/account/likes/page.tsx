import { requireActiveUser } from "@/lib/api/session";
import { listUserLikes } from "@/server/community.service";
import UserSkillsListPage from "@/components/account/UserSkillsListPage";

export default async function LikesPage() {
  const user = await requireActiveUser();
  const skills = await listUserLikes(user.id);

  return (
    <UserSkillsListPage
      title="我点赞的"
      skills={skills}
      emptyText="暂无点赞的技能"
      accentColor="pink"
      secondaryMetric="favorites"
    />
  );
}
