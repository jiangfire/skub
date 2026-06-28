"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface SkillActionBarProps {
  slug: string;
  downloadCount: number;
  likeCount: number;
  favoriteCount: number;
  userLiked: boolean;
  userFavorited: boolean;
  isLoggedIn: boolean;
  isApproved: boolean;
  hasDownload: boolean;
}

export default function SkillActionBar({
  slug,
  downloadCount,
  likeCount: initialLikeCount,
  favoriteCount: initialFavoriteCount,
  userLiked: initialUserLiked,
  userFavorited: initialUserFavorited,
  isLoggedIn,
  isApproved,
  hasDownload,
}: SkillActionBarProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [liked, setLiked] = useState(initialUserLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likeLoading, setLikeLoading] = useState(false);

  const [favorited, setFavorited] = useState(initialUserFavorited);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  async function toggleLike() {
    if (!isLoggedIn) return;
    if (likeLoading) return;

    setLikeLoading(true);
    try {
      const res = await fetch(`/api/skills/${slug}/like`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "点赞失败");
      }
      const { liked: nowLiked } = await res.json();
      setLiked(nowLiked);
      setLikeCount((prev) => (nowLiked ? prev + 1 : Math.max(0, prev - 1)));
      showToast(nowLiked ? "已点赞" : "已取消点赞", "success");
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "点赞失败", "error");
    } finally {
      setLikeLoading(false);
    }
  }

  async function toggleFavorite() {
    if (!isLoggedIn) return;
    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      const res = await fetch(`/api/skills/${slug}/favorite`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "收藏失败");
      }
      const { favorited: nowFavorited } = await res.json();
      setFavorited(nowFavorited);
      setFavoriteCount((prev) => (nowFavorited ? prev + 1 : Math.max(0, prev - 1)));
      showToast(nowFavorited ? "已收藏" : "已取消收藏", "success");
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "收藏失败", "error");
    } finally {
      setFavoriteLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {hasDownload && (
        <a
          href={`/api/skills/${slug}/download`}
          download
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
        >
          <svg
            width="16"
            height="16"
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
          下载 ({downloadCount})
        </a>
      )}

      <button
        type="button"
        onClick={toggleLike}
        disabled={likeLoading || !isApproved}
        className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          liked
            ? "border-pink-300 bg-pink-50 text-pink-600"
            : "border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76" />
        </svg>
        {liked ? "已赞" : "赞"} {likeCount}
      </button>

      <button
        type="button"
        onClick={toggleFavorite}
        disabled={favoriteLoading || !isApproved}
        className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          favorited
            ? "border-amber-300 bg-amber-50 text-amber-600"
            : "border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={favorited ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        {favorited ? "已收藏" : "收藏"} {favoriteCount}
      </button>

      {!isLoggedIn && isApproved && (
        <span className="text-xs text-gray-400">
          <Link href="/login" className="text-blue-600 hover:underline">
            登录
          </Link>{" "}
          后点赞/收藏
        </span>
      )}
    </div>
  );
}
