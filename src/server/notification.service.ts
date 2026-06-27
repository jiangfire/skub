import { prisma } from "@/lib/prisma";

// ─── Notification Service ───
// Sends in-app notifications to users (Spec W4: 通知贡献者).
// Non-blocking: notification failures should not break the main flow.

export const NOTIFICATION_TYPES = {
  REVIEW_APPROVED: "REVIEW_APPROVED",
  REVIEW_REJECTED: "REVIEW_REJECTED",
  REVIEW_CHANGES_REQUESTED: "REVIEW_CHANGES_REQUESTED",
  SKILL_FORCE_OFFLINE: "SKILL_FORCE_OFFLINE",
  ROLE_CHANGED: "ROLE_CHANGED",
} as const;

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  content: string;
  link?: string;
}

/**
 * Create a notification for a user.
 * Non-blocking: errors are logged but never thrown.
 */
export async function notify(input: CreateNotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        link: input.link ?? null,
      },
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

/**
 * List notifications for a user (most recent first).
 */
export async function listNotifications(userId: string, page = 1, pageSize = 20) {
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Mark a notification as read.
 */
export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
