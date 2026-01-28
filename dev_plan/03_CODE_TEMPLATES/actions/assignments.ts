'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadFile } from '@/lib/supabase/storage';

const createAssignmentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  instructions: z.string().min(20, 'Instructions are required'),
  dueDate: z.coerce.date(),
  cohortId: z.string().uuid(),
  moduleId: z.string().uuid().optional().or(z.literal('')),
  maxScore: z.coerce.number().int().min(1).default(100),
});

const submitAssignmentSchema = z.object({
  assignmentId: z.string().uuid(),
  content: z.string().min(10, 'Submission content is required'),
  fileUrl: z.string().url().optional().or(z.literal('')),
});

const reviewSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  score: z.coerce.number().int().min(0).max(100),
  feedback: z.string().min(10, 'Feedback is required'),
});

export async function createAssignment(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  if (session.user.role !== 'admin') {
    return { error: 'Only admins can create assignments' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    instructions: formData.get('instructions') as string,
    dueDate: formData.get('dueDate') as string,
    cohortId: formData.get('cohortId') as string,
    moduleId: formData.get('moduleId') as string,
    maxScore: formData.get('maxScore') as string || '100',
  };

  const parsed = createAssignmentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const assignment = await prisma.assignment.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        instructions: parsed.data.instructions,
        dueDate: parsed.data.dueDate,
        cohortId: parsed.data.cohortId,
        moduleId: parsed.data.moduleId || null,
        maxScore: parsed.data.maxScore,
      },
    });

    revalidatePath('/assignments');
    revalidatePath('/admin/assignments');
    return { success: true, assignmentId: assignment.id };
  } catch (error) {
    console.error('Failed to create assignment:', error);
    return { error: 'Failed to create assignment. Please try again.' };
  }
}

export async function updateAssignment(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  if (session.user.role !== 'admin') {
    return { error: 'Only admins can update assignments' };
  }

  const assignmentId = formData.get('assignmentId') as string;

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    instructions: formData.get('instructions') as string,
    dueDate: formData.get('dueDate') as string,
    cohortId: formData.get('cohortId') as string,
    moduleId: formData.get('moduleId') as string,
    maxScore: formData.get('maxScore') as string || '100',
  };

  const parsed = createAssignmentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        instructions: parsed.data.instructions,
        dueDate: parsed.data.dueDate,
        cohortId: parsed.data.cohortId,
        moduleId: parsed.data.moduleId || null,
        maxScore: parsed.data.maxScore,
      },
    });

    revalidatePath('/assignments');
    revalidatePath(`/assignments/${assignmentId}`);
    revalidatePath('/admin/assignments');
    return { success: true };
  } catch (error) {
    console.error('Failed to update assignment:', error);
    return { error: 'Failed to update assignment. Please try again.' };
  }
}

export async function deleteAssignment(assignmentId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  if (session.user.role !== 'admin') {
    return { error: 'Only admins can delete assignments' };
  }

  try {
    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    revalidatePath('/assignments');
    revalidatePath('/admin/assignments');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete assignment:', error);
    return { error: 'Failed to delete assignment. Please try again.' };
  }
}

export async function submitAssignment(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  const assignmentId = formData.get('assignmentId') as string;
  const content = formData.get('content') as string;
  const file = formData.get('file') as File | null;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    return { error: 'Assignment not found' };
  }

  if (new Date() > assignment.dueDate) {
    return { error: 'This assignment is past due' };
  }

  let fileUrl: string | null = null;

  if (file && file.size > 0) {
    const uploadResult = await uploadFile({
      file,
      bucket: 'submissions',
      folder: `assignments/${assignmentId}/${session.user.id}`,
    });

    if ('error' in uploadResult) {
      return { error: uploadResult.error };
    }

    fileUrl = uploadResult.url;
  }

  try {
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_founderId: {
          assignmentId,
          founderId: session.user.id,
        },
      },
    });

    if (existingSubmission) {
      await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          content,
          fileUrl,
          submittedAt: new Date(),
          status: 'submitted',
        },
      });
    } else {
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          founderId: session.user.id,
          content,
          fileUrl,
          status: 'submitted',
        },
      });
    }

    revalidatePath('/assignments');
    revalidatePath(`/assignments/${assignmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to submit assignment:', error);
    return { error: 'Failed to submit. Please try again.' };
  }
}

export async function reviewSubmission(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  if (session.user.role !== 'mentor' && session.user.role !== 'admin') {
    return { error: 'Only mentors and admins can review submissions' };
  }

  const rawData = {
    submissionId: formData.get('submissionId') as string,
    score: formData.get('score') as string,
    feedback: formData.get('feedback') as string,
  };

  const parsed = reviewSubmissionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.assignmentSubmission.update({
      where: { id: parsed.data.submissionId },
      data: {
        score: parsed.data.score,
        feedback: parsed.data.feedback,
        reviewedAt: new Date(),
        reviewerId: session.user.id,
        status: 'reviewed',
      },
    });

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: parsed.data.submissionId },
    });

    revalidatePath('/submissions');
    revalidatePath(`/assignments/${submission?.assignmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to review submission:', error);
    return { error: 'Failed to save review. Please try again.' };
  }
}

export async function getAssignmentsForUser() {
  const session = await getSession();
  if (!session?.user) {
    return [];
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      cohortId: session.user.cohortId,
    },
    include: {
      submissions: {
        where: { founderId: session.user.id },
        select: {
          id: true,
          status: true,
          score: true,
          submittedAt: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  return assignments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    dueDate: a.dueDate,
    maxScore: a.maxScore,
    submission: a.submissions[0] || null,
    status: a.submissions[0]?.status || 'not_started',
  }));
}
