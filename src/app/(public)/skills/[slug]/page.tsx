import { notFound } from "next/navigation";
import { getSkillBySlug } from "@/server/skill.service";
import {
  getUserRating,
  listComments,
  getUserLike,
  getUserFavorite,
} from "@/server/community.service";
import { getSessionUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import StatusBadge from "@/components/StatusBadge";
import CommentSection from "@/components/CommentSection";
import SkillFileTree from "@/components/SkillFileTree";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import RatingWidget from "@/components/RatingWidget";
import SkillActionBar from "@/components/SkillActionBar";
import { buildFileTree } from "@/lib/file-tree";

export default async function SkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();

  let skill;
  try {
    skill = await getSkillBySlug(user, slug);
  } catch {
    notFound();
  }

  // Fetch initial comments, files, rating, like and favorite state
  const [
    { comments, total: totalComments, page: initialPage, totalPages },
    skillFiles,
    userRating,
    userLiked,
    userFavorited,
  ] = await Promise.all([
    listComments(skill.id, 1, 20),
    prisma.skillFile.findMany({
      where: { skillId: skill.id },
      orderBy: { path: "asc" },
      select: { path: true, mimeType: true, size: true },
    }),
    user ? getUserRating(user.id, skill.id) : null,
    user ? getUserLike(user.id, skill.id) : false,
    user ? getUserFavorite(user.id, skill.id) : false,
  ]);

  const files = buildFileTree(skillFiles);
  const isDigitalEmployee = !!skill.digitalEmployee;

  const stats = {
    downloadCount: skill.downloadCount,
    ratingAvg: skill.ratingAvg,
    ratingCount: skill.ratingCount,
    favoriteCount: skill._count.favorites,
    likeCount: skill._count.likes,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      {/* === Header Section === */}
      <header className="mb-8">
        {/* Title Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isDigitalEmployee && skill.digitalEmployee && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-purple-200/60">
                  🤖 数字员工
                </span>
              )}
              <StatusBadge status={skill.status} />
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {skill.digitalEmployee?.personaName ?? skill.name}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-neutral-600">{skill.summary}</p>
          </div>

          {/* Avatar */}
          {isDigitalEmployee && skill.digitalEmployee && (
            <Image
              src={skill.digitalEmployee.avatarUrl}
              alt={skill.digitalEmployee.personaName}
              width={80}
              height={80}
              className="shrink-0 rounded-2xl ring-2 ring-purple-100"
              unoptimized
            />
          )}
        </div>

        {/* Meta Info */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
          <span className="font-medium text-neutral-700">{skill.owner.name}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {stats.downloadCount} 次下载
          </span>
          {stats.ratingCount > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 text-amber-600">
                ★ {stats.ratingAvg.toFixed(1)} ({stats.ratingCount})
              </span>
            </>
          )}
        </div>

        {/* Tags */}
        {skill.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skill.tags.map((tag) => (
              <span
                key={tag}
                className="ring-neutral-200/60 inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 ring-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* === Rating Widget === */}
      <section className="mb-8">
        <RatingWidget
          slug={slug}
          ratingAvg={stats.ratingAvg}
          ratingCount={stats.ratingCount}
          userRating={userRating}
          isLoggedIn={!!user}
          isApproved={skill.status === "Approved"}
        />
      </section>

      {/* === Action Bar: Download / Like / Favorite === */}
      <section className="mb-8">
        <SkillActionBar
          slug={slug}
          downloadCount={stats.downloadCount}
          likeCount={stats.likeCount}
          favoriteCount={stats.favoriteCount}
          userLiked={userLiked}
          userFavorited={userFavorited}
          isLoggedIn={!!user}
          isApproved={skill.status === "Approved"}
          hasDownload={!!skill.skillMd || !!skill.zipUrl}
        />
      </section>

      {/* === Digital Employee Persona === */}
      {isDigitalEmployee && skill.digitalEmployee && (
        <section className="mb-8 rounded-xl border border-purple-200/60 bg-purple-50/50 p-5">
          <h2 className="mb-3 text-sm font-semibold text-purple-900">🤖 数字员工信息</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-purple-800">角色定位</dt>
              <dd className="text-purple-700">{skill.digitalEmployee.roleDesc}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-purple-800">欢迎语</dt>
              <dd className="text-purple-700">{skill.digitalEmployee.welcomeMessage}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-purple-800">简介</dt>
              <dd className="text-purple-700">{skill.digitalEmployee.personaIntro}</dd>
            </div>
          </dl>
        </section>
      )}

      {/* === SKILL.md Content === */}
      {skill.skillMd && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">SKILL.md</h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <div className="max-h-[600px] overflow-auto p-4">
              <MarkdownRenderer content={skill.skillMd} />
            </div>
          </div>
        </section>
      )}

      {/* === File Tree === */}
      {files.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">文件列表</h2>
          <SkillFileTree files={files} skillSlug={slug} />
        </section>
      )}

      {/* === Installation Guide === */}
      <section className="border-brand-200/60 bg-brand-50/50 mb-8 rounded-xl border p-5">
        <h2 className="mb-4 text-lg font-semibold text-brand-900">📦 如何安装此 Skill</h2>
        <div className="space-y-4 text-sm">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              1
            </div>
            <div>
              <h3 className="font-medium text-brand-900">下载 Skill 包</h3>
              <p className="mt-0.5 text-brand-700">
                点击上方的「下载 Skill (.zip)」按钮，将 ZIP 文件保存到本地。
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              2
            </div>
            <div>
              <h3 className="font-medium text-brand-900">解压 ZIP 文件</h3>
              <p className="mt-0.5 text-brand-700">
                解压下载的 ZIP 文件，得到一个文件夹（如{" "}
                <code className="rounded bg-brand-100 px-1 text-xs">your-skill/</code>）。
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              3
            </div>
            <div>
              <h3 className="font-medium text-brand-900">在 AI 工具中使用</h3>
              <div className="mt-1.5 space-y-2 text-brand-700">
                <InstallGuideRow tool="OpenCode" path="~/.workbuddy/skills/" />
                <InstallGuideRow tool="Claude (桌面版 / Claude.ai)" path="~/.claude/skills/" />
                <InstallGuideRow
                  tool="Cursor / VS Code"
                  path=".cursor/skills/ 或 .vscode/skills/"
                />
                <InstallGuideRow
                  tool="OpenAI Codex / ChatGPT"
                  path="上传 SKILL.md 或粘贴到 Custom Instructions"
                />
              </div>
            </div>
          </div>

          {/* File Structure */}
          <div className="mt-4 flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              ?
            </div>
            <div>
              <h3 className="font-medium text-brand-900">Skill 标准结构</h3>
              <pre className="bg-brand-100/80 mt-1.5 overflow-x-auto rounded-lg p-3 text-xs text-brand-900">
                {`skill-name/
├── SKILL.md          # 必须：技能指令（frontmatter + 正文）
├── agents/
│   └── openai.yaml  # 推荐：UI 展示元数据
├── scripts/          # 可选：可执行脚本
├── references/       # 可选：参考文档
└── assets/          # 可选：模板、图片等资源`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* === Comments === */}
      <CommentSection
        slug={slug}
        comments={comments}
        total={totalComments}
        initialPage={initialPage}
        totalPages={totalPages}
        isLoggedIn={!!user}
      />
    </div>
  );
}

/* --- Install Guide Row --- */
function InstallGuideRow({ tool, path }: { tool: string; path: string }) {
  return (
    <div>
      <span className="font-medium text-brand-800">{tool}：</span>
      <span>
        将解压后的文件夹放到 <code className="rounded bg-brand-100 px-1 text-xs">{path}</code>
        {tool === "OpenAI Codex / ChatGPT" ? "。" : "，重启后即可使用。"}
      </span>
    </div>
  );
}
