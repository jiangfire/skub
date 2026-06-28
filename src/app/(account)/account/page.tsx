import Link from "next/link";
import { requireActiveUser } from "@/lib/api/session";
import { listUserFavorites, listUserLikes } from "@/server/community.service";

const ROLE_LABELS: Record<string, string> = {
  Visitor: "访客",
  Contributor: "贡献者",
  Reviewer: "审核员",
  Owner: "超级管理员",
};

export default async function AccountPage() {
  const user = await requireActiveUser();

  const [favorites, likes] = await Promise.all([
    listUserFavorites(user.id, 1, 3),
    listUserLikes(user.id, 1, 3),
  ]);

  const recentFavorites = favorites.skills;
  const recentLikes = likes.skills;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">个人中心</h1>

      {/* Profile */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">账号信息</h2>
        <dl className="space-y-1 text-sm">
          <div>
            <dt className="inline font-medium text-gray-700">姓名：</dt>
            <dd className="inline text-gray-600">{user.name}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-gray-700">角色：</dt>
            <dd className="inline text-gray-600">{ROLE_LABELS[user.role] ?? user.role}</dd>
          </div>
        </dl>
      </div>

      {/* Quick Links */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/account/favorites"
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition hover:border-amber-300 hover:shadow-sm"
        >
          <div>
            <p className="font-medium text-gray-900">我的收藏</p>
            <p className="text-xs text-gray-500">共 {favorites.total} 个技能</p>
          </div>
          <span className="text-amber-500">❯</span>
        </Link>
        <Link
          href="/account/likes"
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition hover:border-pink-300 hover:shadow-sm"
        >
          <div>
            <p className="font-medium text-gray-900">我点赞的</p>
            <p className="text-xs text-gray-500">共 {likes.total} 个技能</p>
          </div>
          <span className="text-pink-500">❯</span>
        </Link>
      </div>

      {/* Recent Favorites */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">最近收藏</h2>
          <Link href="/account/favorites" className="text-xs text-blue-600 hover:underline">
            查看全部
          </Link>
        </div>
        {recentFavorites.length === 0 ? (
          <p className="text-sm text-gray-400">暂无收藏</p>
        ) : (
          <div className="space-y-2">
            {recentFavorites.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.slug}`}
                className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-300"
              >
                <p className="text-sm font-medium text-gray-900">{skill.name}</p>
                <p className="line-clamp-1 text-xs text-gray-500">{skill.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Likes */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">最近点赞</h2>
          <Link href="/account/likes" className="text-xs text-blue-600 hover:underline">
            查看全部
          </Link>
        </div>
        {recentLikes.length === 0 ? (
          <p className="text-sm text-gray-400">暂无点赞</p>
        ) : (
          <div className="space-y-2">
            {recentLikes.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.slug}`}
                className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-pink-300"
              >
                <p className="text-sm font-medium text-gray-900">{skill.name}</p>
                <p className="line-clamp-1 text-xs text-gray-500">{skill.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
