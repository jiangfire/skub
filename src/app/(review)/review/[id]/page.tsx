import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/api/session";
import { prisma } from "@/lib/prisma";
import ReviewForm from "@/components/ReviewForm";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("review");

  const skill = await prisma.skill.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      latestVersion: true,
      versions: { orderBy: { createdAt: "desc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: { name: true } } },
      },
    },
  });

  if (!skill || skill.status !== "Pending") notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">{skill.name}</h1>
      <p className="mb-1 text-sm text-gray-500">by {skill.owner.name}</p>
      <p className="mb-6 text-sm text-gray-600">{skill.summary}</p>

      {/* SKILL.md */}
      {skill.skillMd && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">SKILL.md</h2>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            {skill.skillMd}
          </pre>
        </div>
      )}

      {/* Schemas */}
      {skill.latestVersion && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <h3 className="mb-1 text-xs font-semibold text-gray-700">输入 Schema</h3>
            <pre className="overflow-auto rounded border border-gray-200 bg-gray-50 p-2 text-xs">
              {JSON.stringify(skill.latestVersion.inputSchema, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold text-gray-700">输出 Schema</h3>
            <pre className="overflow-auto rounded border border-gray-200 bg-gray-50 p-2 text-xs">
              {JSON.stringify(skill.latestVersion.outputSchema, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Previous Reviews */}
      {skill.reviews.length > 0 && (
        <div className="mb-6 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">历史审核</h2>
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Form */}
      <ReviewForm skillId={skill.id} />
    </div>
  );
}
