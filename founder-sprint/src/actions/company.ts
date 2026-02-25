"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { ActionResult } from "@/types";

const CompanyInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less"),
  slug: z.string().max(200, "Slug must be 200 characters or less").optional(),
  description: z.string().optional(),
  website: z.string().max(500, "Website must be 500 characters or less").optional(),
  industry: z.string().max(100, "Industry must be 100 characters or less").optional(),
  hqLocation: z.string().max(200, "HQ location must be 200 characters or less").optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),
  logoUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const CompanyMemberInputSchema = z.object({
  companyId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
});

function normalizeOptionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseTags(formData: FormData): string[] {
  const directTags = formData
    .getAll("tags")
    .filter((entry): entry is string => typeof entry === "string")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  if (directTags.length > 0) return [...new Set(directTags)];

  const csvTags = normalizeOptionalString(formData.get("tags"));
  if (!csvTags) return [];

  return [...new Set(csvTags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0))];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireAdminUser(): Promise<
  ActionResult<never> | { success: true; user: Awaited<ReturnType<typeof getCurrentUser>> }
> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (!isAdmin(user.role)) return { success: false, error: "Not authorized" };
  return { success: true, user };
}

function parseCompanyInput(formData: FormData) {
  const foundedYearRaw = normalizeOptionalString(formData.get("foundedYear"));
  return CompanyInputSchema.safeParse({
    name: formData.get("name"),
    slug: normalizeOptionalString(formData.get("slug")),
    description: normalizeOptionalString(formData.get("description")),
    website: normalizeOptionalString(formData.get("website")),
    industry: normalizeOptionalString(formData.get("industry")),
    hqLocation: normalizeOptionalString(formData.get("hqLocation")),
    foundedYear: foundedYearRaw ? Number(foundedYearRaw) : undefined,
    logoUrl: normalizeOptionalString(formData.get("logoUrl")),
    tags: parseTags(formData),
  });
}

export async function getCompanyBySlug(slug: string): Promise<ActionResult<{
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
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    id: string;
    role: string | null;
    title: string | null;
    isCurrent: boolean;
    startDate: Date | null;
    endDate: Date | null;
    user: {
      id: string;
      name: string | null;
      profileImage: string | null;
      jobTitle: string | null;
      headline: string | null;
    };
  }>;
}>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              jobTitle: true,
              headline: true,
            },
          },
        },
        orderBy: [{ isCurrent: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!company) return { success: false, error: "Company not found" };

  return { success: true, data: company };
}

export async function createCompany(formData: FormData): Promise<ActionResult<{
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
}>> {
  const auth = await requireAdminUser();
  if (!auth.success) return auth;

  const parsed = parseCompanyInput(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const finalSlug = slugify(parsed.data.slug || parsed.data.name);
  if (!finalSlug) {
    return { success: false, error: "Slug is required" };
  }

  const existing = await prisma.company.findUnique({ where: { slug: finalSlug }, select: { id: true } });
  if (existing) {
    return { success: false, error: "Company slug already exists" };
  }

  const company = await prisma.company.create({
    data: {
      name: parsed.data.name,
      slug: finalSlug,
      description: parsed.data.description || null,
      website: parsed.data.website || null,
      industry: parsed.data.industry || null,
      hqLocation: parsed.data.hqLocation || null,
      foundedYear: parsed.data.foundedYear || null,
      logoUrl: parsed.data.logoUrl || null,
      tags: parsed.data.tags,
    },
  });

  revalidatePath("/companies");
  revalidatePath("/admin/companies");

  return { success: true, data: company };
}

export async function updateCompany(
  id: string,
  formData: FormData
): Promise<ActionResult<{
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
}>> {
  const auth = await requireAdminUser();
  if (!auth.success) return auth;

  const existingCompany = await prisma.company.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!existingCompany) return { success: false, error: "Company not found" };

  const parsed = parseCompanyInput(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const finalSlug = slugify(parsed.data.slug || parsed.data.name);
  if (!finalSlug) {
    return { success: false, error: "Slug is required" };
  }

  const slugConflict = await prisma.company.findFirst({
    where: {
      slug: finalSlug,
      id: { not: id },
    },
    select: { id: true },
  });

  if (slugConflict) {
    return { success: false, error: "Company slug already exists" };
  }

  const company = await prisma.company.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: finalSlug,
      description: parsed.data.description || null,
      website: parsed.data.website || null,
      industry: parsed.data.industry || null,
      hqLocation: parsed.data.hqLocation || null,
      foundedYear: parsed.data.foundedYear || null,
      logoUrl: parsed.data.logoUrl || null,
      tags: parsed.data.tags,
    },
  });

  revalidatePath("/companies");
  revalidatePath(`/companies/${existingCompany.slug}`);
  revalidatePath(`/companies/${company.slug}`);
  revalidatePath("/admin/companies");

  return { success: true, data: company };
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.success) return auth;

  const existingCompany = await prisma.company.findUnique({ where: { id }, select: { slug: true } });
  if (!existingCompany) return { success: false, error: "Company not found" };

  await prisma.company.delete({ where: { id } });

  revalidatePath("/companies");
  revalidatePath(`/companies/${existingCompany.slug}`);
  revalidatePath("/admin/companies");

  return { success: true, data: undefined };
}

export async function addCompanyMember(
  companyId: string,
  userId: string,
  role?: string,
  title?: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdminUser();
  if (!auth.success) return auth;

  const parsed = CompanyMemberInputSchema.safeParse({
    companyId,
    userId,
    role: role?.trim() || undefined,
    title: title?.trim() || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const [company, user, existingMembership] = await Promise.all([
    prisma.company.findUnique({
      where: { id: parsed.data.companyId },
      select: { id: true, slug: true },
    }),
    prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } }),
    prisma.companyMember.findFirst({
      where: {
        companyId: parsed.data.companyId,
        userId: parsed.data.userId,
        isCurrent: true,
      },
      select: { id: true },
    }),
  ]);

  if (!company) return { success: false, error: "Company not found" };
  if (!user) return { success: false, error: "User not found" };
  if (existingMembership) {
    return { success: false, error: "User is already an active member of this company" };
  }

  const membership = await prisma.companyMember.create({
    data: {
      companyId: parsed.data.companyId,
      userId: parsed.data.userId,
      role: parsed.data.role || null,
      title: parsed.data.title || null,
      isCurrent: true,
    },
    select: { id: true },
  });

  revalidatePath("/companies");
  revalidatePath(`/companies/${company.slug}`);
  revalidatePath("/admin/companies");

  return { success: true, data: membership };
}

export async function removeCompanyMember(id: string): Promise<ActionResult> {
  const auth = await requireAdminUser();
  if (!auth.success) return auth;

  const membership = await prisma.companyMember.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!membership) return { success: false, error: "Company member not found" };

  await prisma.companyMember.delete({ where: { id } });

  revalidatePath("/companies");
  revalidatePath(`/companies/${membership.company.slug}`);
  revalidatePath("/admin/companies");

  return { success: true, data: undefined };
}

export async function getRelatedCompanies(
  companyId: string,
  limit: number = 5
): Promise<ActionResult<Array<{
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  logoUrl: string | null;
  description: string | null;
  memberCount: number;
}>>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const normalizedLimit = Math.max(1, Math.min(limit, 20));

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      industry: true,
      members: {
        select: {
          user: {
            select: {
              userBatches: {
                where: { status: "active" },
                select: { batchId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!company) return { success: false, error: "Company not found" };

  const batchIds = new Set<string>();
  for (const member of company.members) {
    for (const userBatch of member.user.userBatches) {
      batchIds.add(userBatch.batchId);
    }
  }

  const relatedConditions: Prisma.CompanyWhereInput[] = [];

  if (company.industry) {
    relatedConditions.push({ industry: company.industry });
  }

  if (batchIds.size > 0) {
    relatedConditions.push({
      members: {
        some: {
          user: {
            userBatches: {
              some: {
                batchId: { in: [...batchIds] },
                status: "active",
              },
            },
          },
        },
      },
    });
  }

  if (relatedConditions.length === 0) {
    return { success: true, data: [] };
  }

  const related = await prisma.company.findMany({
    where: {
      id: { not: companyId },
      OR: relatedConditions,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
      logoUrl: true,
      description: true,
      _count: { select: { members: true } },
    },
    orderBy: [{ name: "asc" }],
    take: normalizedLimit,
  });

  return {
    success: true,
    data: related.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      industry: item.industry,
      logoUrl: item.logoUrl,
      description: item.description,
      memberCount: item._count.members,
    })),
  };
}
