"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const CreatePostSchema = z.object({
  content: z.string().min(1).max(3000),
  groupId: z.string().optional().or(z.literal("")),
});

export async function createPost(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = CreatePostSchema.safeParse({
    content: formData.get("content"),
    groupId: formData.get("groupId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const post = await prisma.post.create({
    data: {
      batchId: user.batchId,
      authorId: user.id,
      content: parsed.data.content,
      groupId: parsed.data.groupId || null,
    },
  });

  revalidatePath("/feed");
  if (parsed.data.groupId) {
    revalidatePath(`/groups/${parsed.data.groupId}`);
  }

  return { success: true, data: { id: post.id } };
}

export async function getPosts(batchId: string, groupId?: string) {
  return prisma.post.findMany({
    where: {
      batchId,
      ...(groupId ? { groupId } : {}),
      isHidden: false,
    },
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
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" },
    ],
  });
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!content.trim()) {
    return { success: false, error: "Comment content is required" };
  }

  if (content.length > 1000) {
    return { success: false, error: "Comment content exceeds maximum length of 1000 characters" };
  }

  // Enforce 2-level depth limit: if parentId is provided, check if parent has a parent
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { parentId: true },
    });

    if (parentComment && parentComment.parentId) {
      return { success: false, error: "Comments can only be nested 2 levels deep (comment → reply)" };
    }
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: user.id,
      content: content.trim(),
      parentId: parentId || null,
    },
  });

  revalidatePath("/feed");
  revalidatePath(`/feed/${postId}`);

  return { success: true, data: { id: comment.id } };
}

export async function toggleLike(
  targetType: "post" | "comment",
  postId?: string,
  commentId?: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (targetType === "post" && !postId) {
    return { success: false, error: "Post ID required for post likes" };
  }

  if (targetType === "comment" && !commentId) {
    return { success: false, error: "Comment ID required for comment likes" };
  }

  // Check if like exists
  const existingLike = await prisma.like.findFirst({
    where: {
      userId: user.id,
      targetType,
      postId: targetType === "post" ? postId : null,
      commentId: targetType === "comment" ? commentId : null,
    },
  });

  if (existingLike) {
    // Unlike
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
  } else {
    // Like
    await prisma.like.create({
      data: {
        userId: user.id,
        targetType,
        postId: targetType === "post" ? postId : null,
        commentId: targetType === "comment" ? commentId : null,
      },
    });
  }

  revalidatePath("/feed");
  if (postId) {
    revalidatePath(`/feed/${postId}`);
  }

  return { success: true, data: undefined };
}

export async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      images: true,
      comments: {
        where: { parentId: null },
        include: {
          author: true,
          replies: {
            include: {
              author: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      likes: {
        include: {
          user: true,
        },
      },
    },
  });
}

const UpdatePostSchema = z.object({
  content: z.string().min(1).max(3000),
});

export async function updatePost(
  postId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = UpdatePostSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  // Get the post with comment count
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      _count: {
        select: { comments: true },
      },
    },
  });

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  // Owner can update before any comments, admin can update anytime
  const isOwner = post.authorId === user.id;
  const isAdminUser = user.role === "super_admin" || user.role === "admin";

  if (!isOwner && !isAdminUser) {
    return { success: false, error: "Unauthorized: only post owner or admin can update" };
  }

  if (isOwner && !isAdminUser && post._count.comments > 0) {
    return { success: false, error: "Cannot update post after comments have been added" };
  }

  await prisma.post.update({
    where: { id: postId },
    data: { content: parsed.data.content },
  });

  revalidatePath("/feed");
  revalidatePath(`/feed/${postId}`);
  if (post.groupId) {
    revalidatePath(`/groups/${post.groupId}`);
  }

  return { success: true, data: undefined };
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, groupId: true },
  });

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  const isOwner = post.authorId === user.id;
  const isAdminUser = user.role === "super_admin" || user.role === "admin";

  if (!isOwner && !isAdminUser) {
    return { success: false, error: "Unauthorized: only post owner or admin can delete" };
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  revalidatePath("/feed");
  if (post.groupId) {
    revalidatePath(`/groups/${post.groupId}`);
  }

  return { success: true, data: undefined };
}

export async function hidePost(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (user.role !== "super_admin" && user.role !== "admin") {
    return { success: false, error: "Unauthorized: admin access required" };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { isHidden: true, groupId: true },
  });

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  // Toggle isHidden field
  await prisma.post.update({
    where: { id: postId },
    data: { isHidden: !post.isHidden },
  });

  revalidatePath("/feed");
  if (post.groupId) {
    revalidatePath(`/groups/${post.groupId}`);
  }

  return { success: true, data: undefined };
}

export async function pinPost(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (user.role !== "super_admin" && user.role !== "admin") {
    return { success: false, error: "Unauthorized: admin access required" };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { isPinned: true, batchId: true, groupId: true },
  });

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  // If pinning, check if batch already has 3 pinned posts
  if (!post.isPinned) {
    const pinnedCount = await prisma.post.count({
      where: {
        batchId: post.batchId,
        isPinned: true,
      },
    });

    if (pinnedCount >= 3) {
      return { success: false, error: "Maximum of 3 pinned posts per batch reached" };
    }
  }

  // Toggle isPinned field
  await prisma.post.update({
    where: { id: postId },
    data: { isPinned: !post.isPinned },
  });

  revalidatePath("/feed");
  if (post.groupId) {
    revalidatePath(`/groups/${post.groupId}`);
  }

  return { success: true, data: undefined };
}

export async function archivePost(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (user.role !== "super_admin" && user.role !== "admin") {
    return { success: false, error: "Unauthorized: admin access required" };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { groupId: true },
  });

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  // Soft delete by hiding the post
  await prisma.post.update({
    where: { id: postId },
    data: { isHidden: true },
  });

  revalidatePath("/feed");
  if (post.groupId) {
    revalidatePath(`/groups/${post.groupId}`);
  }

  return { success: true, data: undefined };
}
