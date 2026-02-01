"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const CreateQuestionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
});

export async function createQuestion(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (user.role !== "founder" && user.role !== "co_founder") {
    return { success: false, error: "Only Founders can create questions" };
  }

  const parsed = CreateQuestionSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const question = await prisma.question.create({
    data: {
      batchId: user.batchId,
      authorId: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
    },
  });

  revalidatePath("/questions");
  return { success: true, data: { id: question.id } };
}

export async function createAnswer(
  questionId: string,
  content: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!["super_admin", "admin", "mentor"].includes(user.role)) {
    return { success: false, error: "Only staff can answer questions" };
  }

  if (!content.trim()) {
    return { success: false, error: "Answer content is required" };
  }

  if (content.length > 10000) {
    return { success: false, error: "Answer content exceeds maximum length of 10000 characters" };
  }

  const answer = await prisma.answer.create({
    data: {
      questionId,
      authorId: user.id,
      content: content.trim(),
    },
  });

  revalidatePath(`/questions/${questionId}`);
  return { success: true, data: { id: answer.id } };
}

export async function createSummary(
  questionId: string,
  content: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (user.role !== "super_admin" && user.role !== "admin") {
    return { success: false, error: "Only admins can create summaries" };
  }

  // Create summary and close the question
  const [summary] = await prisma.$transaction([
    prisma.summary.create({
      data: {
        questionId,
        authorId: user.id,
        content,
      },
    }),
    prisma.question.update({
      where: { id: questionId },
      data: { status: "closed" },
    }),
  ]);

  revalidatePath(`/questions/${questionId}`);
  revalidatePath("/questions");
  return { success: true, data: { id: summary.id } };
}

export async function getQuestions(batchId: string) {
  return prisma.question.findMany({
    where: { batchId },
    include: {
      author: { select: { id: true, name: true, profileImage: true } },
      _count: { select: { answers: true } },
      summary: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuestion(id: string) {
  return prisma.question.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, profileImage: true, jobTitle: true, company: true } },
      attachments: true,
      answers: {
        include: {
          author: { select: { id: true, name: true, profileImage: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      summary: {
        include: {
          author: { select: { id: true, name: true, profileImage: true } },
        },
      },
    },
  });
}

const UpdateQuestionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
});

export async function updateQuestion(
  questionId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = UpdateQuestionSchema.safeParse({
    title: formData.get("title") || undefined,
    content: formData.get("content") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  // Get the question with answer count
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      _count: {
        select: { answers: true },
      },
    },
  });

  if (!question) {
    return { success: false, error: "Question not found" };
  }

  // Only owner can update, and only before any answers exist
  if (question.authorId !== user.id) {
    return { success: false, error: "Unauthorized: only question owner can update" };
  }

  if (question._count.answers > 0) {
    return { success: false, error: "Cannot update question after answers have been added" };
  }

  await prisma.question.update({
    where: { id: questionId },
    data: {
      ...(parsed.data.title && { title: parsed.data.title }),
      ...(parsed.data.content && { content: parsed.data.content }),
    },
  });

  revalidatePath("/questions");
  revalidatePath(`/questions/${questionId}`);

  return { success: true, data: undefined };
}

const UpdateAnswerSchema = z.object({
  content: z.string().min(1).max(10000),
});

export async function updateAnswer(
  answerId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = UpdateAnswerSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  // Get the answer
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { authorId: true, questionId: true },
  });

  if (!answer) {
    return { success: false, error: "Answer not found" };
  }

  // Only owner can update
  if (answer.authorId !== user.id) {
    return { success: false, error: "Unauthorized: only answer owner can update" };
  }

  await prisma.answer.update({
    where: { id: answerId },
    data: { content: parsed.data.content },
  });

  revalidatePath(`/questions/${answer.questionId}`);

  return { success: true, data: undefined };
}
