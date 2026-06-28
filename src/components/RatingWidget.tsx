"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface RatingWidgetProps {
  slug: string;
  ratingAvg: number;
  ratingCount: number;
  userRating: number | null;
  isLoggedIn: boolean;
  isApproved: boolean;
}

export default function RatingWidget({
  slug,
  ratingAvg,
  ratingCount,
  userRating,
  isLoggedIn,
  isApproved,
}: RatingWidgetProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [currentAvg, setCurrentAvg] = useState(ratingAvg);
  const [currentCount, setCurrentCount] = useState(ratingCount);
  const [currentUserRating, setCurrentUserRating] = useState(userRating);
  const [loading, setLoading] = useState(false);

  async function submitRating(stars: number) {
    if (!isLoggedIn || !isApproved || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/skills/${slug}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "评分失败");
      }

      const result = await res.json();
      setCurrentAvg(result.ratingAvg);
      setCurrentCount(result.ratingCount);
      setCurrentUserRating(stars);
      showToast("评分已提交", "success");
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "评分失败", "error");
    } finally {
      setLoading(false);
    }
  }

  const displayRating = currentCount > 0 ? currentAvg.toFixed(1) : "暂无评分";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">评分</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{displayRating}</span>
            {currentCount > 0 && (
              <span className="text-xs text-gray-400">({currentCount} 人评分)</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => {
              const fillTarget = hoveredStar || currentUserRating || currentAvg;
              const filled = star <= fillTarget;
              const halfFilled = !filled && star - 0.5 <= fillTarget;
              return (
                <button
                  key={star}
                  type="button"
                  disabled={!isLoggedIn || !isApproved || loading}
                  onMouseEnter={() => isLoggedIn && isApproved && setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => submitRating(star)}
                  className={`relative p-0.5 transition-colors disabled:cursor-not-allowed ${
                    isLoggedIn && isApproved ? "cursor-pointer hover:scale-110" : "cursor-default"
                  }`}
                  aria-label={`${star} 星`}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-gray-300"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {(filled || halfFilled) && (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={`absolute inset-0 p-0.5 text-amber-400 ${halfFilled ? "clip-half-star" : ""}`}
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          {!isLoggedIn && (
            <p className="text-xs text-gray-400">
              <Link href="/login" className="text-blue-600 hover:underline">
                登录
              </Link>{" "}
              后评分
            </p>
          )}
          {isLoggedIn && !isApproved && <p className="text-xs text-gray-400">上架后可评分</p>}
          {isLoggedIn && isApproved && currentUserRating && (
            <p className="text-xs text-green-600">你已评分 {currentUserRating} 星</p>
          )}
        </div>
      </div>
    </div>
  );
}
