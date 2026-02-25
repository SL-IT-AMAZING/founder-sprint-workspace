"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function followUser(followingId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck;

  if (user.id === followingId) {
    return { success: false, error: "Cannot follow yourself" };
  }

  try {
    await prisma.$transaction([
      prisma.userFollow.create({
        data: {
          followerId: user.id,
          followingId,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { followingCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: followingId },
        data: { followerCount: { increment: 1 } },
      }),
    ]);

    revalidatePath("/feed");
    revalidatePath(`/profile/${followingId}`);
    revalidatePath(`/profile/${user.id}`);

    return { success: true, data: undefined };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return { success: false, error: "Already following this user" };
    }
    return { success: false, error: "Failed to follow user" };
  }
}

export async function unfollowUser(followingId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck;

  try {
    const existing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId,
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Not following this user" };
    }

    await prisma.$transaction([
      prisma.userFollow.delete({
        where: { id: existing.id },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          followingCount: {
            decrement: 1,
          },
        },
      }),
      prisma.user.update({
        where: { id: followingId },
        data: {
          followerCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    revalidatePath("/feed");
    revalidatePath(`/profile/${followingId}`);
    revalidatePath(`/profile/${user.id}`);

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to unfollow user" };
  }
}

export async function checkIsFollowing(followingId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const follow = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId: user.id,
        followingId,
      },
    },
  });

  return !!follow;
}

export async function getUserFollowers(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [follows, total] = await Promise.all([
    prisma.userFollow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            headline: true,
            company: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.userFollow.count({
      where: { followingId: userId },
    }),
  ]);

  return {
    users: follows.map((f) => f.follower),
    total,
    hasMore: skip + limit < total,
  };
}

export async function getUserFollowing(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [follows, total] = await Promise.all([
    prisma.userFollow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            headline: true,
            company: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.userFollow.count({
      where: { followerId: userId },
    }),
  ]);

  return {
    users: follows.map((f) => f.following),
    total,
    hasMore: skip + limit < total,
  };
}

export async function getFollowSuggestions(
  batchId: string,
  limit: number = 5
) {
  const user = await getCurrentUser();
  if (!user) return [];

  const followingIds = await prisma.userFollow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });

  const excludeIds = [user.id, ...followingIds.map((f) => f.followingId)];

  const batchMembers = await prisma.userBatch.findMany({
    where: {
      batchId,
      status: "active",
      userId: { notIn: excludeIds },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImage: true,
          headline: true,
          company: true,
          jobTitle: true,
          followerCount: true,
        },
      },
    },
    take: limit * 2,
  });

  return batchMembers
    .map((m) => m.user)
    .sort((a, b) => b.followerCount - a.followerCount)
    .slice(0, limit);
}

export async function getFollowingIdsForUser(userId: string): Promise<string[]> {
  const follows = await prisma.userFollow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return follows.map((f) => f.followingId);
}
