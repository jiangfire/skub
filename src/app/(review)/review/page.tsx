import Link from "next/link";
import { requirePermission } from "@/lib/api/session";
import { getReviewQueue } from "@/server/skill.service";

export default async function ReviewQueuePage() {
  const user = await requirePermission("review");
  const result = await getReviewQueue(user);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">审核队列</h1>

      {result.skills.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-400">暂无待审核技能</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">技能名称</th>
                <th className="px-4 py-3 text-left font-medium">贡献者</th>
                <th className="px-4 py-3 text-left font-medium">版本</th>
                <th className="px-4 py-3 text-left font-medium">提交时间</th>
                <th className="px-4 py-3 text-left font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {result.skills.map((skill) => (
                <tr key={skill.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/review/${skill.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {skill.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{skill.owner.name}</td>
                  <td className="px-4 py-3 text-gray-500">{skill.latestVersion?.version ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(skill.updatedAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/review/${skill.id}`} className="text-blue-600 hover:underline">
                      审核 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
