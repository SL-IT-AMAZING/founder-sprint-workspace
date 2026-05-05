import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAssignmentDeadlineReminderEmail } from "@/lib/email";
import { getRecipientEmail } from "@/lib/email-routing";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getKstDayStartUtc(base: Date, daysFromTodayKst: number) {
  const shifted = new Date(base.getTime() + KST_OFFSET_MS);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate() + daysFromTodayKst,
      -9,
      0,
      0,
      0
    )
  );
}

function isAuthorized(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") return true;

  const cronHeader = request.headers.get("x-vercel-cron");
  if (cronHeader) return true;

  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader === `Bearer ${secret}`) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isDev = process.env.NODE_ENV !== "production";
  const searchParams = request.nextUrl.searchParams;
  const testAssignmentId = isDev ? searchParams.get("assignmentId") : null;
  const overrideEmail = isDev ? searchParams.get("overrideEmail") : null;
  const now = new Date();
  const windowStart = getKstDayStartUtc(now, 1);
  const windowEnd = getKstDayStartUtc(now, 2);

  const assignments = await prisma.assignment.findMany({
    where: {
      ...(testAssignmentId ? { id: testAssignmentId } : {}),
      ...(!testAssignmentId
        ? {
            dueDate: {
              gt: windowStart,
              lte: windowEnd,
            },
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      targetCompanyIds: true,
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
                  notificationEmail: true,
                  companyMemberships: {
                    where: { isCurrent: true },
                    select: { companyId: true },
                  },
                },
              },
            },
          },
        },
      },
      submissions: {
        select: { authorId: true },
      },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const summary = [] as Array<{ assignmentId: string; sent: number }>;

  for (const assignment of assignments) {
    const foundersInBatch = assignment.batch.userBatches;
    const submittedIdSet = new Set(assignment.submissions.map((submission) => submission.authorId));

    const expectedRecipients = assignment.targetCompanyIds.length > 0
      ? foundersInBatch.filter((userBatch) =>
          userBatch.user.companyMemberships.some((membership) =>
            assignment.targetCompanyIds.includes(membership.companyId)
          )
        )
      : foundersInBatch;

    const recipients = expectedRecipients
      .filter((userBatch) => !submittedIdSet.has(userBatch.userId))
      .map((userBatch) => userBatch.user);

    const finalRecipients = overrideEmail
      ? recipients.map((recipient) => ({ ...recipient, email: overrideEmail, notificationEmail: null }))
      : recipients;

    const existingNotifications = finalRecipients.length > 0 && !overrideEmail
      ? await prisma.notification.findMany({
          where: {
            type: "assignment_deadline_reminder",
            entityId: assignment.id,
            userId: { in: finalRecipients.map((recipient) => recipient.id) },
          },
          select: { userId: true },
        })
      : [];

    const remindedUserIds = new Set(existingNotifications.map((notification) => notification.userId));
    const unsentRecipients = overrideEmail
      ? finalRecipients
      : finalRecipients.filter((recipient) => !remindedUserIds.has(recipient.id));

    if (unsentRecipients.length > 0) {
      const sendResults = await Promise.all(
        unsentRecipients.map((recipient) =>
          sendAssignmentDeadlineReminderEmail({
            to: getRecipientEmail(recipient),
            recipientName: recipient.name,
            assignmentTitle: assignment.title,
            dueDate: assignment.dueDate,
            assignmentUrl: `${appUrl}/assignments/${assignment.id}`,
          })
        )
      );

      const deliveredRecipients = unsentRecipients.filter((_, index) => sendResults[index]?.success);

      if (!overrideEmail && deliveredRecipients.length > 0) {
        await prisma.notification.createMany({
          data: deliveredRecipients.map((recipient) => ({
            type: "assignment_deadline_reminder",
            userId: recipient.id,
            entityId: assignment.id,
            title: `Reminder: ${assignment.title} is due soon`,
            message: "Automatic due-tomorrow reminder sent.",
          })),
        });
      }

      summary.push({ assignmentId: assignment.id, sent: deliveredRecipients.length });
      continue;
    }

    summary.push({ assignmentId: assignment.id, sent: 0 });
  }

  return NextResponse.json({
    processedAssignments: assignments.length,
    summary,
  });
}
