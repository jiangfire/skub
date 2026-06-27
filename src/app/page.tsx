import Link from "next/link";
import { listSkills } from "@/server/skill.service";
import SkillCard from "@/components/SkillCard";

export default async function HomePage() {
  const [latest, popular] = await Promise.all([
    listSkills({ sort: "latest", page: 1, pageSize: 8 }),
    listSkills({ sort: "popular", page: 1, pageSize: 4 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Skills Hub</h1>
        <p className="mt-2 text-gray-500">内部 AI 技能与数字员工市场</p>
      </div>

      {/* Latest Skills */}
      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">最新上架</h2>
          <Link href="/skills" className="text-sm text-blue-600 hover:underline">
            查看全部 →
          </Link>
        </div>
        {latest.skills.length === 0 ? (
          <p className="text-sm text-gray-400">暂无技能，等待第一个贡献者发布。</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latest.skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </section>

      {/* Popular Skills */}
      {popular.skills.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">热门调用</h2>
            <Link href="/skills?sort=popular" className="text-sm text-blue-600 hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
