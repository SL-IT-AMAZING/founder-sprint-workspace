import nodemailer from "nodemailer";

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
  if (!transporter) {
    console.warn("Email not configured - GMAIL_USER or GMAIL_APP_PASSWORD missing");
    return { success: false, error: "Email service not configured" };
  }

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
              <h2 style="font-size: 20px; color: #2F2C26; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Hello ${inviteeName}!</h2>

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
