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

export default function CommentSection({
  skillId,
  comments,
  isLoggedIn,
}: {
  skillId: string;
  comments: Comment[];
  isLoggedIn: boolean;
}) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/skills/${skillId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("评论失败");
      setContent("");
      window.location.reload();
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
      const res = await fetch(`/api/skills/${skillId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parentId }),
      });

      if (!res.ok) throw new Error("回复失败");
      setReplyContent("");
      setReplyTo(null);
      window.location.reload();
    } catch {
      setError("回复失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-gray-900">评论 ({comments.length})</h2>

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
    </div>
  );
}
