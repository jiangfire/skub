import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import SkillActions from "@/components/SkillActions";
import ZipUploadButton from "@/components/ZipUploadButton";
import SkillFileTree from "@/components/SkillFileTree";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { buildFileTree } from "@/lib/file-tree";

export default async function StudioSkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();

  const skill = await prisma.skill.findFirst({
    where: { id, ownerId: user.id },
    include: {
      latestVersion: true,
      versions: { orderBy: { createdAt: "desc" } },
      digitalEmployee: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: { name: true } } },
      },
      files: {
        orderBy: { path: "asc" },
        select: { path: true, mimeType: true, size: true },
      },
    },
  });

  if (!skill) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{skill.name}</h1>
        <StatusBadge status={skill.status} />
      </div>

      {/* Review feedback */}
      {skill.reviews.length > 0 && (
        <div className="mb-6 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">审核记录</h2>
          <div className="space-y-2">
            {skill.reviews.map((review) => (
              <div key={review.id} className="text-sm">
                <span className="font-medium text-gray-900">{review.reviewer.name}</span>
                <span className="ml-2 text-gray-500">
                  {review.decision === "Approve"
                    ? "通过"
                    : review.decision === "Reject"
                      ? "驳回"
                      : "打回修改"}
                </span>
                <p className="mt-1 text-gray-600">{review.comment}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <SkillActions skillId={skill.id} status={skill.status} />
        <ZipUploadButton skillId={skill.id} />
      </div>

      {/* Skill Info */}
      <div className="mb-6 rounded-lg border border-gray-200 p-4">
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="inline font-medium text-gray-700">Slug：</dt>
            <dd className="inline text-gray-600">{skill.slug}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-gray-700">摘要：</dt>
            <dd className="inline text-gray-600">{skill.summary}</dd>
          </div>
          {skill.endpointUrl && (
            <div>
              <dt className="inline font-medium text-gray-700">Endpoint：</dt>
              <dd className="inline text-gray-600">{skill.endpointUrl}</dd>
            </div>
          )}
          {skill.tags.length > 0 && (
            <div>
              <dt className="inline font-medium text-gray-700">标签：</dt>
              <dd className="inline text-gray-600">{skill.tags.join(", ")}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* SKILL.md Preview */}
      {skill.skillMd && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">SKILL.md</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="max-h-[600px] overflow-auto p-4">
              <MarkdownRenderer content={skill.skillMd} />
            </div>
          </div>
        </div>
      )}

      {/* File Tree */}
      {skill.files.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            📂 文件列表 ({skill.files.length} 个文件)
          </h2>
          <SkillFileTree files={buildFileTree(skill.files)} skillSlug={skill.slug} />
        </div>
      )}

      {/* Version History */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-900">版本历史</h2>
        <div className="space-y-2">
          {skill.versions.map((version) => (
            <div
              key={version.id}
              className={`rounded-lg border p-3 text-sm ${
                version.id === skill.latestVersionId
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  v{version.version}
                  {version.id === skill.latestVersionId && (
                    <span className="ml-2 text-xs text-blue-600">当前版本</span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(version.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
              {version.changelog && <p className="mt-1 text-gray-500">{version.changelog}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
