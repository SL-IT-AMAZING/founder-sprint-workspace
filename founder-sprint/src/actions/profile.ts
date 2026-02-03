"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  jobTitle: z.string().max(100, "Job title must be 100 characters or less").optional(),
  company: z.string().max(100, "Company must be 100 characters or less").optional(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  profileImage: z.string().url("Must be a valid URL").optional().nullable(),
});

export async function getProfile(): Promise<ActionResult<{
  id: string;
  email: string;
  name: string;
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
