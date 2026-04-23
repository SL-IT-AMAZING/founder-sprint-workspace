"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { unstable_cache } from "next/cache";

export async function getPostById(postId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  return unstable_cache(
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
          bookmarks: { where: { userId: user.id }, select: { id: true } },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
    [`post-detail-${postId}`],
    { revalidate: 30, tags: [`post-${postId}`] }
  )();
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
