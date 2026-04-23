'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const createSessionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  mentorId: z.string().uuid(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  capacity: z.coerce.number().int().min(1).max(20),
  meetingUrl: z.string().url().optional().or(z.literal('')),
  cohortId: z.string().uuid().optional().or(z.literal('')),
});

export async function createOfficeHoursSession(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  if (session.user.role !== 'admin') {
    return { error: 'Only admins can create office hours sessions' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    mentorId: formData.get('mentorId') as string,
    startTime: formData.get('startTime') as string,
    endTime: formData.get('endTime') as string,
    capacity: formData.get('capacity') as string,
    meetingUrl: formData.get('meetingUrl') as string,
    cohortId: formData.get('cohortId') as string,
  };

  const parsed = createSessionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.startTime >= parsed.data.endTime) {
    return { error: 'End time must be after start time' };
  }

  try {
    const officeHoursSession = await prisma.officeHoursSession.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        mentorId: parsed.data.mentorId,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        capacity: parsed.data.capacity,
        meetingUrl: parsed.data.meetingUrl || null,
        cohortId: parsed.data.cohortId || null,
      },
    });

    revalidatePath('/office-hours');
    revalidatePath('/admin/office-hours');
    return { success: true, sessionId: officeHoursSession.id };
  } catch (error) {
    console.error('Failed to create office hours session:', error);
    return { error: 'Failed to create session. Please try again.' };
  }
}

export async function updateOfficeHoursSession(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  if (session.user.role !== 'admin') {
    return { error: 'Only admins can update office hours sessions' };
  }

  const sessionId = formData.get('sessionId') as string;

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    mentorId: formData.get('mentorId') as string,
    startTime: formData.get('startTime') as string,
    endTime: formData.get('endTime') as string,
    capacity: formData.get('capacity') as string,
    meetingUrl: formData.get('meetingUrl') as string,
    cohortId: formData.get('cohortId') as string,
  };

  const parsed = createSessionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.officeHoursSession.update({
      where: { id: sessionId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        mentorId: parsed.data.mentorId,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        capacity: parsed.data.capacity,
        meetingUrl: parsed.data.meetingUrl || null,
        cohortId: parsed.data.cohortId || null,
      },
    });

    revalidatePath('/office-hours');
    revalidatePath('/admin/office-hours');
    return { success: true };
  } catch (error) {
    console.error('Failed to update office hours session:', error);
    return { error: 'Failed to update session. Please try again.' };
  }
}

export async function cancelOfficeHoursSession(sessionId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  if (session.user.role !== 'admin') {
    return { error: 'Only admins can cancel sessions' };
  }

  try {
    await prisma.officeHoursSession.update({
      where: { id: sessionId },
      data: { status: 'cancelled' },
    });

    revalidatePath('/office-hours');
    revalidatePath('/admin/office-hours');
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel session:', error);
    return { error: 'Failed to cancel session. Please try again.' };
  }
}

export async function registerForSession(sessionId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in to register' };
  }

  const officeHoursSession = await prisma.officeHoursSession.findUnique({
    where: { id: sessionId },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  if (!officeHoursSession) {
    return { error: 'Session not found' };
  }

  if (officeHoursSession.status === 'cancelled') {
    return { error: 'This session has been cancelled' };
  }

  if (officeHoursSession.status === 'completed') {
    return { error: 'This session has already ended' };
  }

  if (officeHoursSession._count.registrations >= officeHoursSession.capacity) {
    return { error: 'This session is full' };
  }

  const existingRegistration = await prisma.officeHoursRegistration.findUnique({
    where: {
      sessionId_userId: {
        sessionId,
        userId: session.user.id,
      },
    },
  });

  if (existingRegistration) {
    return { error: 'You are already registered for this session' };
  }

  try {
    await prisma.officeHoursRegistration.create({
      data: {
        sessionId,
        userId: session.user.id,
      },
    });

    revalidatePath('/office-hours');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to register for session:', error);
    return { error: 'Failed to register. Please try again.' };
  }
}

export async function unregisterFromSession(sessionId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  const registration = await prisma.officeHoursRegistration.findUnique({
    where: {
      sessionId_userId: {
        sessionId,
        userId: session.user.id,
      },
    },
  });

  if (!registration) {
    return { error: 'You are not registered for this session' };
  }

  try {
    await prisma.officeHoursRegistration.delete({
      where: { id: registration.id },
    });

    revalidatePath('/office-hours');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to unregister from session:', error);
    return { error: 'Failed to unregister. Please try again.' };
  }
}

export async function getUpcomingSessions(limit = 10) {
  const session = await getSession();
  if (!session?.user) {
    return [];
  }

  const now = new Date();

  const sessions = await prisma.officeHoursSession.findMany({
    where: {
      startTime: { gt: now },
      status: { in: ['scheduled', 'live'] },
      OR: [
        { cohortId: null },
        { cohortId: session.user.cohortId },
      ],
    },
    include: {
      mentor: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      registrations: {
        where: { userId: session.user.id },
        select: { id: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: { startTime: 'asc' },
    take: limit,
  });

  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    mentor: s.mentor,
    startTime: s.startTime,
    endTime: s.endTime,
    capacity: s.capacity,
    registeredCount: s._count.registrations,
    meetingUrl: s.meetingUrl,
    isRegistered: s.registrations.length > 0,
    status: s.status as 'upcoming' | 'live' | 'completed' | 'cancelled',
  }));
}
