import Link from "next/link";
import { requireSessionUser } from "@/lib/api/session";
import { listApiKeys } from "@/server/apikey.service";
import { prisma } from "@/lib/prisma";
import ApiKeyManager from "@/components/ApiKeyManager";

export default async function AccountPage() {
  const user = await requireSessionUser();

  const [apiKeys, favorites] = await Promise.all([
    listApiKeys(user.id),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        skill: {
          select: {
            id: true,
            slug: true,
            name: true,
            summary: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">个人中心</h1>

      {/* Profile */}
      <div className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">账号信息</h2>
        <dl className="space-y-1 text-sm">
          <div>
            <dt className="inline font-medium text-gray-700">角色：</dt>
            <dd className="inline text-gray-600">{user.role}</dd>
          </div>
        </dl>
      </div>

      {/* API Keys */}
      <ApiKeyManager initialKeys={apiKeys} />

      {/* Favorites */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">我的收藏 ({favorites.length})</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-gray-400">暂无收藏</p>
        ) : (
          <div className="space-y-2">
            {favorites.map((fav) => (
              <Link
                key={fav.id}
                href={`/skills/${fav.skill.slug}`}
                className="block rounded-lg border border-gray-200 p-3 hover:border-blue-300"
              >
                <p className="text-sm font-medium text-gray-900">{fav.skill.name}</p>
                <p className="text-xs text-gray-500">{fav.skill.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
