"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin, isFounder } from "@/lib/permissions";
import { requireCompanyManager } from "@/lib/company-permissions";
import { revalidatePath, revalidateTag as revalidateTagBase } from "next/cache";
const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");
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
        where: { isCurrent: true },
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
        orderBy: { createdAt: "asc" },
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

  // Handle batch assignments
  const batchIdsRaw = formData.get("batchIds") as string | null;
  if (batchIdsRaw) {
    const batchIds = batchIdsRaw.split(",").filter(Boolean);
    if (batchIds.length > 0) {
      await prisma.companyBatch.createMany({
        data: batchIds.map((batchId) => ({
          companyId: company.id,
          batchId,
        })),
        skipDuplicates: true,
      });
    }
  }

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
  const auth = await requireCompanyManager(id);
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


  // Sync batch assignments (delete all, re-create)
  const batchIdsRaw = formData.get("batchIds") as string | null;
  if (auth.isAdmin && batchIdsRaw !== null) {
    await prisma.companyBatch.deleteMany({ where: { companyId: id } });
    if (batchIdsRaw) {
      const batchIds = batchIdsRaw.split(",").filter(Boolean);
      if (batchIds.length > 0) {
        await prisma.companyBatch.createMany({
          data: batchIds.map((batchId) => ({
            companyId: id,
            batchId,
          })),
          skipDuplicates: true,
        });
      }
    }
  }
  revalidatePath("/companies");
  revalidatePath(`/companies/${existingCompany.slug}`);
  revalidatePath(`/companies/${existingCompany.slug}/manage`);
  revalidatePath(`/companies/${company.slug}`);
  revalidatePath(`/companies/${company.slug}/manage`);
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
  revalidatePath(`/companies/${existingCompany.slug}/manage`);
  revalidatePath("/admin/companies");

  return { success: true, data: undefined };
}

export async function addCompanyMember(
  companyId: string,
  userId: string,
  role?: string,
  title?: string
): Promise<ActionResult<{ id: string }>> {
  const parsed = CompanyMemberInputSchema.safeParse({
    companyId,
    userId,
    role: role?.trim() || undefined,
    title: title?.trim() || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const auth = await requireAdminUser();
  if (!auth.success) return auth;

  const [company, user, existingMembership] = await Promise.all([
    prisma.company.findUnique({
      where: { id: parsed.data.companyId },
      select: { id: true, slug: true, name: true },
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

  // Sync User.company from CompanyMember
  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { company: company!.name },
  });

  revalidatePath("/companies");
  revalidatePath(`/companies/${company.slug}`);
  revalidatePath(`/companies/${company.slug}/manage`);
  revalidatePath("/admin/companies");

  return { success: true, data: membership };
}

export async function removeCompanyMember(id: string): Promise<ActionResult> {
  const membership = await prisma.companyMember.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          slug: true,
          name: true,
        },
      },
    },
  });
  if (!membership) return { success: false, error: "Company member not found" };

  const auth = await requireAdminUser();
  if (!auth.success) return auth;

  await prisma.companyMember.delete({ where: { id } });

  // Sync User.company — set to next active membership's company or null
  const nextMembership = await prisma.companyMember.findFirst({
    where: { userId: membership.userId, isCurrent: true },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  await prisma.user.update({
    where: { id: membership.userId },
    data: { company: nextMembership?.company.name || null },
  });

  revalidatePath("/companies");
  revalidatePath(`/companies/${membership.company.slug}`);
  revalidatePath(`/companies/${membership.company.slug}/manage`);
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
        where: { isCurrent: true },
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
          isCurrent: true,
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
      _count: { select: { members: { where: { isCurrent: true } } } },
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

export async function getCompaniesForSelect(): Promise<Array<{
  id: string;
  name: string;
  _count: { members: number };
}>> {
  const user = await getCurrentUser();
  if (!user) return [];
  if (!isAdmin(user.role)) return [];

  return prisma.company.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { members: { where: { isCurrent: true } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCompaniesForBatch(batchId?: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.company.findMany({
    where: batchId
      ? {
          batches: {
            some: { batchId },
          },
        }
      : undefined,
    select: {
      id: true,
      name: true,
      _count: { select: { members: { where: { isCurrent: true } } } },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Get the company IDs a user belongs to (for founder visibility filtering).
 */
export async function getUserCompanyIds(userId: string): Promise<string[]> {
  const memberships = await prisma.companyMember.findMany({
    where: { userId, isCurrent: true },
    select: { companyId: true },
  });
  return memberships.map((m) => m.companyId);
}


const CreateCompanyLeaveRequestSchema = z.object({
  currentCompanyId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  note: z.string().max(1000).optional(),
});

const CreateNewCompanyRequestSchema = z.object({
  currentCompanyId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  requestedCompanyName: z.string().min(1).max(200),
  requestedDescription: z.string().max(2000).optional(),
  note: z.string().max(1000).optional(),
});

const ResolveCompanyRequestSchema = z.object({
  requestId: z.string().uuid(),
  resolutionType: z.enum(["promote_one", "convert_all"]).optional(),
  promotedUserId: z.string().uuid().optional(),
  reason: z.string().max(1000).optional(),
});

async function syncUserCompanyName(userId: string) {
  const nextMembership = await prisma.companyMember.findFirst({
    where: { userId, isCurrent: true },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { company: nextMembership?.company.name || null },
  });
}

async function getAdminNotificationUserIds(batchId?: string | null) {
  const [globalAdmins, batchAdmins] = await Promise.all([
    prisma.user.findMany({
      where: { status: "active", role: { in: ["super_admin", "admin"] } },
      select: { id: true },
    }),
    batchId
      ? prisma.userBatch.findMany({
          where: {
            batchId,
            status: "active",
            OR: [
              { role: { in: ["super_admin", "admin"] } },
              { additionalRoles: { has: "admin" } },
            ],
          },
          select: { userId: true },
        })
      : Promise.resolve([]),
  ]);
  return Array.from(new Set([
    ...globalAdmins.map((u) => u.id),
    ...batchAdmins.map((u) => u.userId),
  ]));
}

async function createAdminNotifications(userIds: string[], type: string, entityId: string, title: string, message: string) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ type, userId, entityId, title, message })),
  });
}

export async function createCompanyLeaveRequest(input: { currentCompanyId: string; batchId?: string; note?: string }): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (!isFounder(user.role)) return { success: false, error: "Only founders can request company changes" };

  const parsed = CreateCompanyLeaveRequestSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };

  const membership = await prisma.companyMember.findFirst({
    where: { companyId: parsed.data.currentCompanyId, userId: user.id, isCurrent: true },
    include: { company: { select: { name: true } } },
  });
  if (!membership) return { success: false, error: "Current company membership not found" };

  const duplicate = await prisma.companyChangeRequest.findFirst({
    where: {
      userId: user.id,
      currentCompanyId: parsed.data.currentCompanyId,
      targetType: "leave_company",
      status: "pending",
    },
    select: { id: true },
  });
  if (duplicate) return { success: false, error: "A leave-company request is already pending" };

  const dependentCoFounders = user.role === "founder" && parsed.data.batchId
    ? await prisma.userBatch.findMany({
        where: { batchId: parsed.data.batchId, founderId: user.id, status: "active", role: "co_founder" },
        select: { userId: true },
      })
    : [];

  const request = await prisma.companyChangeRequest.create({
    data: {
      userId: user.id,
      batchId: parsed.data.batchId || null,
      currentCompanyId: parsed.data.currentCompanyId,
      targetType: "leave_company",
      note: parsed.data.note || null,
      hasDependentCoFounders: dependentCoFounders.length > 0,
      resolutionType: dependentCoFounders.length > 0 ? "manual_review" : null,
    },
    select: { id: true },
  });

  const adminUserIds = await getAdminNotificationUserIds(parsed.data.batchId);
  await createAdminNotifications(
    adminUserIds,
    dependentCoFounders.length > 0 ? "company_request_founder_restructure" : "company_request_leave",
    request.id,
    dependentCoFounders.length > 0 ? "Founder departure needs review" : "Company leave request",
    dependentCoFounders.length > 0
      ? `${user.name || user.email} requested to leave ${membership.company.name}, but co-founders remain.`
      : `${user.name || user.email} requested to leave ${membership.company.name}.`
  );

  revalidatePath("/settings");
  revalidatePath("/admin/companies");
  return { success: true, data: request };
}

export async function createNewCompanyRequest(input: { currentCompanyId?: string; batchId?: string; requestedCompanyName: string; requestedDescription?: string; note?: string }): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (!isFounder(user.role)) return { success: false, error: "Only founders can request company changes" };

  const parsed = CreateNewCompanyRequestSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };

  const duplicate = await prisma.companyChangeRequest.findFirst({
    where: {
      userId: user.id,
      targetType: "new_company",
      status: "pending",
    },
    select: { id: true },
  });
  if (duplicate) return { success: false, error: "A new-company request is already pending" };

  const request = await prisma.companyChangeRequest.create({
    data: {
      userId: user.id,
      batchId: parsed.data.batchId || null,
      currentCompanyId: parsed.data.currentCompanyId || null,
      targetType: "new_company",
      requestedCompanyName: parsed.data.requestedCompanyName,
      requestedDescription: parsed.data.requestedDescription || null,
      note: parsed.data.note || null,
    },
    select: { id: true },
  });

  const adminUserIds = await getAdminNotificationUserIds(parsed.data.batchId);
  await createAdminNotifications(
    adminUserIds,
    "company_request_new",
    request.id,
    "New company request",
    `${user.name || user.email} requested a new company: ${parsed.data.requestedCompanyName}`
  );

  revalidatePath("/settings");
  revalidatePath("/admin/companies");
  return { success: true, data: request };
}

export async function getMyCompanyChangeRequests(): Promise<ActionResult<Array<{
  id: string;
  targetType: string;
  requestedCompanyName: string | null;
  status: string;
  hasDependentCoFounders: boolean;
  createdAt: Date;
}>>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const requests = await prisma.companyChangeRequest.findMany({
    where: { userId: user.id },
    select: { id: true, targetType: true, requestedCompanyName: true, status: true, hasDependentCoFounders: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return { success: true, data: requests };
}

export async function getCompanyChangeRequestsForAdmin(): Promise<ActionResult<Array<{
  id: string;
  targetType: string;
  status: string;
  requestedCompanyName: string | null;
  requestedDescription: string | null;
  note: string | null;
  hasDependentCoFounders: boolean;
  resolutionType: string | null;
  createdAt: Date;
  requester: { id: string; name: string | null; email: string; };
  batch: { id: string; name: string; } | null;
  currentCompany: { id: string; name: string; } | null;
  dependentCoFounders: Array<{ id: string; name: string | null; email: string }>;
}>>> {
  const auth = await requireAdminUser();
  if (!auth.success) return auth;

  const requests = await prisma.companyChangeRequest.findMany({
    where: { status: "pending" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      batch: { select: { id: true, name: true } },
      currentCompany: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const data = [];
  for (const request of requests) {
    const dependentCoFounders = request.targetType === "leave_company" && request.hasDependentCoFounders && request.batchId
      ? await prisma.userBatch.findMany({
          where: { batchId: request.batchId, founderId: request.userId, status: "active", role: "co_founder" },
          include: { user: { select: { id: true, name: true, email: true } } },
        }).then((rows) => rows.map((row) => ({ id: row.user.id, name: row.user.name, email: row.user.email })))
      : [];

    data.push({
      id: request.id,
      targetType: request.targetType,
      status: request.status,
      requestedCompanyName: request.requestedCompanyName,
      requestedDescription: request.requestedDescription,
      note: request.note,
      hasDependentCoFounders: request.hasDependentCoFounders,
      resolutionType: request.resolutionType,
      createdAt: request.createdAt,
      requester: request.user,
      batch: request.batch,
      currentCompany: request.currentCompany,
      dependentCoFounders,
    });
  }

  return { success: true, data };
}

export async function cancelCompanyChangeRequest(requestId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const request = await prisma.companyChangeRequest.findFirst({ where: { id: requestId, userId: user.id, status: "pending" }, select: { id: true } });
  if (!request) return { success: false, error: "Pending request not found" };
  await prisma.companyChangeRequest.update({ where: { id: requestId }, data: { status: "cancelled" } });
  revalidatePath('/settings');
  revalidatePath('/admin/companies');
  return { success: true, data: undefined };
}

export async function rejectCompanyChangeRequest(input: { requestId: string; reason?: string }): Promise<ActionResult> {
  const adminUser = await getCurrentUser();
  if (!adminUser) return { success: false, error: "Not authenticated" };
  if (!isAdmin(adminUser.role)) return { success: false, error: "Not authorized" };
  const parsed = ResolveCompanyRequestSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  const request = await prisma.companyChangeRequest.findUnique({ where: { id: parsed.data.requestId }, include: { user: { select: { id: true } } } });
  if (!request || request.status !== 'pending') return { success: false, error: 'Pending request not found' };
  await prisma.companyChangeRequest.update({ where: { id: request.id }, data: { status: 'rejected', reviewedById: adminUser.id, reviewedAt: new Date(), note: parsed.data.reason || request.note } });
  await prisma.notification.create({ data: { type: 'company_request_rejected', userId: request.user.id, entityId: request.id, title: 'Company request rejected', message: parsed.data.reason || 'Your company request was rejected.' } });
  revalidatePath('/admin/companies');
  revalidatePath('/settings');
  return { success: true, data: undefined };
}

export async function approveCompanyChangeRequest(input: { requestId: string; resolutionType?: 'promote_one' | 'convert_all'; promotedUserId?: string }): Promise<ActionResult> {
  const adminUser = await getCurrentUser();
  if (!adminUser) return { success: false, error: "Not authenticated" };
  if (!isAdmin(adminUser.role)) return { success: false, error: "Not authorized" };
  const parsed = ResolveCompanyRequestSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  const request = await prisma.companyChangeRequest.findUnique({ where: { id: parsed.data.requestId }, include: { user: { select: { id: true, name: true } } } });
  if (!request || request.status !== 'pending') return { success: false, error: 'Pending request not found' };

  if (request.targetType === 'leave_company') {
    if (!request.currentCompanyId) return { success: false, error: 'Current company missing' };
    if (request.hasDependentCoFounders && !parsed.data.resolutionType) {
      return { success: false, error: 'Resolution is required before approving this founder departure' };
    }

    const currentMembership = await prisma.companyMember.findFirst({ where: { companyId: request.currentCompanyId, userId: request.userId, isCurrent: true }, select: { id: true } });
    if (currentMembership) {
      await prisma.companyMember.update({ where: { id: currentMembership.id }, data: { isCurrent: false, endDate: new Date() } });
    }

    if (request.batchId) {
      const requesterBatchMembership = await prisma.userBatch.findFirst({ where: { userId: request.userId, batchId: request.batchId, status: 'active' } });
      if (requesterBatchMembership?.role === 'co_founder') {
        await prisma.userBatch.update({ where: { id: requesterBatchMembership.id }, data: { role: 'founder', founderId: null } });
      }

      if (requesterBatchMembership?.role === 'founder' && request.hasDependentCoFounders) {
        const dependents = await prisma.userBatch.findMany({ where: { batchId: request.batchId, founderId: request.userId, status: 'active', role: 'co_founder' } });
        if (parsed.data.resolutionType === 'promote_one') {
          if (!parsed.data.promotedUserId) return { success: false, error: 'Select a co-founder to promote' };
          const promoted = dependents.find((dep) => dep.userId === parsed.data.promotedUserId);
          if (!promoted) return { success: false, error: 'Selected co-founder not found' };
          await prisma.userBatch.update({ where: { id: promoted.id }, data: { role: 'founder', founderId: null } });
          const remainingIds = dependents.filter((dep) => dep.userId !== parsed.data.promotedUserId).map((dep) => dep.id);
          if (remainingIds.length) {
            await prisma.userBatch.updateMany({ where: { id: { in: remainingIds } }, data: { founderId: parsed.data.promotedUserId } });
          }
        } else if (parsed.data.resolutionType === 'convert_all') {
          await prisma.userBatch.updateMany({ where: { id: { in: dependents.map((dep) => dep.id) } }, data: { role: 'founder', founderId: null } });
        }
      }
    }

    await syncUserCompanyName(request.userId);
  }

  if (request.targetType === 'new_company') {
    if (!request.requestedCompanyName) return { success: false, error: 'Requested company name missing' };
    const slug = request.requestedCompanyName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const existing = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
    if (existing) return { success: false, error: 'Company slug already exists' };

    if (request.currentCompanyId) {
      await prisma.companyMember.updateMany({ where: { companyId: request.currentCompanyId, userId: request.userId, isCurrent: true }, data: { isCurrent: false, endDate: new Date() } });
    }

    const company = await prisma.company.create({ data: { name: request.requestedCompanyName, slug, description: request.requestedDescription || null } });
    if (request.batchId) {
      await prisma.companyBatch.create({ data: { companyId: company.id, batchId: request.batchId } });
    }
    await prisma.companyMember.create({ data: { companyId: company.id, userId: request.userId, isCurrent: true } });
    if (request.batchId) {
      const requesterBatchMembership = await prisma.userBatch.findFirst({ where: { userId: request.userId, batchId: request.batchId, status: 'active' } });
      if (requesterBatchMembership?.role === 'co_founder') {
        await prisma.userBatch.update({ where: { id: requesterBatchMembership.id }, data: { role: 'founder', founderId: null } });
      }
    }
    await syncUserCompanyName(request.userId);
  }

  await prisma.companyChangeRequest.update({ where: { id: request.id }, data: { status: 'approved', reviewedById: adminUser.id, reviewedAt: new Date(), resolutionType: parsed.data.resolutionType || request.resolutionType, promotedUserId: parsed.data.promotedUserId || null } });
  await prisma.notification.create({ data: { type: 'company_request_approved', userId: request.userId, entityId: request.id, title: 'Company request approved', message: 'Your company request was approved.' } });
  revalidatePath('/admin/companies');
  revalidatePath('/settings');
  revalidateTag('current-user');
  return { success: true, data: undefined };
}
