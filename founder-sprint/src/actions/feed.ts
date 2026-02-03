"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

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
  revalidateTag(`posts-${user.batchId}`);

  return { success: true, data: { id: post.id } };
}

export async function getPosts(batchId: string, groupId?: string) {
  // If groupId is provided, check group membership
  if (groupId) {
    const user = await getCurrentUser();
    if (!user) return [];

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    // If not a member and not admin, return empty array
    if (!membership && !isAdmin(user.role)) {
      return [];
    }
  }

  const cacheKey = groupId ? `posts-${batchId}-group-${groupId}` : `posts-${batchId}`;

  return unstable_cache(
    () =>
      prisma.post.findMany({
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
      }),
    [cacheKey],
    { revalidate: 60, tags: [`posts-${batchId}`] }
  )();
}

export async function getArchivedPosts(batchId: string) {
  return unstable_cache(
    () =>
      prisma.post.findMany({
        where: {
          batchId,
          isHidden: true,
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
        orderBy: { createdAt: "desc" },
      }),
    [`archived-posts-${batchId}`],
    { revalidate: 60, tags: [`archived-posts-${batchId}`] }
  )();
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
  revalidateTag(`posts-${user.batchId}`);
  revalidateTag(`post-${postId}`);

  return { success: true, data: { id: comment.id } };
}

const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function updateComment(
  commentId: string,
  content: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!content.trim()) {
    return { success: false, error: "Comment content is required" };
  }

  if (content.length > 1000) {
    return { success: false, error: "Comment content exceeds maximum length of 1000 characters" };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true },
  });

  if (!comment) {
    return { success: false, error: "Comment not found" };
  }

  if (comment.authorId !== user.id) {
    return { success: false, error: "Unauthorized: only comment owner can update" };
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { content: content.trim() },
  });

  revalidatePath("/feed");
  revalidatePath(`/feed/${comment.postId}`);
  revalidateTag(`posts-${user.batchId}`);
  revalidateTag(`post-${comment.postId}`);

  return { success: true, data: undefined };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true },
  });

  if (!comment) {
    return { success: false, error: "Comment not found" };
  }

  const isOwner = comment.authorId === user.id;
  const isAdminUser = user.role === "super_admin" || user.role === "admin";

  if (!isOwner && !isAdminUser) {
    return { success: false, error: "Unauthorized: only comment owner or admin can delete" };
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  revalidatePath("/feed");
  revalidatePath(`/feed/${comment.postId}`);
  revalidateTag(`posts-${user.batchId}`);
  revalidateTag(`post-${comment.postId}`);

  return { success: true, data: undefined };
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
  let targetPostId = postId;
  if (!targetPostId && commentId) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { postId: true },
    });
    targetPostId = comment?.postId;
  }
  if (targetPostId) {
    revalidatePath(`/feed/${targetPostId}`);
  }
  revalidateTag(`posts-${user.batchId}`);
  if (targetPostId) {
    revalidateTag(`post-${targetPostId}`);
  }

  return { success: true, data: undefined };
}

export async function getPost(id: string) {
  return unstable_cache(
    () =>
      prisma.post.findUnique({
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
      }),
    [`post-${id}`],
    { revalidate: 60, tags: [`post-${id}`] }
  )();
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

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, groupId: true },
  });

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  if (post.authorId !== user.id) {
    return { success: false, error: "Unauthorized: only post owner can update" };
  }

  await prisma.post.update({
    where: { id: postId },
    data: { 
      content: parsed.data.content,
    },
  });

  revalidatePath("/feed");
  revalidatePath(`/feed/${postId}`);
  if (post.groupId) {
    revalidatePath(`/groups/${post.groupId}`);
  }
  revalidateTag(`posts-${user.batchId}`);
  revalidateTag(`post-${postId}`);

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
  revalidateTag(`posts-${user.batchId}`);
  revalidateTag(`post-${postId}`);

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
  revalidateTag(`posts-${user.batchId}`);
  revalidateTag(`post-${postId}`);

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
  revalidateTag(`posts-${post.batchId}`);
  revalidateTag(`post-${postId}`);

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
   revalidateTag(`posts-${user.batchId}`);
   revalidateTag(`post-${postId}`);

   return { success: true, data: undefined };
}

export async function restorePost(postId: string): Promise<ActionResult> {
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

   if (!post.isHidden) {
     return { success: false, error: "Post is not hidden and cannot be restored" };
   }

   // Restore hidden post
   await prisma.post.update({
     where: { id: postId },
     data: { isHidden: false },
   });

   revalidatePath("/feed");
   if (post.groupId) {
     revalidatePath(`/groups/${post.groupId}`);
   }
   revalidateTag(`posts-${user.batchId}`);
   revalidateTag(`post-${postId}`);

   return { success: true, data: undefined };
}
