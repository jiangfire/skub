import Link from "next/link";
import Pagination from "@/components/Pagination";

interface SkillSummary {
  id: string;
  slug: string;
  name: string;
  summary: string;
  owner: { name: string };
  category: { name: string } | null;
  _count: { likes: number; favorites: number };
}

interface UserSkillsListPageProps {
  title: string;
  skills: SkillSummary[];
  total: number;
  page: number;
  totalPages: number;
  baseUrl: string;
  emptyText: string;
  accentColor: "amber" | "pink" | "blue";
  ctaText?: string;
  secondaryMetric?: "likes" | "favorites";
}

const ACCENT_STYLES: Record<UserSkillsListPageProps["accentColor"], string> = {
  amber: "hover:border-amber-300",
  pink: "hover:border-pink-300",
  blue: "hover:border-blue-300",
};

export default function UserSkillsListPage({
  title,
  skills,
  total,
  page,
  totalPages,
  baseUrl,
  emptyText,
  accentColor,
  ctaText = "去发现技能",
  secondaryMetric = "likes",
}: UserSkillsListPageProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/account" className="text-sm text-gray-500 hover:text-gray-900">
          个人中心
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {title} ({total})
      </h1>

      {skills.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">{emptyText}</p>
          <Link
            href="/skills"
            className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {ctaText}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {skills.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.slug}`}
                className={`rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-sm ${ACCENT_STYLES[accentColor]}`}
              >
                <p className="text-sm font-medium text-gray-900">{skill.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{skill.summary}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                  <span>{skill.owner.name}</span>
                  {skill.category && <span>· {skill.category.name}</span>}
                  <span>
                    · {secondaryMetric === "likes" ? "赞" : "收藏"}{" "}
                    {secondaryMetric === "likes" ? skill._count.likes : skill._count.favorites}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
