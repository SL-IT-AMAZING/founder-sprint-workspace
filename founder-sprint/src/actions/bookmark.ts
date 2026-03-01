"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { revalidatePath, revalidateTag as revalidateTagBase } from "next/cache";
import type { ActionResult } from "@/types";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

export async function bookmarkPost(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck;

  try {
    await prisma.bookmark.upsert({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
      create: {
        userId: user.id,
        postId,
      },
      update: {},
    });

    revalidatePath("/bookmarks");
    revalidateTag(`bookmarks-${user.id}`);

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: "Failed to bookmark post" };
  }
}

export async function unbookmarkPost(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck;

  try {
    await prisma.bookmark.deleteMany({
      where: {
        userId: user.id,
        postId,
      },
    });

    revalidatePath("/bookmarks");
    revalidateTag(`bookmarks-${user.id}`);

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: "Failed to unbookmark post" };
  }
}

export async function getUserBookmarks(page: number = 1, limit: number = 20) {
  const user = await getCurrentUser();
  if (!user) return { items: [], total: 0, page, limit, totalPages: 0 };

  try {
    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: {
          userId: user.id,
        },
        include: {
          post: {
            include: {
              author: true,
              images: true,
              _count: {
                select: {
                  comments: true,
                  likes: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bookmark.count({
        where: {
          userId: user.id,
        },
      }),
    ]);

    return {
      items: bookmarks.map((b) => b.post),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    return { items: [], total: 0, page, limit, totalPages: 0 };
  }
}

export async function checkIsBookmarked(postId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    return !!bookmark;
  } catch (error) {
    return false;
  }
}
