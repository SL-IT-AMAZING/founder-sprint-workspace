'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const createPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  body: z.string().min(20, 'Post must be at least 20 characters'),
  tags: z.array(z.string()).optional().default([]),
});

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(5, 'Comment must be at least 5 characters'),
  parentId: z.string().uuid().optional(),
});

export async function createPost(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in to create a post' };
  }

  const rawData = {
    title: formData.get('title') as string,
    body: formData.get('body') as string,
    tags: formData.getAll('tags') as string[],
  };

  const parsed = createPostSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const post = await prisma.post.create({
      data: {
        ...parsed.data,
        authorId: session.user.id,
        cohortId: session.user.cohortId,
      },
    });

    revalidatePath('/community');
    redirect(`/community/${post.id}`);
  } catch (error) {
    console.error('Failed to create post:', error);
    return { error: 'Failed to create post. Please try again.' };
  }
}

export async function updatePost(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  const postId = formData.get('postId') as string;
  
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return { error: 'Post not found' };
  }

  if (post.authorId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'You are not authorized to edit this post' };
  }

  const rawData = {
    title: formData.get('title') as string,
    body: formData.get('body') as string,
    tags: formData.getAll('tags') as string[],
  };

  const parsed = createPostSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.post.update({
      where: { id: postId },
      data: parsed.data,
    });

    revalidatePath(`/community/${postId}`);
    revalidatePath('/community');
    return { success: true };
  } catch (error) {
    console.error('Failed to update post:', error);
    return { error: 'Failed to update post. Please try again.' };
  }
}

export async function deletePost(postId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return { error: 'Post not found' };
  }

  if (post.authorId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'You are not authorized to delete this post' };
  }

  try {
    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath('/community');
    redirect('/community');
  } catch (error) {
    console.error('Failed to delete post:', error);
    return { error: 'Failed to delete post. Please try again.' };
  }
}

export async function createComment(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in to comment' };
  }

  const rawData = {
    postId: formData.get('postId') as string,
    body: formData.get('body') as string,
    parentId: formData.get('parentId') as string || undefined,
  };

  const parsed = createCommentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const post = await prisma.post.findUnique({
    where: { id: parsed.data.postId },
  });

  if (!post) {
    return { error: 'Post not found' };
  }

  try {
    await prisma.comment.create({
      data: {
        body: parsed.data.body,
        postId: parsed.data.postId,
        authorId: session.user.id,
        parentId: parsed.data.parentId || null,
      },
    });

    revalidatePath(`/community/${parsed.data.postId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to create comment:', error);
    return { error: 'Failed to post comment. Please try again.' };
  }
}

export async function deleteComment(commentId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in' };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    return { error: 'Comment not found' };
  }

  if (comment.authorId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'You are not authorized to delete this comment' };
  }

  try {
    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath(`/community/${comment.postId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return { error: 'Failed to delete comment. Please try again.' };
  }
}

export async function likePost(postId: string) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'You must be logged in to like posts' };
  }

  try {
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      await prisma.postLike.delete({
        where: { id: existingLike.id },
      });
    } else {
      await prisma.postLike.create({
        data: {
          postId,
          userId: session.user.id,
        },
      });
    }

    revalidatePath(`/community/${postId}`);
    revalidatePath('/community');
    return { success: true };
  } catch (error) {
    console.error('Failed to like post:', error);
    return { error: 'Failed to like post. Please try again.' };
  }
}

export async function getPosts(options?: {
  cohortId?: string;
  authorId?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}) {
  const session = await getSession();
  if (!session?.user) {
    return { posts: [], total: 0 };
  }

  const where = {
    ...(options?.cohortId && { cohortId: options.cohortId }),
    ...(options?.authorId && { authorId: options.authorId }),
    ...(options?.tag && { tags: { has: options.tag } }),
    OR: [
      { cohortId: null },
      { cohortId: session.user.cohortId },
    ],
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
        likes: {
          where: { userId: session.user.id },
          select: { id: true },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      tags: p.tags,
      author: p.author,
      commentsCount: p._count.comments,
      likesCount: p._count.likes,
      isLiked: p.likes.length > 0,
      createdAt: p.createdAt,
    })),
    total,
  };
}
