import { requireActiveUser } from "@/lib/api/session";
import { listUserLikes } from "@/server/community.service";
import UserSkillsListPage from "@/components/account/UserSkillsListPage";

export default async function LikesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireActiveUser();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1"));

  const { skills, total, totalPages } = await listUserLikes(user.id, page, 20);

  return (
    <UserSkillsListPage
      title="我点赞的"
      skills={skills}
      total={total}
      page={page}
      totalPages={totalPages}
      baseUrl="/account/likes"
      emptyText="暂无点赞的技能"
      accentColor="pink"
      secondaryMetric="favorites"
    />
  );
}
