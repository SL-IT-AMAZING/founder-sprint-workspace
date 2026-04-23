import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import type { UserWithBatch } from "@/types";

type ViewerContext = Pick<UserWithBatch, "id" | "role" | "userBatchIds">;

export async function getActiveBatchIdsForUser(userId: string): Promise<string[]> {
  const memberships = await prisma.userBatch.findMany({
    where: { userId, status: "active" },
    select: { batchId: true },
  });

  return memberships.map((membership) => membership.batchId);
}

function getUserMatchScore(
  user: { name: string | null; email: string },
  query: string
): number {
  const normalized = query.toLowerCase();
  const name = (user.name || "").toLowerCase();
  const email = user.email.toLowerCase();

  if (name === normalized) return 0;
  if (name.startsWith(normalized)) return 1;
  if (email.startsWith(normalized)) return 2;
  if (name.includes(normalized)) return 3;
  if (email.includes(normalized)) return 4;
  return 5;
}

export async function getAccessibleActiveUsers(
  viewer: ViewerContext,
  options: {
    query?: string;
    userIds?: string[];
    limit?: number;
    excludeSelf?: boolean;
  } = {}
) {
  const { query, userIds, limit = 10, excludeSelf = false } = options;
  const trimmedQuery = query?.trim() || "";
  const effectiveLimit = userIds && !trimmedQuery ? userIds.length : limit;

  const users = await prisma.user.findMany({
    where: {
      status: "active",
      ...(excludeSelf ? { id: { not: viewer.id } } : {}),
      ...(userIds ? { id: { in: userIds } } : {}),
      ...(isAdmin(viewer.role)
        ? {}
        : {
            userBatches: {
              some: {
                batchId: { in: viewer.userBatchIds },
                status: "active",
              },
            },
          }),
      ...(trimmedQuery
        ? {
            OR: [
              { name: { contains: trimmedQuery, mode: "insensitive" } },
              { email: { contains: trimmedQuery, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
    },
    take: trimmedQuery ? Math.max(limit * 3, limit) : effectiveLimit,
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  if (!trimmedQuery) {
    return users.slice(0, effectiveLimit);
  }

  return [...users]
    .sort((a, b) => {
      const scoreDiff = getUserMatchScore(a, trimmedQuery) - getUserMatchScore(b, trimmedQuery);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.name || a.email).localeCompare(b.name || b.email);
    })
    .slice(0, limit);
}

export async function getAccessibleActiveUserIds(
  viewer: ViewerContext,
  userIds: string[]
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const users = await getAccessibleActiveUsers(viewer, { userIds });
  return new Set(users.map((user) => user.id));
}
