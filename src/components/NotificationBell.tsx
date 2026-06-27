"use client";

import { useState, useEffect, useRef } from "react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  REVIEW_APPROVED: "✅",
  REVIEW_REJECTED: "❌",
  REVIEW_CHANGES_REQUESTED: "📝",
  SKILL_FORCE_OFFLINE: "⚠️",
  ROLE_CHANGED: "🔑",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchUnreadCount() {
    try {
      const res = await fetch("/api/notifications?pageSize=1");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // silent fail
    }
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?pageSize=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(
          data.notifications.map((n: NotificationItem & { createdAt: Date | string }) => ({
            ...n,
            createdAt: typeof n.createdAt === "string" ? n.createdAt : new Date().toISOString(),
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    if (!open) {
      await fetchNotifications();
    }
    setOpen(!open);
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function handleMarkRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function formatTime(iso: string) {
    const date = new Date(iso);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString("zh-CN");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative text-sm text-gray-600 hover:text-gray-900"
        aria-label="通知"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <span className="text-sm font-semibold text-gray-900">通知</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
                全部标为已读
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-sm text-gray-500">加载中...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">暂无通知</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`flex gap-2 px-4 py-3 hover:bg-gray-50 ${
                      !n.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <span className="text-lg">{TYPE_ICONS[n.type] ?? "📢"}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{n.title}</span>
                        <span className="text-xs text-gray-400">{formatTime(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-600">{n.content}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {n.link && (
                          <a
                            href={n.link}
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => handleMarkRead(n.id)}
                          >
                            查看 →
                          </a>
                        )}
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            标为已读
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
