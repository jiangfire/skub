import Link from "next/link";
import { listSkills } from "@/server/skill.service";
import SkillCard from "@/components/SkillCard";

export default async function HomePage() {
  const [latest, popular] = await Promise.all([
    listSkills({ sort: "latest", page: 1, pageSize: 8 }),
    listSkills({ sort: "popular", page: 1, pageSize: 4 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* --- Hero Section --- */}
      <section className="mb-12 text-center sm:mb-16">
        <div className="mx-auto max-w-2xl">
          {/* Logo Icon */}
          <div className="shadow-brand-600/20 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Skills Hub
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-neutral-600">
            内部 AI 技能与数字员工市场
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            发现、安装、分享适用于 OpenCode、Claude、Cursor 等 AI 工具的 Skills
          </p>

          {/* CTAs */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/skills" className="btn-primary">
              浏览技能市场
            </Link>
            <Link href="/studio/new" className="btn-secondary">
              发布 Skill
            </Link>
          </div>
        </div>
      </section>

      {/* --- Latest Skills --- */}
      <section className="mb-12 sm:mb-16">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">最新上架</h2>
            <p className="mt-0.5 text-sm text-neutral-500">最近发布的 AI Skills</p>
          </div>
          <Link href="/skills" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            查看全部 →
          </Link>
        </div>

        {latest.skills.length === 0 ? (
          <EmptyStateSection />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latest.skills.map((skill, i) => (
              <div
                key={skill.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <SkillCard skill={skill} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- Popular Skills --- */}
      {popular.skills.length > 0 && (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">热门调用</h2>
              <p className="mt-0.5 text-sm text-neutral-500">最受欢迎的 AI Skills</p>
            </div>
            <Link
              href="/skills?sort=popular"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.skills.map((skill, i) => (
              <div
                key={skill.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <SkillCard skill={skill} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* --- Empty State for Home Page --- */
function EmptyStateSection() {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center sm:py-16">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-400"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-neutral-900">暂无技能</h3>
      <p className="mt-1 max-w-sm text-xs text-neutral-500">
        还没有人发布技能。成为第一个贡献者，分享你的 AI Skill！
      </p>
      <Link href="/studio/new" className="btn-primary mt-4 text-sm">
        发布第一个 Skill
      </Link>
    </div>
  );
}
