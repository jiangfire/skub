import Link from "next/link";
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
      <div className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isDigitalEmployee && skill.digitalEmployee && (
                <span className="text-xs font-medium text-purple-600">数字员工</span>
              )}
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                {skill.digitalEmployee?.personaName ?? skill.name}
              </h3>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{skill.summary}</p>
          </div>
          {isDigitalEmployee && skill.digitalEmployee && (
            <img
              src={skill.digitalEmployee.avatarUrl}
              alt={skill.digitalEmployee.personaName}
              className="ml-3 h-10 w-10 rounded-full"
            />
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
          <span>by {skill.owner.name}</span>
          <span>·</span>
          <span>{skill._count.likes} 赞</span>
          <span>·</span>
          <span>{skill.callCount} 调用</span>
          {skill.ratingCount > 0 && (
            <>
              <span>·</span>
              <span>★ {skill.ratingAvg.toFixed(1)}</span>
            </>
          )}
        </div>

        {skill.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {skill.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
