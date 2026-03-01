"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import type { ActionResult } from "@/types";

export async function trackPostView(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Use date-only (no time) for the unique constraint
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const existingView = await prisma.postView.findUnique({
      where: {
        postId_viewerId_viewedAt: {
          postId,
          viewerId: user.id,
          viewedAt: today,
        },
      },
    });

    // Only create view and increment count if this is a new view
    if (!existingView) {
      await prisma.$transaction([
        prisma.postView.create({
          data: {
            postId,
            viewerId: user.id,
            viewedAt: today,
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { viewCount: { increment: 1 } },
        }),
      ]);
    }

    return { success: true, data: undefined };
  } catch (error) {
    // Silently handle errors - view tracking is non-critical
    // Return success to avoid disrupting user experience
    return { success: true, data: undefined };
  }
}
