"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";

export interface SearchResult {
  id: string;
  content: string;
  headline: string;
  authorName: string;
  authorProfileImage: string | null;
  createdAt: Date;
  rank: number;
}

// FTS with tsvector → falls back to ILIKE if search_vector column not yet migrated
export async function searchPosts(
  query: string,
  batchId: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  if (!isAdmin(user.role) && user.batchId !== batchId) return [];

  const trimmedQuery = query.trim();
  if (!trimmedQuery || trimmedQuery.length < 2) return [];


  try {
    const results = await prisma.$queryRaw<SearchResult[]>`
      SELECT
        p.id,
        p.content,
        ts_headline(
          'english',
          p.content,
          plainto_tsquery('english', ${trimmedQuery}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15, MaxFragments=1'
        ) as headline,
        u.name as "authorName",
        u.profile_image as "authorProfileImage",
        p.created_at as "createdAt",
        ts_rank(p.search_vector, plainto_tsquery('english', ${trimmedQuery})) as rank
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.batch_id = ${batchId}::uuid
        AND p.is_hidden = false
        AND p.search_vector @@ plainto_tsquery('english', ${trimmedQuery})
      ORDER BY rank DESC, p.created_at DESC
      LIMIT ${limit}
    `;
    return results;
  } catch {

    const results = await prisma.$queryRaw<SearchResult[]>`
      SELECT
        p.id,
        p.content,
        p.content as headline,
        u.name as "authorName",
        u.profile_image as "authorProfileImage",
        p.created_at as "createdAt",
        1.0 as rank
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.batch_id = ${batchId}::uuid
        AND p.is_hidden = false
        AND p.content ILIKE ${'%' + trimmedQuery + '%'}
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `;
    return results;
  }
}


export async function searchUsers(
  query: string,
  batchId: string,
  limit: number = 5
): Promise<Array<{ id: string; name: string; profileImage: string | null; headline: string | null; jobTitle: string | null; company: string | null }>> {
  const user = await getCurrentUser();
  if (!user) return [];
  if (!isAdmin(user.role) && user.batchId !== batchId) return [];

  const trimmedQuery = query.trim();
  if (!trimmedQuery || trimmedQuery.length < 2) return [];

  type UserSearchRow = {
    id: string;
    name: string | null;
    profileImage: string | null;
    headline: string | null;
    jobTitle: string | null;
    company: string | null;
    rank: number;
  };

  try {
    const results = await prisma.$queryRaw<UserSearchRow[]>`
      SELECT
        u.id,
        u.name,
        u.profile_image as "profileImage",
        u.headline,
        u.job_title as "jobTitle",
        u.company,
        ts_rank(u.search_vector, plainto_tsquery('english', ${trimmedQuery})) as rank
      FROM users u
      JOIN user_batches ub ON ub.user_id = u.id
      WHERE ub.batch_id = ${batchId}::uuid
        AND ub.status = 'active'
        AND u.search_vector @@ plainto_tsquery('english', ${trimmedQuery})
      ORDER BY rank DESC, u.name ASC
      LIMIT ${limit}
    `;

    return results.map((u) => ({
      id: u.id,
      name: u.name || "Unknown",
      profileImage: u.profileImage,
      headline: u.headline,
      jobTitle: u.jobTitle,
      company: u.company,
    }));
  } catch {
    const results = await prisma.user.findMany({
      where: {
        userBatches: {
          some: {
            batchId,
            status: "active",
          },
        },
        name: {
          contains: trimmedQuery,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
        headline: true,
        jobTitle: true,
        company: true,
      },
      take: limit,
    });

    return results.map((u) => ({
      id: u.id,
      name: u.name || "Unknown",
      profileImage: u.profileImage,
      headline: u.headline,
      jobTitle: u.jobTitle,
      company: u.company,
    }));
  }
}

export async function searchCompanies(
  query: string,
  limit: number = 5
): Promise<Array<{ id: string; name: string; slug: string; description: string | null; industry: string | null; logoUrl: string | null; memberCount: number }>> {
  const user = await getCurrentUser();
  if (!user) return [];

  const trimmedQuery = query.trim();
  if (!trimmedQuery || trimmedQuery.length < 2) return [];

  type CompanySearchRow = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    industry: string | null;
    logoUrl: string | null;
    memberCount: bigint;
    rank: number;
  };

  try {
    const results = await prisma.$queryRaw<CompanySearchRow[]>`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.industry,
        c.logo_url as "logoUrl",
        COUNT(DISTINCT cm.user_id) as "memberCount",
        ts_rank(c.search_vector, plainto_tsquery('english', ${trimmedQuery})) as rank
      FROM companies c
      LEFT JOIN company_members cm ON cm.company_id = c.id
      WHERE c.search_vector @@ plainto_tsquery('english', ${trimmedQuery})
      GROUP BY c.id, c.name, c.slug, c.description, c.industry, c.logo_url, c.search_vector
      ORDER BY rank DESC, c.name ASC
      LIMIT ${limit}
    `;

    return results.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      industry: c.industry,
      logoUrl: c.logoUrl,
      memberCount: Number(c.memberCount),
    }));
  } catch {
    const results = await prisma.company.findMany({
      where: {
        name: {
          contains: trimmedQuery,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        industry: true,
        logoUrl: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
    });

    return results.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      industry: c.industry,
      logoUrl: c.logoUrl,
      memberCount: c._count.members,
    }));
  }
}
