"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { sendFeedMentionEmail, sendFeedReplyNotificationEmail } from "@/lib/email";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";
import { getAccessibleActiveUserIds } from "@/lib/user-access";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

const CreatePostSchema = z.object({
  content: z.string().min(1).max(3000),
  groupId: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  linkPreview: z.string().optional(),
  imageUrls: z.string().optional(),
  mentions: z.string().optional(),
});

const MentionInputSchema = z
  .object({
    userId: z.string().uuid(),
    displayText: z.string().min(1).max(200),
    startIndex: z.number().int().min(0),
    endIndex: z.number().int().min(0),
  })
  .refine((value) => value.endIndex > value.startIndex, {
    message: "Mention end index must be after start index",
  });

const CreatePostMentionsSchema = z.array(MentionInputSchema).max(10);

export type PostMentionInput = z.infer<typeof MentionInputSchema>;

export interface PostMentionDisplay {
  id: string;
  mentionedUserId: string;
  displayText: string;
  startIndex: number;
  endIndex: number;
  isAccessible: boolean;
}

async function annotateMentionsForViewer(
  viewer: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  mentions: Array<{
    id: string;
    mentionedUserId: string;
    displayText: string;
    startIndex: number;
    endIndex: number;
  }>
): Promise<PostMentionDisplay[]> {
  const accessibleUserIds = await getAccessibleActiveUserIds(
    viewer,
    [...new Set(mentions.map((mention) => mention.mentionedUserId))]
  );

  return mentions.map((mention) => ({
    ...mention,
    isAccessible: accessibleUserIds.has(mention.mentionedUserId),
  }));
}

export async function createPost(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (!user.batchId) return { success: false, error: "No batch membership. Cannot create post." };

  const parsed = CreatePostSchema.safeParse({
    content: formData.get("content"),
    groupId: formData.get("groupId") || undefined,
    category: formData.get("category") || undefined,
    linkPreview: formData.get("linkPreview") || undefined,
    imageUrls: formData.get("imageUrls") || undefined,
    mentions: formData.get("mentions") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  let parsedLinkPreview: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined;
  if (parsed.data.linkPreview) {
    try {
      const parsedValue = JSON.parse(parsed.data.linkPreview) as unknown;
      parsedLinkPreview = parsedValue === null ? Prisma.JsonNull : (parsedValue as Prisma.InputJsonValue);
    } catch {
      return { success: false, error: "Invalid link preview payload" };
    }
  }

  let parsedImageUrls: string[] = [];
  if (parsed.data.imageUrls) {
    try {
      const candidate = JSON.parse(parsed.data.imageUrls) as unknown;
      const validated = z.array(z.string().url()).max(5).safeParse(candidate);
      if (!validated.success) {
        return { success: false, error: "Invalid post images payload" };
      }
      parsedImageUrls = validated.data;
    } catch {
      return { success: false, error: "Invalid post images payload" };
    }
  }

  let mentions: PostMentionInput[] = [];
  if (parsed.data.mentions) {
    try {
      const parsedMentions = JSON.parse(parsed.data.mentions) as unknown;
      mentions = CreatePostMentionsSchema.parse(parsedMentions);
    } catch {
      return { success: false, error: "Invalid mentions payload" };
    }
  }

  try {
    const accessibleMentionUserIds = await getAccessibleActiveUserIds(
      user,
      [...new Set(mentions.map((mention) => mention.userId))]
    );

    for (const mention of mentions) {
      if (!accessibleMentionUserIds.has(mention.userId)) {
        return { success: false, error: "One or more mentions are not available." };
      }

      const expectedText = `@${mention.displayText}`;
      if (
        mention.endIndex > parsed.data.content.length ||
        parsed.data.content.slice(mention.startIndex, mention.endIndex) !== expectedText
      ) {
        return { success: false, error: "Mention text does not match the current post content." };
      }
    }

    const uniqueMentionedUserIds = [
      ...new Set(mentions.map((mention) => mention.userId).filter((userId) => userId !== user.id)),
    ];

    const post = await prisma.post.create({
      data: {
        batchId: user.batchId,
        authorId: user.id,
        content: parsed.data.content,
        groupId: parsed.data.groupId || null,
        category: parsed.data.category || null,
        linkPreview: parsedLinkPreview,
        ...(parsedImageUrls.length > 0
          ? {
              images: {
                create: parsedImageUrls.map((imageUrl) => ({ imageUrl })),
              },
            }
          : {}),
        ...(mentions.length > 0
          ? {
              mentions: {
                create: mentions.map((mention) => ({
                  mentionedUserId: mention.userId,
                  displayText: mention.displayText,
                  startIndex: mention.startIndex,
                  endIndex: mention.endIndex,
                })),
              },
            }
          : {}),
      },
    });

    if (uniqueMentionedUserIds.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { id: { in: uniqueMentionedUserIds } },
        select: { id: true, email: true, name: true },
      });

      if (mentionedUsers.length > 0) {
        await prisma.notification.createMany({
          data: mentionedUsers.map((mentionedUser) => ({
            type: "feed_mention",
            userId: mentionedUser.id,
            entityId: post.id,
            title: "You were mentioned in a post",
            message: `${user.name || user.email} mentioned you in a feed post.`,
          })),
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const postUrl = `${appUrl}/feed/${post.id}`;
        const postExcerpt =
          parsed.data.content.length > 220
            ? `${parsed.data.content.slice(0, 220)}...`
            : parsed.data.content;

        await Promise.all(
          mentionedUsers.map((mentionedUser) =>
            sendFeedMentionEmail({
              to: mentionedUser.email,
              recipientName: mentionedUser.name,
              authorName: user.name || user.email,
              postExcerpt,
              postUrl,
            })
          )
        );
      }
    }

    revalidatePath("/feed");
    revalidatePath("/bookmarks");
    revalidatePath("/notifications");
    revalidatePath(`/profile/${user.id}`);
    if (parsed.data.groupId) {
      revalidatePath(`/groups/${parsed.data.groupId}`);
    }
    revalidateTag("posts-global");
    revalidateTag("notifications");

    return { success: true, data: { id: post.id } };
  } catch (error) {
    console.error("[Feed] Failed to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function getPostsForBatches(batchIds: string[]) {
  return unstable_cache(
    () =>
      prisma.post.findMany({
        where: {
          batchId: { in: batchIds },
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
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      }),
    [`posts-multi-${batchIds.sort().join("-")}`],
    { revalidate: 60, tags: batchIds.map((id) => `posts-${id}`) }
  )();
}

export async function getPosts(batchId: string, groupId?: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  if (!isAdmin(user.role) && user.batchId !== batchId) return [];

  // If groupId is provided, check group membership
  if (groupId) {
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

export async function getPaginatedPosts(
  page: number = 1,
  limit: number = 20
) {
  const viewer = await getCurrentUser();
  if (!viewer) return { items: [], total: 0, page, limit, totalPages: 0 };

  const where = { isHidden: false, groupId: null };

  return unstable_cache(
    async () => {
      const [items, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            author: true,
            batch: { select: { name: true } },
            images: true,
            mentions: {
              orderBy: { startIndex: "asc" },
            },
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.post.count({ where }),
      ]);

      const annotatedItems = await Promise.all(
        items.map(async (item) => ({
          ...item,
          mentions: await annotateMentionsForViewer(
            viewer,
            item.mentions as Array<{
              id: string;
              mentionedUserId: string;
              displayText: string;
              startIndex: number;
              endIndex: number;
            }>
          ),
        }))
      );

      return {
        items: annotatedItems,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },
    [`posts-global-page-${page}-limit-${limit}-viewer-${viewer.id}`],
    { revalidate: 60, tags: ["posts-global"] }
  )();
}

export async function getUserPosts(userId: string) {
  const viewer = await getCurrentUser();
  if (!viewer) return [];

  const posts = await prisma.post.findMany({
    where: { authorId: userId, isHidden: false },
    include: {
      author: true,
      images: true,
      mentions: {
        orderBy: { startIndex: "asc" },
      },
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Promise.all(
    posts.map(async (post) => ({
      ...post,
      mentions: await annotateMentionsForViewer(
        viewer,
        post.mentions as Array<{
          id: string;
          mentionedUserId: string;
          displayText: string;
          startIndex: number;
          endIndex: number;
        }>
      ),
    }))
  );
}

export async function getArchivedPosts() {
  const viewer = await getCurrentUser();
  if (!viewer) return [];

  return unstable_cache(
    () =>
      prisma.post.findMany({
        where: {
          isHidden: true,
        },
        include: {
          author: true,
          images: true,
          mentions: {
            orderBy: { startIndex: "asc" },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }).then(async (posts) =>
        Promise.all(
          posts.map(async (post) => ({
            ...post,
            mentions: await annotateMentionsForViewer(
              viewer,
              post.mentions as Array<{
                id: string;
                mentionedUserId: string;
                displayText: string;
                startIndex: number;
                endIndex: number;
              }>
            ),
          }))
        )
      ),
    [`archived-posts-global-viewer-${viewer.id}`],
    { revalidate: 60, tags: ["archived-posts-global"] }
  )();
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  let parentCommentData:
    | {
        parentId: string | null;
        author: { id: string; email: string; name: string | null };
      }
    | null = null;

  if (!content.trim()) {
    return { success: false, error: "Comment content is required" };
  }

  if (content.length > 1000) {
    return { success: false, error: "Comment content exceeds maximum length of 1000 characters" };
  }

  // Enforce 2-level depth limit: if parentId is provided, check if parent has a parent
  if (parentId) {
    parentCommentData = await prisma.comment.findUnique({
      where: { id: parentId },
      select: {
        parentId: true,
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (parentCommentData && parentCommentData.parentId) {
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

  if (parentCommentData?.author && parentCommentData.author.id !== user.id) {
    await prisma.notification.create({
      data: {
        type: "feed_comment_reply",
        userId: parentCommentData.author.id,
        entityId: comment.id,
        title: `${user.name || "Someone"} replied to your comment`,
        message: content.trim().slice(0, 220),
      },
    });

    const postUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/feed/${postId}`;
    const emailResult = await sendFeedReplyNotificationEmail({
      to: parentCommentData.author.email,
      recipientName: parentCommentData.author.name,
      replierName: user.name || user.email,
      replyContent: content.trim().slice(0, 220),
      postUrl,
    });

    if (!emailResult.success) {
      console.warn("Failed to send feed reply notification email:", emailResult.error);
    }
  }

  revalidatePath("/feed");
  revalidatePath(`/feed/${postId}`);
  revalidateTag("posts-global");
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
  revalidateTag("posts-global");
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
  revalidateTag("posts-global");
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

  // Check if like exists and toggle atomically to prevent race conditions
  await prisma.$transaction(async (tx) => {
    const existingLike = await tx.like.findFirst({
      where: {
        userId: user.id,
        targetType,
        postId: targetType === "post" ? postId : null,
        commentId: targetType === "comment" ? commentId : null,
      },
    });

    if (existingLike) {
      // Unlike
      await tx.like.delete({
        where: { id: existingLike.id },
      });
    } else {
      // Like
      await tx.like.create({
        data: {
          userId: user.id,
          targetType,
          postId: targetType === "post" ? postId : null,
          commentId: targetType === "comment" ? commentId : null,
        },
      });
    }
  });

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
  revalidateTag("posts-global");
  if (targetPostId) {
    revalidateTag(`post-${targetPostId}`);
  }

  return { success: true, data: undefined };
}

export async function getPost(id: string) {
  const viewer = await getCurrentUser();
  if (!viewer) return null;

  const post = await unstable_cache(
    () =>
      prisma.post.findUnique({
        where: { id },
        include: {
          author: true,
          images: true,
          mentions: {
            orderBy: { startIndex: "asc" },
          },
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
    [`post-${id}-viewer-${viewer.id}`],
    { revalidate: 60, tags: [`post-${id}`] }
  )();

  if (!post) return null;

  return {
    ...post,
    mentions: await annotateMentionsForViewer(
      viewer,
      post.mentions as Array<{
        id: string;
        mentionedUserId: string;
        displayText: string;
        startIndex: number;
        endIndex: number;
      }>
    ),
  };
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
    select: { authorId: true, groupId: true, _count: { select: { mentions: true } } },
  });

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  if (post.authorId !== user.id) {
    return { success: false, error: "Unauthorized: only post owner can update" };
  }

  if (post._count.mentions > 0) {
    return { success: false, error: "Posts with mentions cannot be edited yet." };
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
  revalidateTag("posts-global");
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
  revalidateTag("posts-global");
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
  revalidateTag("posts-global");
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
  revalidateTag("posts-global");
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
   revalidateTag("posts-global");
   revalidateTag("archived-posts-global");
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
   revalidateTag("posts-global");
   revalidateTag("archived-posts-global");
   revalidateTag(`post-${postId}`);

   return { success: true, data: undefined };
}

export async function getUserLikedPostIds(postIds: string[]): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user || postIds.length === 0) return [];

  const likes = await prisma.like.findMany({
    where: {
      userId: user.id,
      targetType: "post",
      postId: { in: postIds },
    },
    select: { postId: true },
  });

  return likes.map((l) => l.postId).filter((id): id is string => id !== null);
}
