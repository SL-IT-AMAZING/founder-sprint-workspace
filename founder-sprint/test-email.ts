/**
 * Standalone email test — run with: npx tsx test-email.ts
 * Tests all 5 notification email types against slit.amazing@gmail.com
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import nodemailer from "nodemailer";

const TO = "slit.amazing@gmail.com";

const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env / .env.local");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
});

async function send(label: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: `Founder Sprint <${GMAIL_USER}>`,
      to: TO,
      subject,
      html,
    });
    console.log(`[PASS] ${label} — messageId: ${info.messageId}`);
  } catch (err: any) {
    console.error(`[FAIL] ${label} — ${err.message}`);
  }
}

const wrap = (body: string) => `
<!DOCTYPE html><html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fefaf3;padding:24px;color:#2F2C26;">
<div style="max-width:600px;margin:0 auto;background:white;border:1px solid #e0d6c8;border-radius:12px;overflow:hidden;">
  <div style="background:#2F2C26;color:white;padding:20px 24px;font-size:20px;font-weight:700;">Founder Sprint - Email Test</div>
  <div style="padding:24px;">${body}</div>
</div></body></html>`;

async function main() {
  console.log(`\nSending 5 test emails to ${TO}...\n`);
  console.log(`Using GMAIL_USER: ${GMAIL_USER}\n`);

  // 1. Assignment Published
  await send(
    "Assignment Published",
    "[TEST] New assignment: Week 3 Pitch Deck",
    wrap(`
      <p>Hello Test Founder,</p>
      <p>A new assignment has been published: <strong>Week 3 Pitch Deck</strong>.</p>
      <p>Due date: <strong>${new Date(Date.now() + 7 * 86400000).toLocaleDateString()}</strong></p>
      <p style="margin:24px 0;">
        <a href="https://example.com/assignments/test" style="background:#1A1A1A;color:white;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;">Open Assignment</a>
      </p>
    `)
  );

  // 2. Deadline Reminder
  await send(
    "Deadline Reminder",
    "[TEST] Reminder: Week 3 Pitch Deck is due soon",
    wrap(`
      <p>Hello Test Founder,</p>
      <p>This is a reminder that <strong>Week 3 Pitch Deck</strong> is still awaiting your submission.</p>
      <p>Due date: <strong>${new Date(Date.now() + 86400000).toLocaleDateString()}</strong></p>
      <p style="margin:24px 0;">
        <a href="https://example.com/assignments/test" style="background:#1A1A1A;color:white;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;">Open Assignment</a>
      </p>
    `)
  );

  // 3. Submission Completed
  await send(
    "Submission Completed",
    "[TEST] Submission received: Week 3 Pitch Deck",
    wrap(`
      <p><strong>Jane Doe</strong> submitted work for <strong>Week 3 Pitch Deck</strong>.</p>
      <p style="margin:24px 0;">
        <a href="https://example.com/submissions/test" style="background:#1A1A1A;color:white;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;">View Submission</a>
      </p>
    `)
  );

  // 4. Feedback Registered
  await send(
    "Feedback Registered",
    "[TEST] New feedback on Week 3 Pitch Deck",
    wrap(`
      <p>Hello Test Founder,</p>
      <p>New feedback was added for <strong>Week 3 Pitch Deck</strong>.</p>
      <blockquote style="margin:16px 0;padding:12px 16px;background:#f5f5f5;border-left:4px solid #2F2C26;">
        Great progress on the market sizing section. Consider adding competitor analysis on slide 4.
      </blockquote>
      <p style="margin:24px 0;">
        <a href="https://example.com/submissions/test" style="background:#1A1A1A;color:white;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;">View Submission</a>
      </p>
    `)
  );

  // 5. Office Hour Booking
  await send(
    "Office Hour Request",
    "[TEST] Office Hour Request from Jane Doe (Acme Inc)",
    wrap(`
      <h2 style="font-size:20px;color:#2F2C26;font-weight:600;margin-top:0;">New Office Hour Request</h2>
      <p><strong>Jane Doe</strong> from <strong>Acme Inc</strong> has requested an office hour with you.</p>
      <div style="background:#fefaf3;border:1px solid #e0d6c8;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:14px;color:#666;">When: <strong style="color:#2F2C26;">Monday, April 7, 2025 2:00 PM - 2:30 PM</strong></p>
      </div>
      <p style="font-size:14px;color:#2F2C26;background:#f5f5f5;padding:12px;border-radius:6px;border-left:3px solid #2F2C26;">
        <em>"Would love to discuss our go-to-market strategy"</em>
      </p>
    `)
  );

  console.log("\nDone. Check slit.amazing@gmail.com inbox (and spam folder).\n");
}

main();
