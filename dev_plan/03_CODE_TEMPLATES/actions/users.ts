'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['founder', 'mentor', 'admin']),
  cohortId: z.string().uuid().optional().or(z.literal('')),
});

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['founder', 'mentor', 'admin']),
  cohortId: z.string().uuid().optional().or(z.literal('')),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500).optional(),
});

export async function inviteUser(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  if (session.user.role !== 'admin') {
    return { error: 'Only admins can invite users' };
  }

  const rawData = {
    email: formData.get('email') as string,
    name: formData.get('name') as string,
    role: formData.get('role') as string,
    cohortId: formData.get('cohortId') as string,
  };

  const parsed = inviteUserSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return { error: 'A user with this email already exists' };
  }

  try {
    await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        role: parsed.data.role,
        cohortId: parsed.data.cohortId || null,
        status: 'pending',
      },
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to invite user:', error);
    return { error: 'Failed to invite user. Please try again.' };
  }
}

export async function updateUser(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  if (session.user.role !== 'admin') {
    return { error: 'Only admins can update users' };
  }

  const rawData = {
    userId: formData.get('userId') as string,
    name: formData.get('name') as string,
    role: formData.get('role') as string,
    cohortId: formData.get('cohortId') as string,
  };

  const parsed = updateUserSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        name: parsed.data.name,
        role: parsed.data.role,
        cohortId: parsed.data.cohortId || null,
      },
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user:', error);
    return { error: 'Failed to update user. Please try again.' };
  }
}

export async function suspendUser(userId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  if (session.user.role !== 'admin') {
    return { error: 'Only admins can suspend users' };
  }

  if (userId === session.user.id) {
    return { error: 'You cannot suspend yourself' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'suspended' },
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to suspend user:', error);
    return { error: 'Failed to suspend user. Please try again.' };
  }
}

export async function activateUser(userId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  if (session.user.role !== 'admin') {
    return { error: 'Only admins can activate users' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'active' },
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to activate user:', error);
    return { error: 'Failed to activate user. Please try again.' };
  }
}

export async function updateProfile(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  const rawData = {
    name: formData.get('name') as string,
    linkedinUrl: formData.get('linkedinUrl') as string,
    bio: formData.get('bio') as string,
  };

  const parsed = updateProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        linkedinUrl: parsed.data.linkedinUrl || null,
        bio: parsed.data.bio || null,
      },
    });

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update profile:', error);
    return { error: 'Failed to update profile. Please try again.' };
  }
}

export async function updateAvatar(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  const file = formData.get('avatar') as File;
  if (!file || file.size === 0) {
    return { error: 'No file provided' };
  }

  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File size must be less than 5MB' };
  }

  try {
    const { uploadFile } = await import('@/lib/supabase/storage');
    
    const uploadResult = await uploadFile({
      file,
      bucket: 'avatars',
      folder: session.user.id,
    });

    if ('error' in uploadResult) {
      return { error: uploadResult.error };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: uploadResult.url },
    });

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { success: true, avatarUrl: uploadResult.url };
  } catch (error) {
    console.error('Failed to update avatar:', error);
    return { error: 'Failed to update avatar. Please try again.' };
  }
}

export async function getAllUsers(options?: {
  role?: 'founder' | 'mentor' | 'admin';
  cohortId?: string;
  status?: 'active' | 'pending' | 'suspended';
}) {
  const session = await getSession();
  if (!session?.user) {
    return [];
  }

  if (session.user.role !== 'admin') {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      ...(options?.role && { role: options.role }),
      ...(options?.cohortId && { cohortId: options.cohortId }),
      ...(options?.status && { status: options.status }),
    },
    include: {
      cohort: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    role: u.role as 'founder' | 'mentor' | 'admin',
    cohortId: u.cohortId,
    cohortName: u.cohort?.name,
    status: u.status as 'active' | 'pending' | 'suspended',
    linkedinUrl: u.linkedinUrl,
    createdAt: u.createdAt,
  }));
}
