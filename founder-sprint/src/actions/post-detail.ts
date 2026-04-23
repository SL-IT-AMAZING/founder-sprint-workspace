"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { unstable_cache } from "next/cache";
import { getAccessibleActiveUserIds } from "@/lib/user-access";

export async function getPostById(postId: string) {
  const viewer = await getCurrentUser();
  if (!viewer) return null;

  const post = await unstable_cache(
    () =>
      prisma.post.findUnique({
        where: { id: postId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              headline: true,
            },
          },
          images: true,
          mentions: {
            orderBy: { startIndex: "asc" },
          },
          comments: {
            where: { parentId: null },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true,
                },
              },
              likes: { select: { userId: true } },
              replies: {
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      profileImage: true,
                    },
                  },
                  likes: { select: { userId: true } },
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          likes: { select: { userId: true } },
          bookmarks: { where: { userId: viewer.id }, select: { id: true } },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
    [`post-detail-${postId}-viewer-${viewer.id}`],
    { revalidate: 30, tags: [`post-${postId}`] }
  )();

  if (!post) return null;

  const accessibleUserIds = await getAccessibleActiveUserIds(
    viewer,
    [...new Set(post.mentions.map((mention) => mention.mentionedUserId))]
  );

  return {
    ...post,
    mentions: post.mentions.map((mention) => ({
      ...mention,
      isAccessible: accessibleUserIds.has(mention.mentionedUserId),
    })),
  };
}

export async function getConversationParticipants(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      author: { select: { id: true, name: true, email: true, profileImage: true } },
      comments: {
        select: {
          author: { select: { id: true, name: true, email: true, profileImage: true } },
        },
      },
    },
  });

  if (!post) return [];

  // Deduplicate participants
  const participantMap = new Map<string, { id: string; name: string | null; email: string; profileImage: string | null }>();
  participantMap.set(post.author.id, post.author);
  for (const comment of post.comments) {
    if (!participantMap.has(comment.author.id)) {
      participantMap.set(comment.author.id, comment.author);
    }
  }
  return Array.from(participantMap.values());
}
