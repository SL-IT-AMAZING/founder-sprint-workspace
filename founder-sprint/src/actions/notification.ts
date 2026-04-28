"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { revalidatePath, revalidateTag as revalidateTagBase } from "next/cache";
import type { ActionResult } from "@/types";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

function getNotificationTargetPath(
  type: string,
  entityId: string | null,
  isAdminUser: boolean
): string | null {
  if (!entityId) return null;

  switch (type) {
    case "feed_mention":
      return `/feed/${entityId}`;
    case "assignment_assigned":
    case "assignment_deadline_reminder":
      return `/assignments/${entityId}`;
    case "assignment_feedback":
    case "assignment_feedback_reply":
    case "submission_status":
    case "submission_completed":
      return `/submissions/${entityId}`;
    case "company_request_rejected":
    case "company_request_approved":
      return "/settings";
    case "company_request_leave":
    case "company_request_new":
    case "company_request_join":
    case "company_request_founder_restructure":
      return isAdminUser ? "/admin/companies" : "/settings";
    default:
      return null;
  }
}

export async function getNotifications(
  page: number = 1,
  limit: number = 50
): Promise<ActionResult<{
  items: Array<{
    id: string;
    type: string;
    entityId: string | null;
    title: string;
    message: string | null;
    read: boolean;
    createdAt: Date;
    targetPath: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const where = { userId: user.id };
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        type: true,
        entityId: true,
        title: true,
        message: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    success: true,
    data: {
      items: items.map((item) => ({
        ...item,
        targetPath: getNotificationTargetPath(item.type, item.entityId, isAdmin(user.role)),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUnreadNotificationCount(): Promise<ActionResult<{ count: number }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const count = await prisma.notification.count({
    where: {
      userId: user.id,
      read: false,
    },
  });

  return { success: true, data: { count } };
}

export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId: user.id,
    },
    select: { id: true, read: true },
  });

  if (!notification) {
    return { success: false, error: "Notification not found" };
  }

  if (!notification.read) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    });
  }

  revalidatePath("/notifications");
  revalidateTag("notifications");

  return { success: true, data: { id: notification.id } };
}

export async function markAllNotificationsRead(): Promise<ActionResult<{ count: number }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const result = await prisma.notification.updateMany({
    where: {
      userId: user.id,
      read: false,
    },
    data: { read: true },
  });

  revalidatePath("/notifications");
  revalidateTag("notifications");

  return { success: true, data: { count: result.count } };
}
