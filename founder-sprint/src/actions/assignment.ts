"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff, isFounder, canCreateAssignment } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

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

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck as ActionResult<{ id: string }>;

  if (!canCreateAssignment(user.role)) {
    return { success: false, error: "Unauthorized: staff only" };
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

  // Normalize dueDate to KST 23:59:59 (14:59:59 UTC)
  // If the input is a date-only string (no specific time), set it to end of day KST
  const dueDateInput = formData.get("dueDate") as string;
  let normalizedDueDate = parsed.data.dueDate;

  // Check if the input is date-only (no time component)
  if (dueDateInput && !dueDateInput.includes("T") && !dueDateInput.includes(":")) {
    // Extract date portion and create new Date at 14:59:59 UTC (23:59:59 KST)
    const datePart = dueDateInput.split(" ")[0]; // Handle both "YYYY-MM-DD" and "YYYY-MM-DD HH:MM"
    normalizedDueDate = new Date(`${datePart}T14:59:59.000Z`);
  }

  const assignment = await prisma.assignment.create({
    data: {
      batchId: user.batchId,
      title: parsed.data.title,
      description: parsed.data.description,
      templateUrl: parsed.data.templateUrl || null,
      dueDate: normalizedDueDate,
    },
  });

   revalidatePath("/assignments");
   revalidateTag(`assignments-${user.batchId}`);
   return { success: true, data: { id: assignment.id } };
}

const UpdateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  dueDate: z.string().transform((s) => new Date(s)).optional(),
});

export async function updateAssignment(
  assignmentId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!canCreateAssignment(user.role)) {
    return { success: false, error: "Unauthorized: staff only" };
  }

  // Check for existing submissions
  const submissionCount = await prisma.submission.count({
    where: { assignmentId },
  });

  if (submissionCount > 0) {
    return { success: false, error: "Cannot modify assignment with existing submissions" };
  }

  const parsed = UpdateAssignmentSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  // Check if assignment exists
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true },
  });

  if (!assignment) {
    return { success: false, error: "Assignment not found" };
  }

  const updateData: Record<string, any> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate;

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: updateData,
  });

  revalidatePath("/assignments");
  revalidatePath(`/assignments/${assignmentId}`);
  revalidateTag(`assignments-${user.batchId}`);
  revalidateTag(`assignment-${assignmentId}`);
  return { success: true, data: undefined };
}

export async function deleteAssignment(assignmentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!canCreateAssignment(user.role)) {
    return { success: false, error: "Unauthorized: staff only" };
  }

  // Check for existing submissions
  const submissionCount = await prisma.submission.count({
    where: { assignmentId },
  });

  if (submissionCount > 0) {
    return { success: false, error: "Cannot modify assignment with existing submissions" };
  }

  // Check if assignment exists
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true },
  });

  if (!assignment) {
    return { success: false, error: "Assignment not found" };
  }

  await prisma.assignment.delete({
    where: { id: assignmentId },
  });

  revalidatePath("/assignments");
  revalidateTag(`assignments-${user.batchId}`);
  return { success: true, data: undefined };
}

export async function getAssignments(batchId: string) {
  return unstable_cache(
    () =>
      prisma.assignment.findMany({
        where: { batchId },
        orderBy: { dueDate: "desc" },
        include: {
          _count: {
            select: { submissions: true },
          },
        },
      }),
    [`assignments-${batchId}`],
    { revalidate: 60, tags: [`assignments-${batchId}`] }
  )();
}

export async function getAssignment(id: string) {
  return unstable_cache(
    () =>
      prisma.assignment.findUnique({
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
      }),
    [`assignment-${id}`],
    { revalidate: 60, tags: [`assignment-${id}`] }
  )();
}

export async function submitAssignment(
  assignmentId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck as ActionResult<{ id: string }>;

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
  revalidateTag(`assignment-${assignmentId}`);
  revalidateTag(`assignments-${user.batchId}`);
  revalidateTag(`submissions-${user.batchId}`);
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
  return unstable_cache(
    () =>
      prisma.submission.findMany({
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
      }),
    [`submissions-${batchId}`],
    { revalidate: 60, tags: [`submissions-${batchId}`] }
  )();
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
    revalidateTag(`assignment-${submission.assignmentId}`);
  }
  revalidatePath(`/submissions/${submissionId}`);
  revalidateTag(`submissions-${user.batchId}`);

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
  revalidateTag(`assignment-${feedback.submission.assignmentId}`);
  revalidateTag(`submissions-${user.batchId}`);

  return { success: true, data: undefined };
}
