import nodemailer from "nodemailer";
import { displayRangeInUserTimezone } from "@/lib/timezone";

const transporter =
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })
    : null;

function hasUndeliverableRecipient(to: string | string[]): boolean {
  const addresses = Array.isArray(to) ? to : [to];
  return addresses.some((addr) => addr.endsWith("@example.com"));
}

interface InvitationEmailParams {
  to: string;
  inviteeName?: string;
  batchName: string;
  role: string;
  inviteLink: string;
}

export async function sendInvitationEmail({
  to,
  inviteeName,
  batchName,
  role,
  inviteLink,
}: InvitationEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    console.warn("Email not configured - GMAIL_USER or GMAIL_APP_PASSWORD missing");
    return { success: false, error: "Email service not configured" };
  }
  if (hasUndeliverableRecipient(to)) return { success: true };

  const roleDisplayName = {
    admin: "Admin",
    mentor: "Mentor",
    founder: "Founder",
    co_founder: "Co-founder",
  }[role] || role;

  try {
    await transporter.sendMail({
      from: `Founder Sprint <${process.env.GMAIL_USER}>`,
      to,
      subject: `You're invited to join ${batchName} as ${roleDisplayName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'BDO Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #fefaf3;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

            <div style="background: #2F2C26; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; font-family: 'BDO Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Founder Sprint</h1>
            </div>

            <div style="background: #ffffff; padding: 32px; border: 1px solid #e0d6c8; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="font-size: 20px; color: #2F2C26; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Hello${inviteeName ? ` ${inviteeName}` : ""}!</h2>

              <p style="font-size: 15px; color: #2F2C26; line-height: 1.6; margin-bottom: 12px;">
                You've been invited to join <strong>${batchName}</strong> as a <strong>${roleDisplayName}</strong>.
              </p>

              <p style="font-size: 15px; color: #2F2C26; line-height: 1.6; margin-bottom: 24px;">
                Click the button below to accept your invitation and get started:
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" style="background: #1A1A1A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                  Join Now
                </a>
              </div>

              <p style="font-size: 13px; color: #666666; margin-bottom: 24px;">
                This invitation link will expire in <strong>7 days</strong>.
              </p>

              <hr style="border: none; border-top: 1px solid #e0d6c8; margin: 24px 0;">

              <p style="font-size: 12px; color: #999999; margin-bottom: 0;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    return { success: true };
  } catch (err) {
    console.error("Error sending invitation email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

interface OfficeHourRequestEmailParams {
  to: string;
  hostName: string;
  requesterName: string;
  companyName?: string;
  startTime: Date;
  endTime: Date;
  agenda?: string;
  message?: string;
}

export async function sendOfficeHourRequestEmail({
  to,
  hostName,
  requesterName,
  companyName,
  startTime,
  endTime,
  agenda,
  message,
}: OfficeHourRequestEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    console.warn("Email not configured - GMAIL_USER or GMAIL_APP_PASSWORD missing");
    return { success: false, error: "Email service not configured" };
  }
  if (hasUndeliverableRecipient(to)) return { success: true };

  const dateTimeStr = displayRangeInUserTimezone(startTime, endTime, null, "UTC");

  try {
    await transporter.sendMail({
      from: `Founder Sprint <${process.env.GMAIL_USER}>`,
      to,
      subject: `Office Hour Request from ${requesterName}${companyName ? ` (${companyName})` : ""}`,  
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: 'BDO Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #fefaf3;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: #2F2C26; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">Founder Sprint</h1>
            </div>
            <div style="background: #ffffff; padding: 32px; border: 1px solid #e0d6c8; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="font-size: 20px; color: #2F2C26; font-weight: 600; margin-top: 0;">New Office Hour Request</h2>
              <p style="font-size: 15px; color: #2F2C26; line-height: 1.6;">
                <strong>${requesterName}</strong>${companyName ? ` from <strong>${companyName}</strong>` : ""} has requested an office hour with you.
              </p>
              <div style="background: #fefaf3; border: 1px solid #e0d6c8; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;">When: <strong style="color: #2F2C26;">${dateTimeStr}</strong></p>
              </div>
              ${agenda ? `<p style="font-size: 14px; color: #2F2C26; margin-top: 16px;"><strong>Agenda:</strong> ${agenda}</p>` : ""}
              ${message ? `<p style="font-size: 14px; color: #2F2C26; background: #f5f5f5; padding: 12px; border-radius: 6px; border-left: 3px solid #2F2C26;"><em>"${message}"</em></p>` : ""}
              <p style="font-size: 14px; color: #666; margin-top: 24px;">
                Log in to Founder Sprint to approve or decline this request.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("Error sending office hour request email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

interface OfficeHourApprovalEmailParams {
  to: string[];
  hostName: string;
  startTime: Date;
  endTime: Date;
  meetLink?: string;
  companyName?: string;
}

interface AssignmentDeadlineReminderEmailParams {
  to: string;
  recipientName?: string | null;
  assignmentTitle: string;
  dueDate: Date;
  assignmentUrl: string;
}

interface FeedMentionEmailParams {
  to: string;
  recipientName?: string | null;
  authorName: string;
  postExcerpt: string;
  postUrl: string;
}

interface SubmissionCompletedEmailParams {
  to: string;
  founderName?: string | null;
  assignmentTitle: string;
  submissionUrl: string;
}

interface FeedReplyNotificationEmailParams {
  to: string;
  recipientName?: string | null;
  replierName: string;
  replyContent: string;
  postUrl: string;
}

interface AssignmentPublishedEmailParams {
  to: string;
  recipientName?: string | null;
  assignmentTitle: string;
  dueDate: Date;
  assignmentUrl: string;
}

export async function sendAssignmentPublishedEmail({
  to,
  recipientName,
  assignmentTitle,
  dueDate,
  assignmentUrl,
}: AssignmentPublishedEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    console.warn("Email not configured - GMAIL_USER or GMAIL_APP_PASSWORD missing");
    return { success: false, error: "Email service not configured" };
  }
  if (hasUndeliverableRecipient(to)) return { success: true };

  try {
    await transporter.sendMail({
      from: `Founder Sprint <${process.env.GMAIL_USER}>`,
      to,
      subject: `New assignment: ${assignmentTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fefaf3; padding: 24px; color: #2F2C26;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e0d6c8; border-radius: 12px; overflow: hidden;">
            <div style="background: #2F2C26; color: white; padding: 20px 24px; font-size: 20px; font-weight: 700;">Founder Sprint</div>
            <div style="padding: 24px;">
              <p>Hello${recipientName ? ` ${recipientName}` : ""},</p>
              <p>A new assignment has been published: <strong>${assignmentTitle}</strong>.</p>
              <p>Due date: <strong>${dueDate.toLocaleDateString()}</strong></p>
              <p style="margin: 24px 0;">
                <a href="${assignmentUrl}" style="background: #1A1A1A; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block;">Open Assignment</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("Error sending assignment published email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

interface AssignmentFeedbackEmailParams {
  to: string;
  recipientName?: string | null;
  assignmentTitle: string;
  feedbackContent: string;
  submissionUrl: string;
  isReply?: boolean;
}

export async function sendAssignmentFeedbackEmail({
  to,
  recipientName,
  assignmentTitle,
  feedbackContent,
  submissionUrl,
  isReply = false,
}: AssignmentFeedbackEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    console.warn("Email not configured - GMAIL_USER or GMAIL_APP_PASSWORD missing");
    return { success: false, error: "Email service not configured" };
  }
  if (hasUndeliverableRecipient(to)) return { success: true };

  try {
    await transporter.sendMail({
      from: `Founder Sprint <${process.env.GMAIL_USER}>`,
      to,
      subject: isReply ? `New reply on ${assignmentTitle}` : `New feedback on ${assignmentTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fefaf3; padding: 24px; color: #2F2C26;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e0d6c8; border-radius: 12px; overflow: hidden;">
            <div style="background: #2F2C26; color: white; padding: 20px 24px; font-size: 20px; font-weight: 700;">Founder Sprint</div>
            <div style="padding: 24px;">
              <p>Hello${recipientName ? ` ${recipientName}` : ""},</p>
              <p>${isReply ? "A new reply was added" : "New feedback was added"} for <strong>${assignmentTitle}</strong>.</p>
              <blockquote style="margin: 16px 0; padding: 12px 16px; background: #f5f5f5; border-left: 4px solid #2F2C26;">
                ${feedbackContent}
              </blockquote>
              <p style="margin: 24px 0;">
                <a href="${submissionUrl}" style="background: #1A1A1A; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block;">View Submission</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("Error sending assignment feedback email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendOfficeHourApprovalEmail({
  to,
  hostName,
  startTime,
  endTime,
  meetLink,
  companyName,
}: OfficeHourApprovalEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    console.warn("Email not configured - GMAIL_USER or GMAIL_APP_PASSWORD missing");
    return { success: false, error: "Email service not configured" };
  }
  if (hasUndeliverableRecipient(to)) return { success: true };

  const dateTimeStr = displayRangeInUserTimezone(startTime, endTime, null, "UTC");

  try {
    await transporter.sendMail({
      from: `Founder Sprint <${process.env.GMAIL_USER}>`,
      to: to.join(", "),
      subject: `Office Hour Confirmed${companyName ? ` — ${companyName}` : ""} with ${hostName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: 'BDO Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #fefaf3;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: #2F2C26; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">Founder Sprint</h1>
            </div>
            <div style="background: #ffffff; padding: 32px; border: 1px solid #e0d6c8; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="font-size: 20px; color: #2F2C26; font-weight: 600; margin-top: 0;">Office Hour Confirmed ✅</h2>
              <p style="font-size: 14px; color: #666666; margin-top: 0;">Host: <strong style="color: #2F2C26;">${hostName}</strong></p>
              <p style="font-size: 15px; color: #2F2C26; line-height: 1.6;">
                Your office hour with <strong>${hostName}</strong>${companyName ? ` for <strong>${companyName}</strong>` : ""} has been approved.
              </p>
              <div style="background: #fefaf3; border: 1px solid #e0d6c8; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;">When: <strong style="color: #2F2C26;">${dateTimeStr}</strong></p>
              </div>
              ${meetLink ? `
              <div style="text-align: center; margin: 24px 0;">
                <a href="${meetLink}" style="background: #1A1A1A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                  Join Google Meet
                </a>
              </div>
              ` : ""}
              <p style="font-size: 13px; color: #666666;">
                ${meetLink ? "A Google Calendar invite has also been sent to your email." : "Please check your calendar for meeting details."}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("Error sending office hour approval email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendOfficeHourBookingConfirmEmail(params: OfficeHourApprovalEmailParams) {
  return sendOfficeHourApprovalEmail(params);
}

export async function sendAssignmentDeadlineReminderEmail({
  to,
  recipientName,
  assignmentTitle,
  dueDate,
  assignmentUrl,
}: AssignmentDeadlineReminderEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    console.warn("Email not configured - GMAIL_USER or GMAIL_APP_PASSWORD missing");
    return { success: false, error: "Email service not configured" };
  }
  if (hasUndeliverableRecipient(to)) return { success: true };

  try {
    await transporter.sendMail({
      from: `Founder Sprint <${process.env.GMAIL_USER}>`,
      to,
      subject: `Reminder: ${assignmentTitle} is due soon`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fefaf3; padding: 24px; color: #2F2C26;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e0d6c8; border-radius: 12px; overflow: hidden;">
            <div style="background: #2F2C26; color: white; padding: 20px 24px; font-size: 20px; font-weight: 700;">Founder Sprint</div>
            <div style="padding: 24px;">
              <p>Hello${recipientName ? ` ${recipientName}` : ""},</p>
              <p>This is a reminder that <strong>${assignmentTitle}</strong> is still awaiting your submission.</p>
              <p>Due date: <strong>${dueDate.toLocaleDateString()}</strong></p>
              <p style="margin: 24px 0;">
                <a href="${assignmentUrl}" style="background: #1A1A1A; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block;">Open Assignment</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("Error sending assignment reminder email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendSubmissionCompletedEmail({
  to,
  founderName,
  assignmentTitle,
  submissionUrl,
}: SubmissionCompletedEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    console.warn("Email not configured - GMAIL_USER or GMAIL_APP_PASSWORD missing");
    return { success: false, error: "Email service not configured" };
  }
  if (hasUndeliverableRecipient(to)) return { success: true };

  try {
    await transporter.sendMail({
      from: `Founder Sprint <${process.env.GMAIL_USER}>`,
      to,
      subject: `Submission received: ${assignmentTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fefaf3; padding: 24px; color: #2F2C26;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e0d6c8; border-radius: 12px; overflow: hidden;">
            <div style="background: #2F2C26; color: white; padding: 20px 24px; font-size: 20px; font-weight: 700;">Founder Sprint</div>
            <div style="padding: 24px;">
              <p>${founderName ? `<strong>${founderName}</strong>` : "A founder"} submitted work for <strong>${assignmentTitle}</strong>.</p>
              <p style="margin: 24px 0;">
                <a href="${submissionUrl}" style="background: #1A1A1A; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block;">View Submission</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("Error sending submission completed email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendFeedMentionEmail({
  to,
  recipientName,
  authorName,
  postExcerpt,
  postUrl,
}: FeedMentionEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    console.warn("Email not configured - GMAIL_USER or GMAIL_APP_PASSWORD missing");
    return { success: false, error: "Email service not configured" };
  }
  if (hasUndeliverableRecipient(to)) return { success: true };

  try {
    await transporter.sendMail({
      from: `Founder Sprint <${process.env.GMAIL_USER}>`,
      to,
      subject: `${authorName} mentioned you in a Founder Sprint post`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fefaf3; padding: 24px; color: #2F2C26;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e0d6c8; border-radius: 12px; overflow: hidden;">
            <div style="background: #2F2C26; color: white; padding: 20px 24px; font-size: 20px; font-weight: 700;">Founder Sprint</div>
            <div style="padding: 24px;">
              <p>Hello${recipientName ? ` ${recipientName}` : ""},</p>
              <p><strong>${authorName}</strong> mentioned you in a feed post.</p>
              <blockquote style="margin: 16px 0; padding: 12px 16px; background: #f8f5ee; border-left: 4px solid #e0d6c8; color: #4a463f;">
                ${postExcerpt}
              </blockquote>
              <p style="margin: 24px 0;">
                <a href="${postUrl}" style="background: #1A1A1A; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block;">Open Post</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("Error sending feed mention email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendFeedReplyNotificationEmail({
  to,
  recipientName,
  replierName,
  replyContent,
  postUrl,
}: FeedReplyNotificationEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    console.warn("Email not configured - GMAIL_USER or GMAIL_APP_PASSWORD missing");
    return { success: false, error: "Email service not configured" };
  }
  if (hasUndeliverableRecipient(to)) return { success: true };

  try {
    await transporter.sendMail({
      from: `Founder Sprint <${process.env.GMAIL_USER}>`,
      to,
      subject: `${replierName} replied to your comment`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fefaf3; padding: 24px; color: #2F2C26;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e0d6c8; border-radius: 12px; overflow: hidden;">
            <div style="background: #2F2C26; color: white; padding: 20px 24px; font-size: 20px; font-weight: 700;">Founder Sprint</div>
            <div style="padding: 24px;">
              <p>Hello${recipientName ? ` ${recipientName}` : ""},</p>
              <p><strong>${replierName}</strong> replied to your comment on the feed.</p>
              <blockquote style="margin: 16px 0; padding: 12px 16px; background: #f5f5f5; border-left: 4px solid #2F2C26; white-space: pre-wrap;">${replyContent}</blockquote>
              <p style="margin: 24px 0;">
                <a href="${postUrl}" style="background: #1A1A1A; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block;">View Reply</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("Error sending feed reply notification email:", err);
    return { success: false, error: "Failed to send email" };
  }
}
