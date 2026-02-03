import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface InvitationEmailParams {
  to: string;
  inviteeName: string;
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
  if (!resend) {
    console.warn("Resend not configured - RESEND_API_KEY missing");
    return { success: false, error: "Email service not configured" };
  }

  const roleDisplayName = {
    admin: "Admin",
    mentor: "Mentor",
    founder: "Founder",
    co_founder: "Co-founder",
  }[role] || role;

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Founder Sprint <onboarding@resend.dev>",
      to: [to],
      subject: `You're invited to join ${batchName} as ${roleDisplayName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Founder Sprint</h1>
          </div>

          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="margin-top: 0;">Hello ${inviteeName}!</h2>

            <p>You've been invited to join <strong>${batchName}</strong> as a <strong>${roleDisplayName}</strong>.</p>

            <p>Click the button below to accept your invitation and get started:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Join Now
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              This invitation link will expire in <strong>7 days</strong>.
            </p>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">

            <p style="color: #888; font-size: 12px; margin-bottom: 0;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send invitation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error sending invitation email:", err);
    return { success: false, error: "Failed to send email" };
  }
}
