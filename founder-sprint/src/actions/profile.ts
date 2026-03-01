"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { revalidatePath, revalidateTag as revalidateTagBase } from "next/cache";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");
import { z } from "zod";
import type { ActionResult } from "@/types";

const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  jobTitle: z.string().max(100, "Job title must be 100 characters or less").optional(),
  company: z.string().max(100, "Company must be 100 characters or less").optional(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  profileImage: z.string().url("Must be a valid URL").optional().nullable(),
  headline: z.string().max(200, "Headline must be 200 characters or less").optional(),
  location: z.string().max(200, "Location must be 200 characters or less").optional(),
  linkedinUrl: z
    .string()
    .url("LinkedIn URL must be a valid URL")
    .max(500, "LinkedIn URL must be 500 characters or less")
    .optional(),
  twitterUrl: z
    .string()
    .url("Twitter URL must be a valid URL")
    .max(500, "Twitter URL must be 500 characters or less")
    .optional(),
  websiteUrl: z
    .string()
    .url("Website URL must be a valid URL")
    .max(500, "Website URL must be 500 characters or less")
    .optional(),
});

const ExperienceInputSchema = z
  .object({
    company: z.string().min(1, "Company is required").max(200, "Company must be 200 characters or less"),
    title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    isCurrent: z.boolean().optional(),
    description: z.string().optional(),
    location: z.string().max(200, "Location must be 200 characters or less").optional(),
  })
  .transform((data) => {
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : undefined;
    return {
      ...data,
      startDate,
      endDate,
      isCurrent: data.isCurrent ?? false,
    };
  })
  .refine((data) => !Number.isNaN(data.startDate.getTime()), {
    message: "Start date must be a valid date",
    path: ["startDate"],
  })
  .refine((data) => !data.endDate || !Number.isNaN(data.endDate.getTime()), {
    message: "End date must be a valid date",
    path: ["endDate"],
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

const EducationInputSchema = z
  .object({
    institution: z
      .string()
      .min(1, "Institution is required")
      .max(200, "Institution must be 200 characters or less"),
    degree: z.string().max(200, "Degree must be 200 characters or less").optional(),
    fieldOfStudy: z.string().max(200, "Field of study must be 200 characters or less").optional(),
    startYear: z.number().int().min(1900).max(2100).optional(),
    endYear: z.number().int().min(1900).max(2100).optional(),
  })
  .refine((data) => !data.startYear || !data.endYear || data.endYear >= data.startYear, {
    message: "End year must be greater than or equal to start year",
    path: ["endYear"],
  });

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function getActiveBatchIdsForUser(userId: string): Promise<string[]> {
  const userBatches = await prisma.userBatch.findMany({
    where: {
      userId,
      status: "active",
    },
    select: { batchId: true },
  });

  return userBatches.map((item) => item.batchId);
}

export async function getProfile(): Promise<ActionResult<{
  id: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
}>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      profileImage: true,
      jobTitle: true,
      company: true,
      bio: true,
    },
  });

  if (!profile) return { success: false, error: "Profile not found" };

  return { success: true, data: profile };
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const raw = {
    name: formData.get("name") as string,
    jobTitle: (formData.get("jobTitle") as string) || undefined,
    company: (formData.get("company") as string) || undefined,
    bio: (formData.get("bio") as string) || undefined,
    profileImage: (formData.get("profileImage") as string) || undefined,
  };

  const parsed = UpdateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input"
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      jobTitle: parsed.data.jobTitle || null,
      company: parsed.data.company || null,
      bio: parsed.data.bio || null,
      profileImage: parsed.data.profileImage || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/feed");
  revalidateTag("current-user");

  return { success: true, data: undefined };
}

export async function getUserProfile(userId: string): Promise<ActionResult<{
  id: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  role: string | null;
  groups: { id: string; name: string }[];
  officeHourSlots: { id: string; startTime: string; endTime: string; status: string }[];
}>> {
  const viewer = await getCurrentUser();
  if (!viewer) return { success: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      profileImage: true,
      jobTitle: true,
      company: true,
      bio: true,
      userBatches: {
        where: { batchId: viewer.batchId, status: "active" },
        select: { role: true },
        take: 1,
      },
      groupMembers: {
        where: { group: { batchId: viewer.batchId } },
        select: { group: { select: { id: true, name: true } } },
      },
      officeHourSlots: {
        where: { batchId: viewer.batchId, status: "available", startTime: { gte: new Date() } },
        select: { id: true, startTime: true, endTime: true, status: true },
        orderBy: { startTime: "asc" },
        take: 5,
      },
    },
  });

  if (!user) return { success: false, error: "User not found" };

  const batchRole = user.userBatches[0]?.role ?? null;

  return {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      jobTitle: user.jobTitle,
      company: user.company,
      bio: user.bio,
      role: batchRole,
      groups: user.groupMembers.map((gm) => gm.group),
      officeHourSlots: user.officeHourSlots.map((s) => ({
        id: s.id,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        status: s.status,
      })),
    },
  };
}

export async function getEnhancedUserProfile(userId: string): Promise<ActionResult<{
  id: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  role: string | null;
  groups: { id: string; name: string }[];
  officeHourSlots: { id: string; startTime: string; endTime: string; status: string }[];
  headline: string | null;
  followerCount: number;
  followingCount: number;
  location: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  experiences: {
    id: string;
    company: string;
    title: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description: string | null;
    location: string | null;
  }[];
  education: {
    id: string;
    institution: string;
    degree: string | null;
    fieldOfStudy: string | null;
    startYear: number | null;
    endYear: number | null;
  }[];
  companyMemberships: {
    id: string;
    role: string | null;
    title: string | null;
    isCurrent: boolean;
    startDate: string | null;
    endDate: string | null;
    company: {
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
    };
  }[];
  batches: {
    id: string;
    name: string;
    role: string;
  }[];
}>> {
  const viewer = await getCurrentUser();
  if (!viewer) return { success: false, error: "Not authenticated" };

  const viewerBatchIds = await getActiveBatchIdsForUser(viewer.id);
  if (!isAdmin(viewer.role) && viewerBatchIds.length === 0) {
    return { success: false, error: "Not authorized" };
  }

  const accessibleBatchIds = isAdmin(viewer.role)
    ? undefined
    : { in: viewerBatchIds };

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      profileImage: true,
      jobTitle: true,
      company: true,
      bio: true,
      headline: true,
      followerCount: true,
      followingCount: true,
      location: true,
      linkedinUrl: true,
      twitterUrl: true,
      websiteUrl: true,
      userBatches: {
        where: {
          status: "active",
          ...(accessibleBatchIds ? { batchId: accessibleBatchIds } : {}),
        },
        select: {
          batchId: true,
          role: true,
          batch: { select: { name: true } },
        },
      },
      groupMembers: {
        where: {
          group: {
            ...(accessibleBatchIds ? { batchId: accessibleBatchIds } : {}),
          },
        },
        select: { group: { select: { id: true, name: true } } },
      },
      officeHourSlots: {
        where: {
          status: "available",
          startTime: { gte: new Date() },
          ...(accessibleBatchIds ? { batchId: accessibleBatchIds } : {}),
        },
        select: { id: true, startTime: true, endTime: true, status: true },
        orderBy: { startTime: "asc" },
        take: 5,
      },
      experiences: {
        orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
      },
      education: {
        orderBy: [
          { endYear: { sort: "desc", nulls: "first" } },
          { startYear: "desc" },
        ],
      },
      companyMemberships: {
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
        },
        orderBy: [{ isCurrent: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!profile) return { success: false, error: "User not found" };
  if (!isAdmin(viewer.role) && profile.userBatches.length === 0) {
    return { success: false, error: "Not authorized" };
  }

  return {
    success: true,
    data: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      profileImage: profile.profileImage,
      jobTitle: profile.jobTitle,
      company: profile.company,
      bio: profile.bio,
      role: profile.userBatches[0]?.role ?? null,
      groups: profile.groupMembers.map((item) => item.group),
      officeHourSlots: profile.officeHourSlots.map((item) => ({
        id: item.id,
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString(),
        status: item.status,
      })),
      headline: profile.headline,
      followerCount: profile.followerCount,
      followingCount: profile.followingCount,
      location: profile.location,
      linkedinUrl: profile.linkedinUrl,
      twitterUrl: profile.twitterUrl,
      websiteUrl: profile.websiteUrl,
      experiences: profile.experiences.map((exp) => ({
        id: exp.id,
        company: exp.company,
        title: exp.title,
        startDate: exp.startDate.toISOString(),
        endDate: exp.endDate ? exp.endDate.toISOString() : null,
        isCurrent: exp.isCurrent,
        description: exp.description,
        location: exp.location,
      })),
      education: profile.education.map((edu) => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startYear: edu.startYear,
        endYear: edu.endYear,
      })),
      companyMemberships: profile.companyMemberships.map((membership) => ({
        id: membership.id,
        role: membership.role,
        title: membership.title,
        isCurrent: membership.isCurrent,
        startDate: membership.startDate ? membership.startDate.toISOString() : null,
        endDate: membership.endDate ? membership.endDate.toISOString() : null,
        company: {
          id: membership.company.id,
          name: membership.company.name,
          slug: membership.company.slug,
          logoUrl: membership.company.logoUrl,
        },
      })),
      batches: profile.userBatches.map((userBatch) => ({
        id: userBatch.batchId,
        name: userBatch.batch.name,
        role: userBatch.role,
      })),
    },
  };
}

export async function updateExtendedProfile(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const raw = {
    name: formData.get("name") as string,
    jobTitle: optionalString(formData.get("jobTitle")),
    company: optionalString(formData.get("company")),
    bio: optionalString(formData.get("bio")),
    profileImage: optionalString(formData.get("profileImage")) || null,
    headline: optionalString(formData.get("headline")),
    location: optionalString(formData.get("location")),
    linkedinUrl: optionalString(formData.get("linkedinUrl")),
    twitterUrl: optionalString(formData.get("twitterUrl")),
    websiteUrl: optionalString(formData.get("websiteUrl")),
  };

  const parsed = UpdateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      jobTitle: parsed.data.jobTitle || null,
      company: parsed.data.company || null,
      bio: parsed.data.bio || null,
      profileImage: parsed.data.profileImage || null,
      headline: parsed.data.headline || null,
      location: parsed.data.location || null,
      linkedinUrl: parsed.data.linkedinUrl || null,
      twitterUrl: parsed.data.twitterUrl || null,
      websiteUrl: parsed.data.websiteUrl || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/feed");
  revalidateTag("current-user");

  return { success: true, data: undefined };
}

export async function addExperience(data: {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  location?: string;
}): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = ExperienceInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const experience = await prisma.experience.create({
    data: {
      userId: user.id,
      company: parsed.data.company,
      title: parsed.data.title,
      startDate: parsed.data.startDate,
      endDate: parsed.data.isCurrent ? null : parsed.data.endDate || null,
      isCurrent: parsed.data.isCurrent,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
    },
    select: { id: true },
  });

  revalidatePath(`/profile/${user.id}`);
  return { success: true, data: experience };
}

export async function updateExperience(
  id: string,
  data: {
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
    location?: string;
  }
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = ExperienceInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const existing = await prisma.experience.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!existing) return { success: false, error: "Experience not found" };

  const experience = await prisma.experience.update({
    where: { id },
    data: {
      company: parsed.data.company,
      title: parsed.data.title,
      startDate: parsed.data.startDate,
      endDate: parsed.data.isCurrent ? null : parsed.data.endDate || null,
      isCurrent: parsed.data.isCurrent,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
    },
    select: { id: true },
  });

  revalidatePath(`/profile/${user.id}`);
  return { success: true, data: experience };
}

export async function deleteExperience(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const existing = await prisma.experience.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!existing) return { success: false, error: "Experience not found" };

  await prisma.experience.delete({ where: { id } });

  revalidatePath(`/profile/${user.id}`);
  return { success: true, data: undefined };
}

export async function addEducation(data: {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = EducationInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const education = await prisma.education.create({
    data: {
      userId: user.id,
      institution: parsed.data.institution,
      degree: parsed.data.degree || null,
      fieldOfStudy: parsed.data.fieldOfStudy || null,
      startYear: parsed.data.startYear ?? null,
      endYear: parsed.data.endYear ?? null,
    },
    select: { id: true },
  });

  revalidatePath(`/profile/${user.id}`);
  return { success: true, data: education };
}

export async function updateEducation(
  id: string,
  data: {
    institution: string;
    degree?: string;
    fieldOfStudy?: string;
    startYear?: number;
    endYear?: number;
  }
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = EducationInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const existing = await prisma.education.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!existing) return { success: false, error: "Education not found" };

  const education = await prisma.education.update({
    where: { id },
    data: {
      institution: parsed.data.institution,
      degree: parsed.data.degree || null,
      fieldOfStudy: parsed.data.fieldOfStudy || null,
      startYear: parsed.data.startYear ?? null,
      endYear: parsed.data.endYear ?? null,
    },
    select: { id: true },
  });

  revalidatePath(`/profile/${user.id}`);
  return { success: true, data: education };
}

export async function deleteEducation(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const existing = await prisma.education.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!existing) return { success: false, error: "Education not found" };

  await prisma.education.delete({ where: { id } });

  revalidatePath(`/profile/${user.id}`);
  return { success: true, data: undefined };
}
