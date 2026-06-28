import Link from "next/link";
import { requireSessionUser } from "@/lib/api/session";
import { getMySkills } from "@/server/skill.service";
import StatusBadge from "@/components/StatusBadge";

export default async function StudioPage() {
  const user = await requireSessionUser();
  const result = await getMySkills(user);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">我的工作台</h1>
        <Link
          href="/studio/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 发布技能
        </Link>
      </div>

      {result.skills.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-400">还没有发布任何技能</p>
          <Link
            href="/studio/new"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            创建第一个技能 →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">名称</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">更新时间</th>
                <th className="px-4 py-3 text-left font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {result.skills.map((skill) => (
                <tr key={skill.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/studio/${skill.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {skill.digitalEmployee?.personaName ?? skill.name}
                    </Link>
                    {skill.digitalEmployee && (
                      <span className="ml-2 text-xs text-purple-600">数字员工</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={skill.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(skill.updatedAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    {(skill.status === "Draft" || skill.status === "Rejected") && (
                      <form
                        action={`/api/studio/skills/${skill.id}/submit`}
                        method="POST"
                        className="inline"
                      >
                        <button type="submit" className="text-xs text-blue-600 hover:underline">
                          提交审核
                        </button>
                      </form>
                    )}
                    {skill.status === "Approved" && (
                      <form
                        action={`/api/studio/skills/${skill.id}/offline`}
                        method="POST"
                        className="inline"
                      >
                        <button type="submit" className="text-xs text-orange-600 hover:underline">
                          下架
                        </button>
                      </form>
                    )}
                    {skill.status === "Offline" && (
                      <form
                        action={`/api/studio/skills/${skill.id}/republish`}
                        method="POST"
                        className="inline"
                      >
                        <button type="submit" className="text-xs text-green-600 hover:underline">
                          重新发布
                        </button>
                      </form>
                    )}
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
