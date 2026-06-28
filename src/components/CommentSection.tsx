"use client";

import { useState } from "react";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: string | Date;
  user: { id: string; name: string; avatar: string | null };
  replies?: Comment[];
}

interface CommentSectionProps {
  slug: string;
  comments: Comment[];
  total: number;
  initialPage: number;
  totalPages: number;
  isLoggedIn: boolean;
}

export default function CommentSection({
  slug,
  comments: initialComments,
  total,
  initialPage,
  totalPages,
  isLoggedIn,
}: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [comments, setComments] = useState(initialComments);
  const [page, setPage] = useState(initialPage);
  const [currentTotal, setCurrentTotal] = useState(total);
  const [currentTotalPages, setCurrentTotalPages] = useState(totalPages);
  const [loadingMore, setLoadingMore] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/skills/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("评论失败");
      const data = await res.json();
      setContent("");
      setComments((prev) => [data.comment, ...prev]);
      setCurrentTotal((prev) => prev + 1);
      setCurrentTotalPages((_) => Math.ceil((currentTotal + 1) / 20) || 1);
    } catch {
      setError("评论发布失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(parentId: string) {
    if (!replyContent.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/skills/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parentId }),
      });

      if (!res.ok) throw new Error("回复失败");
      const data = await res.json();
      setReplyContent("");
      setReplyTo(null);
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replies: [...(c.replies ?? []), data.comment] } : c,
        ),
      );
      setCurrentTotal((prev) => prev + 1);
    } catch {
      setError("回复失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadNextPage() {
    if (page >= currentTotalPages || loadingMore) return;
    setLoadingMore(true);

    try {
      const res = await fetch(`/api/skills/${slug}/comments?page=${page + 1}`);
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setComments((prev) => [...prev, ...data.comments]);
      setPage(data.page);
      setCurrentTotal(data.total);
      setCurrentTotalPages(data.totalPages);
    } catch {
      setError("评论加载失败");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-gray-900">评论 ({currentTotal})</h2>

      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</div>}

      {/* New Comment Form */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的评论..."
            rows={3}
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="mt-2 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            发表评论
          </button>
        </form>
      ) : (
        <p className="mb-6 text-sm text-gray-400">
          <Link href="/login" className="text-blue-600 hover:underline">
            登录
          </Link>{" "}
          后发表评论
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400">暂无评论</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                  {comment.user.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{comment.user.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{comment.content}</p>

              {/* Reply button */}
              {isLoggedIn && (
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  {replyTo === comment.id ? "取消回复" : "回复"}
                </button>
              )}

              {/* Reply form */}
              {replyTo === comment.id && (
                <div className="mt-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`回复 ${comment.user.name}...`}
                    rows={2}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleReply(comment.id)}
                    disabled={loading || !replyContent.trim()}
                    className="mt-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    回复
                  </button>
                </div>
              )}

              {/* Replies (one level only) */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-2 border-l-2 border-gray-100 pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                        {reply.user.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {reply.user.name}
                          <span className="ml-2 font-normal text-gray-400">
                            {new Date(reply.createdAt).toLocaleDateString("zh-CN")}
                          </span>
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-gray-700">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {page < currentTotalPages && (
        <button
          type="button"
          onClick={loadNextPage}
          disabled={loadingMore}
          className="mt-4 w-full rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {loadingMore ? "加载中..." : "下一页"}
        </button>
      )}
    </div>
  );
}
