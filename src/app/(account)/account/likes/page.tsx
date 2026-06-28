import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/api/session";
import { listUserLikes } from "@/server/community.service";

export default async function LikesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const skills = await listUserLikes(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/account" className="text-sm text-gray-500 hover:text-gray-900">
          个人中心
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-sm font-medium text-gray-900">我点赞的</span>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">我点赞的技能 ({skills.length})</h1>

      {skills.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">暂无点赞的技能</p>
          <Link
            href="/skills"
            className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            去发现技能
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.slug}`}
              className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-pink-300 hover:shadow-sm"
            >
              <p className="text-sm font-medium text-gray-900">{skill.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">{skill.summary}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                <span>{skill.owner.name}</span>
                {skill.category && <span>· {skill.category.name}</span>}
                <span>· ⭐ {skill._count.favorites}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
