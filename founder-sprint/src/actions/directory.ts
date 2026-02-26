"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import type { ActionResult, UserRole } from "@/types";

interface GetBatchMembersParams {
  batchId: string;
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

interface GetCompaniesDirectoryParams {
  batchId?: string;
  industry?: string;
  search?: string;
  page?: number;
  limit?: number;
}

async function canAccessBatch(batchId: string, userId: string, role: UserRole): Promise<boolean> {
  if (isAdmin(role)) return true;

  const membership = await prisma.userBatch.findFirst({
    where: {
      userId,
      batchId,
      status: "active",
    },
    select: { id: true },
  });

  return !!membership;
}

export async function getBatchMembers(
  params: GetBatchMembersParams
): Promise<ActionResult<{
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    jobTitle: string | null;
    company: string | null;
    headline: string | null;
    followerCount: number;
    role: UserRole;
  }>;
  total: number;
  hasMore: boolean;
}>> {
  const viewer = await getCurrentUser();
  if (!viewer) return { success: false, error: "Not authenticated" };

  const canView = await canAccessBatch(params.batchId, viewer.id, viewer.role);
  if (!canView) return { success: false, error: "Not authorized" };

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(params.limit ?? 20, 100));
  const skip = (page - 1) * limit;

  const where = {
    batchId: params.batchId,
    status: "active" as const,
    ...(params.role ? { role: params.role } : {}),
    ...(params.search
      ? {
          user: {
            name: {
              contains: params.search,
              mode: "insensitive" as const,
            },
          },
        }
      : {}),
  };

  const [members, total] = await Promise.all([
    prisma.userBatch.findMany({
      where,
      select: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            jobTitle: true,
            company: true,
            headline: true,
            followerCount: true,
          },
        },
      },
      orderBy: [
        { user: { followerCount: "desc" } },
        { user: { name: "asc" } },
      ],
      skip,
      take: limit,
    }),
    prisma.userBatch.count({ where }),
  ]);

  return {
    success: true,
    data: {
      users: members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        profileImage: member.user.profileImage,
        jobTitle: member.user.jobTitle,
        company: member.user.company,
        headline: member.user.headline,
        followerCount: member.user.followerCount,
        role: member.role,
      })),
      total,
      hasMore: skip + members.length < total,
    },
  };
}

interface GetAllMembersParams {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

export async function getAllMembers(
  params: GetAllMembersParams
): Promise<ActionResult<{
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    jobTitle: string | null;
    company: string | null;
    headline: string | null;
    followerCount: number;
    role: UserRole;
    batchName: string | null;
  }>;
  total: number;
  hasMore: boolean;
}>> {
  const viewer = await getCurrentUser();
  if (!viewer) return { success: false, error: "Not authenticated" };

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(params.limit ?? 20, 100));
  const skip = (page - 1) * limit;

  const where = {
    status: "active" as const,
    ...(params.role ? { role: params.role } : {}),
    ...(params.search
      ? {
          user: {
            name: {
              contains: params.search,
              mode: "insensitive" as const,
            },
          },
        }
      : {}),
  };

  const [members, total] = await Promise.all([
    prisma.userBatch.findMany({
      where,
      select: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            jobTitle: true,
            company: true,
            headline: true,
            followerCount: true,
          },
        },
        batch: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { user: { followerCount: "desc" } },
        { user: { name: "asc" } },
      ],
      skip,
      take: limit,
    }),
    prisma.userBatch.count({ where }),
  ]);

  // Deduplicate users who appear in multiple batches
  // Keep first occurrence (sorted by followerCount desc, so highest first)
  const seenUserIds = new Set<string>();
  const dedupedUsers = members
    .filter((member) => {
      if (seenUserIds.has(member.user.id)) return false;
      seenUserIds.add(member.user.id);
      return true;
    })
    .map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      profileImage: member.user.profileImage,
      jobTitle: member.user.jobTitle,
      company: member.user.company,
      headline: member.user.headline,
      followerCount: member.user.followerCount,
      role: member.role,
      batchName: member.batch.name,
    }));

  return {
    success: true,
    data: {
      users: dedupedUsers,
      total,
      hasMore: skip + dedupedUsers.length < total,
    },
  };
}

export async function getAllMemberStats(): Promise<ActionResult<{
  total: number;
  founders: number;
  coFounders: number;
  mentors: number;
  admins: number;
}>> {
  const viewer = await getCurrentUser();
  if (!viewer) return { success: false, error: "Not authenticated" };

  const [total, founders, coFounders, mentors, admins] = await Promise.all([
    prisma.userBatch.count({
      where: { status: "active" },
    }),
    prisma.userBatch.count({
      where: { status: "active", role: "founder" },
    }),
    prisma.userBatch.count({
      where: { status: "active", role: "co_founder" },
    }),
    prisma.userBatch.count({
      where: { status: "active", role: "mentor" },
    }),
    prisma.userBatch.count({
      where: {
        status: "active",
        role: { in: ["admin", "super_admin"] },
      },
    }),
  ]);

  return {
    success: true,
    data: {
      total,
      founders,
      coFounders,
      mentors,
      admins,
    },
  };
}

export async function getBatchMemberStats(
  batchId: string
): Promise<ActionResult<{
  total: number;
  founders: number;
  coFounders: number;
  mentors: number;
  admins: number;
}>> {
  const viewer = await getCurrentUser();
  if (!viewer) return { success: false, error: "Not authenticated" };

  const canView = await canAccessBatch(batchId, viewer.id, viewer.role);
  if (!canView) return { success: false, error: "Not authorized" };

  const [total, founders, coFounders, mentors, admins] = await Promise.all([
    prisma.userBatch.count({
      where: { batchId, status: "active" },
    }),
    prisma.userBatch.count({
      where: { batchId, status: "active", role: "founder" },
    }),
    prisma.userBatch.count({
      where: { batchId, status: "active", role: "co_founder" },
    }),
    prisma.userBatch.count({
      where: { batchId, status: "active", role: "mentor" },
    }),
    prisma.userBatch.count({
      where: {
        batchId,
        status: "active",
        role: { in: ["admin", "super_admin"] },
      },
    }),
  ]);

  return {
    success: true,
    data: {
      total,
      founders,
      coFounders,
      mentors,
      admins,
    },
  };
}

export async function getCompaniesDirectory(
  params: GetCompaniesDirectoryParams
): Promise<ActionResult<{
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    website: string | null;
    industry: string | null;
    hqLocation: string | null;
    foundedYear: number | null;
    logoUrl: string | null;
    tags: string[];
    memberCount: number;
    memberAvatars: Array<string | null>;
  }>;
  total: number;
  hasMore: boolean;
}>> {
  const viewer = await getCurrentUser();
  if (!viewer) return { success: false, error: "Not authenticated" };

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(params.limit ?? 20, 100));
  const skip = (page - 1) * limit;

  const where = {
    ...(params.industry ? { industry: params.industry } : {}),
    ...(params.search
      ? {
          name: {
            contains: params.search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(params.batchId
      ? {
          members: {
            some: {
              user: {
                userBatches: {
                  some: {
                    batchId: params.batchId,
                    status: "active" as const,
                  },
                },
              },
            },
          },
        }
      : {}),
  };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        website: true,
        industry: true,
        hqLocation: true,
        foundedYear: true,
        logoUrl: true,
        tags: true,
        _count: { select: { members: true } },
        members: {
          select: {
            user: {
              select: {
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 3,
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  return {
    success: true,
    data: {
      companies: companies.map((company) => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        description: company.description,
        website: company.website,
        industry: company.industry,
        hqLocation: company.hqLocation,
        foundedYear: company.foundedYear,
        logoUrl: company.logoUrl,
        tags: company.tags,
        memberCount: company._count.members,
        memberAvatars: company.members.map((member) => member.user.profileImage),
      })),
      total,
      hasMore: skip + companies.length < total,
    },
  };
}
