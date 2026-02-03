"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const CreateSessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  sessionDate: z.string().transform((s) => new Date(s)),
  slidesUrl: z.string().url().optional().or(z.literal("")),
  recordingUrl: z.string().url().optional().or(z.literal("")),
});

const UpdateSessionSchema = CreateSessionSchema.partial();

export async function createSession(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  const parsed = CreateSessionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    sessionDate: formData.get("sessionDate"),
    slidesUrl: formData.get("slidesUrl") || undefined,
    recordingUrl: formData.get("recordingUrl") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const session = await prisma.session.create({
    data: {
      batchId: user.batchId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      sessionDate: parsed.data.sessionDate,
      slidesUrl: parsed.data.slidesUrl || null,
      recordingUrl: parsed.data.recordingUrl || null,
    },
  });

  revalidatePath("/sessions");
  return { success: true, data: { id: session.id } };
}

export async function getSessions(batchId: string) {
  return prisma.session.findMany({
    where: { batchId },
    orderBy: { sessionDate: "desc" },
  });
}

export async function getSession(id: string) {
  return prisma.session.findUnique({
    where: { id },
  });
}

export async function updateSession(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  const parsed = UpdateSessionSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    sessionDate: formData.get("sessionDate") || undefined,
    slidesUrl: formData.get("slidesUrl") || undefined,
    recordingUrl: formData.get("recordingUrl") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  await prisma.session.update({
    where: { id },
    data: {
      ...(parsed.data.title && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.sessionDate && { sessionDate: parsed.data.sessionDate }),
      ...(parsed.data.slidesUrl !== undefined && { slidesUrl: parsed.data.slidesUrl || null }),
      ...(parsed.data.recordingUrl !== undefined && { recordingUrl: parsed.data.recordingUrl || null }),
    },
  });

   revalidatePath("/sessions");
   return { success: true, data: undefined };
}

export async function deleteSession(sessionId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  try {
    await prisma.session.delete({
      where: { id: sessionId },
    });

    revalidatePath("/sessions");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return { success: false, error: "Session not found" };
    }
    return { success: false, error: "Failed to delete session" };
  }
}
