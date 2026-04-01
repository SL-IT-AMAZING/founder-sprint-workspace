import { NextResponse } from "next/server";
import {
  sendInvitationEmail,
  sendOfficeHourRequestEmail,
  sendOfficeHourApprovalEmail,
  sendAssignmentPublishedEmail,
  sendAssignmentFeedbackEmail,
  sendAssignmentDeadlineReminderEmail,
  sendSubmissionCompletedEmail,
} from "@/lib/email";

const TEST_EMAIL = "slit.amazing@gmail.com";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const tomorrow = new Date(Date.now() + 86400000);
  const tomorrowEnd = new Date(Date.now() + 86400000 + 3600000);
  const results: Record<string, { success: boolean; error?: string }> = {};

  results["1_invitation"] = await sendInvitationEmail({
    to: TEST_EMAIL,
    inviteeName: "Test User",
    batchName: "Spring 2026 Batch",
    role: "founder",
    inviteLink: "https://example.com/invite/test-token",
  });

  results["2_office_hour_request"] = await sendOfficeHourRequestEmail({
    to: TEST_EMAIL,
    hostName: "Mentor Kim",
    requesterName: "Founder Park",
    companyName: "TestCo",
    startTime: tomorrow,
    endTime: tomorrowEnd,
    agenda: "Discuss product-market fit strategy",
    message: "Would love to get your feedback on our pivot direction.",
  });

  results["3_office_hour_approval"] = await sendOfficeHourApprovalEmail({
    to: [TEST_EMAIL],
    hostName: "Mentor Kim",
    startTime: tomorrow,
    endTime: tomorrowEnd,
    meetLink: "https://meet.google.com/test-meet-link",
    companyName: "TestCo",
  });

  results["4_assignment_published"] = await sendAssignmentPublishedEmail({
    to: TEST_EMAIL,
    recipientName: "Test Founder",
    assignmentTitle: "Week 3: Business Model Canvas",
    dueDate: new Date(Date.now() + 7 * 86400000),
    assignmentUrl: "https://example.com/assignments/test-id",
  });

  results["5_assignment_feedback"] = await sendAssignmentFeedbackEmail({
    to: TEST_EMAIL,
    recipientName: "Test Founder",
    assignmentTitle: "Week 3: Business Model Canvas",
    feedbackContent: "Great work on the value proposition section. Consider expanding the customer segment analysis.",
    submissionUrl: "https://example.com/submissions/test-id",
  });

  results["6_deadline_reminder"] = await sendAssignmentDeadlineReminderEmail({
    to: TEST_EMAIL,
    recipientName: "Test Founder",
    assignmentTitle: "Week 3: Business Model Canvas",
    dueDate: new Date(Date.now() + 2 * 86400000),
    assignmentUrl: "https://example.com/assignments/test-id",
  });

  results["7_submission_completed"] = await sendSubmissionCompletedEmail({
    to: TEST_EMAIL,
    founderName: "Founder Park",
    assignmentTitle: "Week 3: Business Model Canvas",
    submissionUrl: "https://example.com/submissions/test-id",
  });

  const successCount = Object.values(results).filter((r) => r.success).length;
  const failCount = Object.values(results).filter((r) => !r.success).length;

  return NextResponse.json({
    summary: `${successCount} sent, ${failCount} failed`,
    target: TEST_EMAIL,
    results,
  });
}
