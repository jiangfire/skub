import Link from "next/link";
import Image from "next/image";
import type { Prisma } from "@prisma/client";

type SkillWithRelations = Prisma.SkillGetPayload<{
  include: {
    owner: { select: { id: true; name: true; avatar: true } };
    digitalEmployee: true;
    _count: { select: { likes: true; favorites: true } };
  };
}>;

export default function SkillCard({ skill }: { skill: SkillWithRelations }) {
  const isDigitalEmployee = !!skill.digitalEmployee;

  return (
    <Link href={`/skills/${skill.slug}`} className="group block">
      <article className="card card-interactive flex h-full flex-col gap-3 p-4 sm:p-5">
        {/* --- Header: Title + Avatar --- */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Digital Employee Badge */}
            {isDigitalEmployee && skill.digitalEmployee && (
              <div className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-purple-200/60">
                <span className="text-sm">🤖</span>
                数字员工
              </div>
            )}

            {/* Title */}
            <h3 className="text-sm font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-brand-600">
              {skill.digitalEmployee?.personaName ?? skill.name}
            </h3>

            {/* Summary */}
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
              {skill.summary}
            </p>
          </div>

          {/* Avatar (Digital Employee) */}
          {isDigitalEmployee && skill.digitalEmployee && (
            <Image
              src={skill.digitalEmployee.avatarUrl}
              alt={skill.digitalEmployee.personaName}
              width={44}
              height={44}
              className="shrink-0 rounded-full ring-2 ring-purple-100 transition-transform duration-200 group-hover:scale-105"
              unoptimized
            />
          )}
        </div>

        {/* --- Tags --- */}
        {skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="ring-neutral-200/60 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 ring-1"
              >
                {tag}
              </span>
            ))}
            {skill.tags.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                +{skill.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* --- Footer: Stats + Owner --- */}
        <div className="mt-auto flex items-center gap-3 text-xs text-neutral-400">
          <span className="truncate font-medium text-neutral-600">{skill.owner.name}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 10v12" />
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76" />
              <path d="M7 2h11" />
            </svg>
            {skill._count.likes}
          </span>
          {skill.ratingCount > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 text-amber-600">
                ★ {skill.ratingAvg.toFixed(1)}
              </span>
            </>
          )}
        </div>
      </article>
    </Link>
  );
}
