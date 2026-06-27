import Link from "next/link";
import { notFound } from "next/navigation";
import { getSkillBySlug } from "@/server/skill.service";
import { getSessionUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";
import { getSkillStats } from "@/server/stats.service";
import StatusBadge from "@/components/StatusBadge";
import CommentSection from "@/components/CommentSection";
import TryRunConsole from "@/components/TryRunConsole";
import ApiDocPanel from "@/components/ApiDocPanel";

export default async function SkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();

  let skill;
  try {
    skill = await getSkillBySlug(user, slug);
  } catch {
    notFound();
  }

  // Fetch comments and stats in parallel
  const [comments, stats] = await Promise.all([
    prisma.comment.findMany({
      where: { skillId: skill.id, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    }),
    getSkillStats(skill.id),
  ]);

  const isDigitalEmployee = !!skill.digitalEmployee;
  const invokeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/v1/skills/${skill.slug}/invoke`;
  const inputSchema = (skill.inputSchema ?? {}) as Record<string, unknown>;
  const outputSchema = (skill.outputSchema ?? {}) as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          {isDigitalEmployee && skill.digitalEmployee && (
            <img
              src={skill.digitalEmployee.avatarUrl}
              alt={skill.digitalEmployee.personaName}
              className="h-16 w-16 rounded-full"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {skill.digitalEmployee?.personaName ?? skill.name}
              </h1>
              <StatusBadge status={skill.status} />
            </div>
            <p className="mt-1 text-gray-500">{skill.summary}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span>by {skill.owner.name}</span>
          <span>·</span>
          <span>{skill.callCount} 次调用</span>
          <span>·</span>
          <span>{skill._count.likes} 赞</span>
          {skill.ratingCount > 0 && (
            <>
              <span>·</span>
              <span>
                ★ {skill.ratingAvg.toFixed(1)} ({skill.ratingCount})
              </span>
            </>
          )}
        </div>

        {skill.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {skill.tags.map((tag) => (
              <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Digital Employee Persona */}
      {isDigitalEmployee && skill.digitalEmployee && (
        <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-purple-900">数字员工</h2>
          <dl className="space-y-1 text-sm text-purple-800">
            <div>
              <dt className="inline font-medium">角色定位：</dt>
              <dd className="inline">{skill.digitalEmployee.roleDesc}</dd>
            </div>
            <div>
              <dt className="inline font-medium">欢迎语：</dt>
              <dd className="inline">{skill.digitalEmployee.welcomeMessage}</dd>
            </div>
            <div>
              <dt className="inline font-medium">简介：</dt>
              <dd className="inline">{skill.digitalEmployee.personaIntro}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Stats Panel */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
          <p className="text-xs text-gray-500">累计调用</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{stats.totalCalls}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
          <p className="text-xs text-gray-500">近7天</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{stats.last7DaysCalls}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
          <p className="text-xs text-gray-500">成功率</p>
          <p className="mt-1 text-lg font-bold text-green-600">{stats.successRate}%</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
          <p className="text-xs text-gray-500">平均耗时</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {stats.avgLatencyMs > 0 ? `${stats.avgLatencyMs}ms` : "-"}
          </p>
        </div>
      </div>

      {/* SKILL.md Content */}
      {skill.skillMd && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">SKILL.md</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap bg-gray-50 p-4 text-sm text-gray-700">
              {skill.skillMd}
            </pre>
          </div>
        </div>
      )}

      {/* Try-Run Console (only for Approved skills with endpoint) */}
      {skill.status === "Approved" && skill.endpointUrl && user && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">在线试运行</h2>
          <TryRunConsole slug={skill.slug} invokeUrl={invokeUrl} inputSchema={inputSchema} />
        </div>
      )}

      {/* API Documentation Panel */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">API 调用</h2>
        <ApiDocPanel
          slug={skill.slug}
          name={skill.name}
          summary={skill.summary}
          invokeUrl={invokeUrl}
          inputSchema={inputSchema}
          outputSchema={outputSchema}
        />
        {user ? (
          <p className="mt-2 text-sm text-gray-500">
            需要先在{" "}
            <Link href="/account" className="text-blue-600 hover:underline">
              个人中心
            </Link>{" "}
            生成 API Key
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            <Link href="/login" className="text-blue-600 hover:underline">
              登录
            </Link>{" "}
            后可试运行或生成 API Key
          </p>
        )}
      </div>

      {/* Comments */}
      <CommentSection skillId={skill.id} comments={comments} isLoggedIn={!!user} />
    </div>
  );
}
