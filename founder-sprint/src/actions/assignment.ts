"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff, isFounder } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const CreateAssignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  templateUrl: z.string().url().optional().or(z.literal("")),
  dueDate: z.string().transform((s) => new Date(s)),
});

const SubmitAssignmentSchema = z.object({
  content: z.string().optional().or(z.literal("")),
  linkUrl: z.string().url().optional().or(z.literal("")),
}).refine(
  (data) => {
    const hasContent = data.content && data.content.trim().length > 0;
    const hasLink = data.linkUrl && data.linkUrl.trim().length > 0;
    return hasContent || hasLink;
  },
  { message: "Either content or link URL must be provided" }
);

export async function createAssignment(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Only Admin and Super Admin can create assignments (NOT Mentor)
  if (user.role !== "super_admin" && user.role !== "admin") {
    return { success: false, error: "Unauthorized: admin only" };
  }

  const parsed = CreateAssignmentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    templateUrl: formData.get("templateUrl") || undefined,
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const assignment = await prisma.assignment.create({
    data: {
      batchId: user.batchId,
      title: parsed.data.title,
      description: parsed.data.description,
      templateUrl: parsed.data.templateUrl || null,
      dueDate: parsed.data.dueDate,
    },
  });

  revalidatePath("/assignments");
  return { success: true, data: { id: assignment.id } };
}

export async function getAssignments(batchId: string) {
  return prisma.assignment.findMany({
    where: { batchId },
    orderBy: { dueDate: "desc" },
    include: {
      _count: {
        select: { submissions: true },
      },
    },
  });
}

export async function getAssignment(id: string) {
  return prisma.assignment.findUnique({
    where: { id },
    include: {
      submissions: {
        include: {
          author: true,
          feedbacks: {
            include: {
              author: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
}

export async function submitAssignment(
  assignmentId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isFounder(user.role)) {
    return { success: false, error: "Unauthorized: founders only" };
  }

  const parsed = SubmitAssignmentSchema.safeParse({
    content: formData.get("content") || undefined,
    linkUrl: formData.get("linkUrl") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  // Check if assignment exists and get due date
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { dueDate: true },
  });

  if (!assignment) {
    return { success: false, error: "Assignment not found" };
  }

  const now = new Date();
  const isLate = now > assignment.dueDate;

  // Upsert submission (update if exists, create if not)
  const submission = await prisma.submission.upsert({
    where: {
      assignmentId_authorId: {
        assignmentId,
        authorId: user.id,
      },
    },
    update: {
      content: parsed.data.content || null,
      linkUrl: parsed.data.linkUrl || null,
      isLate,
      submittedAt: now,
    },
    create: {
      assignmentId,
      authorId: user.id,
      content: parsed.data.content || null,
      linkUrl: parsed.data.linkUrl || null,
      isLate,
      submittedAt: now,
    },
  });

  revalidatePath(`/assignments/${assignmentId}`);
  revalidatePath("/assignments");
  return { success: true, data: { id: submission.id } };
}

export async function getSubmission(id: string) {
  return prisma.submission.findUnique({
    where: { id },
    include: {
      author: true,
      assignment: true,
      feedbacks: {
        include: {
          author: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getSubmissions(batchId: string) {
  return prisma.submission.findMany({
    where: {
      assignment: {
        batchId,
      },
    },
    include: {
      author: true,
      assignment: true,
      feedbacks: true,
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function addFeedback(
  submissionId: string,
  content: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isStaff(user.role)) {
    return { success: false, error: "Unauthorized: staff only" };
  }

  if (!content.trim()) {
    return { success: false, error: "Feedback content is required" };
  }

  if (content.length > 3000) {
    return { success: false, error: "Feedback content exceeds maximum length of 3000 characters" };
  }

  const feedback = await prisma.feedback.create({
    data: {
      submissionId,
      authorId: user.id,
      content: content.trim(),
    },
  });

  // Get assignment ID for revalidation
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { assignmentId: true },
  });

  if (submission) {
    revalidatePath(`/assignments/${submission.assignmentId}`);
  }
  revalidatePath(`/submissions/${submissionId}`);

  return { success: true, data: { id: feedback.id } };
}

const UpdateFeedbackSchema = z.object({
  content: z.string().min(1).max(3000),
});

export async function updateFeedback(
  feedbackId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = UpdateFeedbackSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  // Get the feedback with submission info
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      submission: {
        select: { assignmentId: true },
      },
    },
  });

  if (!feedback) {
    return { success: false, error: "Feedback not found" };
  }

  // Only owner can update
  if (feedback.authorId !== user.id) {
    return { success: false, error: "Unauthorized: only feedback owner can update" };
  }

  await prisma.feedback.update({
    where: { id: feedbackId },
    data: { content: parsed.data.content },
  });

  revalidatePath(`/assignments/${feedback.submission.assignmentId}`);

  return { success: true, data: undefined };
}
