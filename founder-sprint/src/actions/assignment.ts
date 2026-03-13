"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff, isFounder, canCreateAssignment, isAdmin } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";
import { sendAssignmentPublishedEmail, sendAssignmentFeedbackEmail, sendAssignmentDeadlineReminderEmail, sendSubmissionCompletedEmail } from "@/lib/email";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

const CreateAssignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  templateUrl: z.string().url().optional().or(z.literal("")),
  dueDate: z.string().transform((s) => new Date(s)),
  targetGroupId: z.string().uuid().optional().or(z.literal("")),
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

type AssignmentTargetsResult =
  | { error: string }
  | {
      targetGroupId: string | null;
      targetUserIds: string[];
    };

async function resolveAssignmentTargets(batchId: string, formData: FormData): Promise<AssignmentTargetsResult> {
  const targetGroupIdRaw = (formData.get("targetGroupId") as string | null)?.trim() || "";
  const targetUserIdsRaw = formData
    .getAll("targetUserIds")
    .map((value) => value.toString().trim())
    .filter(Boolean);
  const targetUserIds = [...new Set(targetUserIdsRaw)];

  if (targetGroupIdRaw && targetUserIds.length > 0) {
    return { error: "Choose either a target group or specific users, not both." };
  }

  if (targetGroupIdRaw) {
    const group = await prisma.group.findFirst({
      where: { id: targetGroupIdRaw, batchId },
      select: { id: true },
    });
    if (!group) {
      return { error: "Selected target group is invalid for this batch." };
    }
  }

  if (targetUserIds.length > 0) {
    const batchUsers = await prisma.userBatch.findMany({
      where: {
        batchId,
        status: "active",
        role: { in: ["founder", "co_founder"] },
        userId: { in: targetUserIds },
      },
      select: { userId: true },
    });
    if (batchUsers.length !== targetUserIds.length) {
      return { error: "Some selected users are not active founders in this batch." };
    }
  }

  return {
    targetGroupId: targetGroupIdRaw || null,
    targetUserIds,
  };
}

async function getAssignmentRecipientUsers(assignment: {
  id: string;
  title: string;
  batchId: string;
  dueDate: Date;
  targetGroupId: string | null;
  targetUserIds: string[];
}) {
  if (assignment.targetUserIds.length > 0) {
    return prisma.user.findMany({
      where: { id: { in: assignment.targetUserIds }, status: "active" },
      select: { id: true, email: true, name: true },
    });
  }

  if (assignment.targetGroupId) {
    return prisma.user.findMany({
      where: {
        status: "active",
        userBatches: {
          some: {
            batchId: assignment.batchId,
            status: "active",
            role: { in: ["founder", "co_founder"] },
          },
        },
        groupMembers: {
          some: { groupId: assignment.targetGroupId },
        },
      },
      select: { id: true, email: true, name: true },
    });
  }

  return prisma.user.findMany({
    where: {
      status: "active",
      userBatches: {
        some: {
          batchId: assignment.batchId,
          status: "active",
          role: { in: ["founder", "co_founder"] },
        },
      },
    },
    select: { id: true, email: true, name: true },
  });
}

export async function createAssignment(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!canCreateAssignment(user.role)) {
    return { success: false, error: "Unauthorized: staff only" };
  }

  const parsed = CreateAssignmentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    templateUrl: formData.get("templateUrl") || undefined,
    dueDate: formData.get("dueDate"),
    targetGroupId: formData.get("targetGroupId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  // Determine target batch: admin can pick any active batch via form
  const formBatchId = formData.get("batchId") as string | null;
  let targetBatchId = user.batchId;

  if (formBatchId && isAdmin(user.role)) {
    // Validate the target batch exists and is active
    const targetBatch = await prisma.batch.findUnique({
      where: { id: formBatchId },
      select: { id: true, status: true },
    });
    if (!targetBatch) {
      return { success: false, error: "Target batch not found" };
    }
    if (targetBatch.status !== "active") {
      return { success: false, error: "Target batch is not active" };
    }
    targetBatchId = formBatchId;
  } else if (!user.batchId) {
    return { success: false, error: "No active batch context" };
  }

  // Normalize dueDate to KST 23:59:59 (14:59:59 UTC)
  const dueDateInput = formData.get("dueDate") as string;
  let normalizedDueDate = parsed.data.dueDate;

  if (dueDateInput && !dueDateInput.includes("T") && !dueDateInput.includes(":")) {
    const datePart = dueDateInput.split(" ")[0];
    normalizedDueDate = new Date(`${datePart}T14:59:59.000Z`);
  }

  const targets = await resolveAssignmentTargets(targetBatchId, formData);
  if ("error" in targets) {
    return { success: false, error: (targets as { error: string }).error };
  }
  const resolvedTargets: { targetGroupId: string | null; targetUserIds: string[] } = targets;

  const assignment = await prisma.assignment.create({
    data: {
      batchId: targetBatchId,
      title: parsed.data.title,
      description: parsed.data.description,
      templateUrl: parsed.data.templateUrl || null,
      targetGroupId: resolvedTargets.targetGroupId,
      targetUserIds: resolvedTargets.targetUserIds,
      dueDate: normalizedDueDate,
    },
  });

  const recipients = await getAssignmentRecipientUsers({
    id: assignment.id,
    title: assignment.title,
    batchId: assignment.batchId,
    dueDate: assignment.dueDate,
    targetGroupId: assignment.targetGroupId,
    targetUserIds: assignment.targetUserIds,
  });

  if (recipients.length > 0) {
    await prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        type: "assignment_assigned",
        userId: recipient.id,
        entityId: assignment.id,
        title: `New assignment: ${assignment.title}`,
        message: `Due ${assignment.dueDate.toLocaleDateString()}`,
      })),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const assignmentUrl = `${appUrl}/assignments/${assignment.id}`;
    await Promise.all(
      recipients.map((recipient) =>
        sendAssignmentPublishedEmail({
          to: recipient.email,
          recipientName: recipient.name,
          assignmentTitle: assignment.title,
          dueDate: assignment.dueDate,
          assignmentUrl,
        })
      )
    );
  }

  revalidatePath("/assignments");
  revalidateTag(`assignments-${targetBatchId}`);
  revalidateTag("assignments-all");
  return { success: true, data: { id: assignment.id } };
}

const UpdateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  dueDate: z.string().transform((s) => new Date(s)).optional(),
  targetGroupId: z.string().uuid().optional().or(z.literal("")),
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
    targetGroupId: formData.get("targetGroupId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  // Check if assignment exists
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, batchId: true },
  });

  if (!assignment) {
    return { success: false, error: "Assignment not found" };
  }

  const updateData: Record<string, any> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate;

  const targets = await resolveAssignmentTargets(assignment.batchId, formData);
  if ("error" in targets) {
    return { success: false, error: (targets as { error: string }).error };
  }
  const resolvedTargets: { targetGroupId: string | null; targetUserIds: string[] } = targets;
  updateData.targetGroupId = resolvedTargets.targetGroupId;
  updateData.targetUserIds = resolvedTargets.targetUserIds;

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

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admins only" };
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, batchId: true },
  });

  if (!assignment) {
    return { success: false, error: "Assignment not found" };
  }

  // Cascade delete: Prisma schema has onDelete: Cascade for submissions
  await prisma.assignment.delete({
    where: { id: assignmentId },
  });

  revalidatePath("/assignments");
  revalidateTag(`assignments-${assignment.batchId}`);
  revalidateTag("assignments-all");
  return { success: true, data: undefined };
}

export async function getAssignments(batchId?: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const founderVisibilityWhere = {
    OR: [
      { targetGroupId: null, targetUserIds: { isEmpty: true } },
      { targetUserIds: { has: user.id } },
      { targetGroup: { members: { some: { userId: user.id } } } },
    ],
  };

  // Admin with no batchId filter = all batches
  if (!batchId && isAdmin(user.role)) {
    return unstable_cache(
      () =>
        prisma.assignment.findMany({
          orderBy: { dueDate: "desc" },
          include: {
            batch: { select: { id: true, name: true } },
            targetGroup: { select: { id: true, name: true } },
            _count: { select: { submissions: true } },
          },
        }),
      ["assignments-all"],
      { revalidate: 60, tags: ["assignments-all"] }
    )();
  }

  // Specific batch
  const targetBatchId = batchId || user.batchId;
  if (!isAdmin(user.role) && user.batchId !== targetBatchId) return [];

   if (isFounder(user.role)) {
    return prisma.assignment.findMany({
      where: {
        batchId: targetBatchId,
        ...founderVisibilityWhere,
      },
      orderBy: { dueDate: "desc" },
      include: {
        batch: { select: { id: true, name: true } },
        targetGroup: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
    });
  }

  return unstable_cache(
    () =>
      prisma.assignment.findMany({
        where: { batchId: targetBatchId },
        orderBy: { dueDate: "desc" },
        include: {
          batch: { select: { id: true, name: true } },
          targetGroup: { select: { id: true, name: true } },
          _count: { select: { submissions: true } },
        },
      }),
    [`assignments-${targetBatchId}`],
    { revalidate: 60, tags: [`assignments-${targetBatchId}`] }
  )();
}

export async function getAssignmentTargetOptions(batchId?: string) {
  const user = await getCurrentUser();
  if (!user) return { groups: [], users: [] };

  const targetBatchId = batchId || user.batchId;
  if (!isAdmin(user.role) && user.batchId !== targetBatchId) {
    return { groups: [], users: [] };
  }

  const [groups, users] = await Promise.all([
    prisma.group.findMany({
      where: { batchId: targetBatchId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.userBatch.findMany({
      where: {
        batchId: targetBatchId,
        status: "active",
        role: { in: ["founder", "co_founder"] },
      },
      select: {
        userId: true,
        role: true,
        user: {
          select: {
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    }),
  ]);

  return {
    groups,
    users: users.map((ub) => ({
      id: ub.userId,
      name: ub.user.name,
      email: ub.user.email,
      profileImage: ub.user.profileImage,
      role: ub.role,
    })),
  };
}

export async function getAssignmentNonSubmitters(assignmentId: string) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return [];

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      ...(isAdmin(user.role) ? {} : { batchId: { in: user.userBatchIds } }),
    },
    select: {
      targetGroupId: true,
      targetUserIds: true,
      submissions: {
        select: { authorId: true },
      },
      batch: {
        select: {
          userBatches: {
            where: {
              status: "active",
              role: { in: ["founder", "co_founder"] },
            },
            select: {
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      },
      targetGroup: {
        select: {
          members: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!assignment) return [];

  const foundersInBatch = assignment.batch.userBatches;
  const founderIdSet = new Set(foundersInBatch.map((ub) => ub.userId));
  const submittedIdSet = new Set(assignment.submissions.map((submission) => submission.authorId));

  let expectedIds: string[];
  if (assignment.targetUserIds.length > 0) {
    expectedIds = assignment.targetUserIds.filter((id) => founderIdSet.has(id));
  } else if (assignment.targetGroupId) {
    expectedIds = (assignment.targetGroup?.members || [])
      .map((member) => member.userId)
      .filter((id) => founderIdSet.has(id));
  } else {
    expectedIds = Array.from(founderIdSet);
  }

  const expectedIdSet = new Set(expectedIds);

  return foundersInBatch
    .filter((ub) => expectedIdSet.has(ub.userId) && !submittedIdSet.has(ub.userId))
    .map((ub) => ub.user);
}

export async function sendAssignmentDeadlineReminders(assignmentId: string): Promise<ActionResult<{ sent: number }>> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      ...(isAdmin(user.role) ? {} : { batchId: { in: user.userBatchIds } }),
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
    },
  });

  if (!assignment) {
    return { success: false, error: "Assignment not found" };
  }

  const recipients = await getAssignmentNonSubmitters(assignmentId);
  if (recipients.length === 0) {
    return { success: true, data: { sent: 0 } };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const assignmentUrl = `${appUrl}/assignments/${assignment.id}`;

  await Promise.all(
    recipients.map((recipient) =>
      sendAssignmentDeadlineReminderEmail({
        to: recipient.email,
        recipientName: recipient.name,
        assignmentTitle: assignment.title,
        dueDate: assignment.dueDate,
        assignmentUrl,
      })
    )
  );

  return { success: true, data: { sent: recipients.length } };
}

export async function getAssignment(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const assignment = await prisma.assignment.findFirst({
    where: {
      id,
      ...(isAdmin(user.role) ? {} : { batchId: { in: user.userBatchIds } }),
    },
    include: {
      targetGroup: {
        select: {
          id: true,
          name: true,
        },
      },
      submissions: {
        include: {
          author: true,
          versions: {
            orderBy: { version: "desc" },
          },
          feedbacks: {
            include: {
              author: true,
              replies: {
                include: {
                  author: true,
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) return null;

  if (isFounder(user.role)) {
    const isDirectTarget = assignment.targetUserIds.includes(user.id);
    const isOpenToAll = !assignment.targetGroupId && assignment.targetUserIds.length === 0;
    const inTargetGroup = assignment.targetGroupId
      ? !!(await prisma.groupMember.findFirst({
          where: { groupId: assignment.targetGroupId, userId: user.id },
          select: { id: true },
        }))
      : false;

    if (!isOpenToAll && !isDirectTarget && !inTargetGroup) {
      return null;
    }
  }

  return assignment;
}

export async function submitAssignment(
  assignmentId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const batchCheck = await requireActiveBatch(user.batchId, user.role);
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
    select: { id: true, title: true, dueDate: true, batchId: true, targetGroupId: true, targetUserIds: true },
  });

  if (!assignment) {
    return { success: false, error: "Assignment not found" };
  }

  const now = new Date();
  const isLate = now > assignment.dueDate;

  const isTargetedToUser = assignment.targetUserIds.includes(user.id);
  const isOpenToAll = !assignment.targetGroupId && assignment.targetUserIds.length === 0;
  const inTargetGroup = assignment.targetGroupId
    ? !!(await prisma.groupMember.findFirst({
        where: { groupId: assignment.targetGroupId, userId: user.id },
        select: { id: true },
      }))
    : false;

  if (!isOpenToAll && !isTargetedToUser && !inTargetGroup) {
    return { success: false, error: "You are not in the target scope for this assignment" };
  }

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_authorId: {
        assignmentId,
        authorId: user.id,
      },
    },
    include: {
      versions: {
        select: { version: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  const submission = existingSubmission
    ? await prisma.$transaction(async (tx) => {
        const nextVersion = (existingSubmission.versions[0]?.version || 0) + 1;
        await tx.submissionVersion.create({
          data: {
            submissionId: existingSubmission.id,
            version: nextVersion,
            content: existingSubmission.content,
            linkUrl: existingSubmission.linkUrl,
          },
        });

        return tx.submission.update({
          where: { id: existingSubmission.id },
          data: {
            content: parsed.data.content || null,
            linkUrl: parsed.data.linkUrl || null,
            isLate,
            submittedAt: now,
          },
        });
      })
    : await prisma.submission.create({
        data: {
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

  const adminRecipients = await prisma.userBatch.findMany({
    where: {
      batchId: assignment.batchId,
      status: "active",
      OR: [
        { role: { in: ["admin", "mentor"] } },
        { additionalRoles: { has: "admin" } },
        { additionalRoles: { has: "mentor" } },
      ],
    },
    select: {
      userId: true,
      user: { select: { email: true, name: true } },
    },
  });

  if (adminRecipients.length > 0) {
    await prisma.notification.createMany({
      data: adminRecipients.map((recipient) => ({
        type: "submission_completed",
        userId: recipient.userId,
        entityId: submission.id,
        title: `Submission received: ${assignment.title}`,
        message: `${user.name || user.email} submitted work`,
      })),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const submissionUrl = `${appUrl}/submissions/${submission.id}`;
    await Promise.all(
      adminRecipients.map((recipient) =>
        sendSubmissionCompletedEmail({
          to: recipient.user.email,
          founderName: user.name || user.email,
          assignmentTitle: assignment.title,
          submissionUrl,
        })
      )
    );
  }

  return { success: true, data: { id: submission.id } };
}

export async function getSubmission(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      author: true,
      assignment: true,
      versions: {
        orderBy: { version: "desc" },
      },
      feedbacks: {
        include: {
          author: true,
          replies: {
            include: {
              author: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!submission) return null;
  if (isStaff(user.role)) return submission;
  if (submission.authorId !== user.id) return null;

  return submission;
}

export async function getSubmissions(batchId?: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  // Admin with no batchId filter = all batches
  if (!batchId && isAdmin(user.role)) {
    return unstable_cache(
      () =>
        prisma.submission.findMany({
          include: {
            author: true,
            assignment: {
              include: {
                batch: { select: { id: true, name: true } },
                targetGroup: { select: { id: true, name: true } },
              },
            },
            feedbacks: {
              select: { id: true },
            },
          },
          orderBy: { submittedAt: "desc" },
        }),
      ["submissions-all"],
      { revalidate: 60, tags: ["submissions-all"] }
    )();
  }

  // Specific batch
  const targetBatchId = batchId || user.batchId;
  if (!isAdmin(user.role) && user.batchId !== targetBatchId) return [];

  return unstable_cache(
    () =>
        prisma.submission.findMany({
          where: { assignment: { batchId: targetBatchId } },
          include: {
            author: true,
            assignment: {
              include: {
                batch: { select: { id: true, name: true } },
                targetGroup: { select: { id: true, name: true } },
              },
            },
            feedbacks: {
              select: { id: true },
            },
          },
          orderBy: { submittedAt: "desc" },
        }),
    [`submissions-${targetBatchId}`],
    { revalidate: 60, tags: [`submissions-${targetBatchId}`] }
  )();
}

export type SubmissionStatus = "pending" | "in_review" | "approved" | "needs_revision";

const VALID_SUBMISSION_STATUSES: SubmissionStatus[] = ["pending", "in_review", "approved", "needs_revision"];

export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isStaff(user.role)) {
    return { success: false, error: "Unauthorized: staff only" };
  }

  if (!VALID_SUBMISSION_STATUSES.includes(status)) {
    return { success: false, error: "Invalid status value" };
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      assignmentId: true,
      authorId: true,
      assignment: { select: { title: true } },
      author: { select: { email: true, name: true } },
    },
  });

  if (!submission) {
    return { success: false, error: "Submission not found" };
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status },
  });

  await prisma.notification.create({
    data: {
      type: "submission_status",
      userId: submission.authorId,
      entityId: submission.id,
      title: `Submission status updated: ${submission.assignment.title}`,
      message: `New status: ${status}`,
    },
  });

  revalidatePath(`/submissions/${submissionId}`);
  revalidatePath(`/assignments/${submission.assignmentId}`);
  revalidateTag(`assignment-${submission.assignmentId}`);
  revalidateTag(`submissions-${user.batchId}`);
  revalidateTag("submissions-all");

  return { success: true, data: undefined };
}

export type ChecklistItem = { label: string; checked: boolean };

export async function addFeedback(
  submissionId: string,
  content: string,
  checklist?: ChecklistItem[],
  parentId?: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isStaff(user.role) && !isFounder(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  if (!content.trim()) {
    return { success: false, error: "Feedback content is required" };
  }

  if (content.length > 3000) {
    return { success: false, error: "Feedback content exceeds maximum length of 3000 characters" };
  }

  const submissionAccess = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, authorId: true },
  });

  if (!submissionAccess) {
    return { success: false, error: "Submission not found" };
  }

  if (isFounder(user.role) && submissionAccess.authorId !== user.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (parentId) {
    const parentFeedback = await prisma.feedback.findUnique({
      where: { id: parentId },
      select: { id: true, submissionId: true },
    });
    if (!parentFeedback || parentFeedback.submissionId !== submissionId) {
      return { success: false, error: "Invalid parent feedback" };
    }
  }

  const feedback = await prisma.feedback.create({
    data: {
      submissionId,
      authorId: user.id,
      content: content.trim(),
      parentId: parentId || null,
      checklist: checklist && checklist.length > 0 ? checklist : undefined,
    },
  });

  // Get assignment ID for revalidation
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      assignmentId: true,
      authorId: true,
      assignment: {
        select: {
          title: true,
        },
      },
      author: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (submission) {
    if (submission.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          type: parentId ? "assignment_feedback_reply" : "assignment_feedback",
          userId: submission.authorId,
          entityId: submissionId,
          title: parentId
            ? `New reply on ${submission.assignment.title}`
            : `New feedback on ${submission.assignment.title}`,
          message: content.trim().slice(0, 220),
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const submissionUrl = `${appUrl}/submissions/${submissionId}`;
      await sendAssignmentFeedbackEmail({
        to: submission.author.email,
        recipientName: submission.author.name,
        assignmentTitle: submission.assignment.title,
        feedbackContent: content.trim(),
        submissionUrl,
        isReply: !!parentId,
      });
    }

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
