'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const createQuestionSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  body: z.string().min(20, 'Question must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().optional().default(true),
});

const createAnswerSchema = z.object({
  questionId: z.string().uuid(),
  body: z.string().min(10, 'Answer must be at least 10 characters'),
});

export async function createQuestion(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in to create a question' };
  }

  const rawData = {
    title: formData.get('title') as string,
    body: formData.get('body') as string,
    category: formData.get('category') as string,
    tags: formData.getAll('tags') as string[],
    isPublic: formData.get('isPublic') === 'true',
  };

  const parsed = createQuestionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const question = await prisma.question.create({
      data: {
        ...parsed.data,
        authorId: session.user.id,
        cohortId: session.user.cohortId,
      },
    });

    revalidatePath('/questions');
    redirect(`/questions/${question.id}`);
  } catch (error) {
    console.error('Failed to create question:', error);
    return { error: 'Failed to create question. Please try again.' };
  }
}

export async function updateQuestion(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  const questionId = formData.get('questionId') as string;
  
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return { error: 'Question not found' };
  }

  if (question.authorId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'You are not authorized to edit this question' };
  }

  const rawData = {
    title: formData.get('title') as string,
    body: formData.get('body') as string,
    category: formData.get('category') as string,
    tags: formData.getAll('tags') as string[],
    isPublic: formData.get('isPublic') === 'true',
  };

  const parsed = createQuestionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.question.update({
      where: { id: questionId },
      data: parsed.data,
    });

    revalidatePath(`/questions/${questionId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update question:', error);
    return { error: 'Failed to update question. Please try again.' };
  }
}

export async function deleteQuestion(questionId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return { error: 'Question not found' };
  }

  if (question.authorId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'You are not authorized to delete this question' };
  }

  try {
    await prisma.question.delete({
      where: { id: questionId },
    });

    revalidatePath('/questions');
    redirect('/questions');
  } catch (error) {
    console.error('Failed to delete question:', error);
    return { error: 'Failed to delete question. Please try again.' };
  }
}

export async function closeQuestion(questionId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return { error: 'Question not found' };
  }

  if (question.authorId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'You are not authorized to close this question' };
  }

  try {
    await prisma.question.update({
      where: { id: questionId },
      data: { status: 'closed' },
    });

    revalidatePath(`/questions/${questionId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to close question:', error);
    return { error: 'Failed to close question. Please try again.' };
  }
}

export async function createAnswer(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in to answer' };
  }

  const rawData = {
    questionId: formData.get('questionId') as string,
    body: formData.get('body') as string,
  };

  const parsed = createAnswerSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const question = await prisma.question.findUnique({
    where: { id: parsed.data.questionId },
  });

  if (!question) {
    return { error: 'Question not found' };
  }

  if (question.status === 'closed') {
    return { error: 'This question is closed and no longer accepting answers' };
  }

  try {
    await prisma.answer.create({
      data: {
        body: parsed.data.body,
        questionId: parsed.data.questionId,
        authorId: session.user.id,
      },
    });

    if (question.status === 'open') {
      await prisma.question.update({
        where: { id: parsed.data.questionId },
        data: { status: 'answered' },
      });
    }

    revalidatePath(`/questions/${parsed.data.questionId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to create answer:', error);
    return { error: 'Failed to post answer. Please try again.' };
  }
}

export async function markAnswerAsAccepted(answerId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: { question: true },
  });

  if (!answer) {
    return { error: 'Answer not found' };
  }

  if (answer.question.authorId !== session.user.id) {
    return { error: 'Only the question author can mark an answer as accepted' };
  }

  try {
    await prisma.$transaction([
      prisma.answer.updateMany({
        where: { questionId: answer.questionId },
        data: { isAccepted: false },
      }),
      prisma.answer.update({
        where: { id: answerId },
        data: { isAccepted: true },
      }),
    ]);

    revalidatePath(`/questions/${answer.questionId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to mark answer as accepted:', error);
    return { error: 'Failed to mark answer. Please try again.' };
  }
}

export async function upvoteQuestion(questionId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in to upvote' };
  }

  try {
    const existingVote = await prisma.questionUpvote.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId: session.user.id,
        },
      },
    });

    if (existingVote) {
      await prisma.questionUpvote.delete({
        where: { id: existingVote.id },
      });
    } else {
      await prisma.questionUpvote.create({
        data: {
          questionId,
          userId: session.user.id,
        },
      });
    }

    revalidatePath(`/questions/${questionId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to upvote question:', error);
    return { error: 'Failed to upvote. Please try again.' };
  }
}
