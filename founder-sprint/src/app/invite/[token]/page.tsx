import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  const invitation = await prisma.invitationToken.findUnique({
    where: { token },
  });

  const roleDisplayName: Record<string, string> = {
    admin: "Admin",
    mentor: "Mentor",
    founder: "Founder",
    co_founder: "Co-founder",
    super_admin: "Super Admin",
  };

  // Token not found
  if (!invitation) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fefaf3" }}>
        <div style={{ maxWidth: "480px", width: "100%", padding: "48px", backgroundColor: "#FFFFFF", border: "1px solid #e0d6c8", borderRadius: "16px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", margin: "0 auto 24px", borderRadius: "50%", backgroundColor: "#fee", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg style={{ width: "32px", height: "32px", color: "#c33" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", fontWeight: 400, color: "#000", marginBottom: "12px" }}>Invalid Invitation</h1>
          <p style={{ fontSize: "14px", color: "#2F2C26", marginBottom: "32px" }}>
            This invitation link is not valid. Please contact the administrator for a new invitation.
          </p>
          <Link
            href="/login"
            style={{ display: "inline-block", padding: "14px 32px", backgroundColor: "#1A1A1A", color: "#fff", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", textDecoration: "none" }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Token already used
  if (invitation.usedAt) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fefaf3" }}>
        <div style={{ maxWidth: "480px", width: "100%", padding: "48px", backgroundColor: "#FFFFFF", border: "1px solid #e0d6c8", borderRadius: "16px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", margin: "0 auto 24px", borderRadius: "50%", backgroundColor: "#e6f0ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg style={{ width: "32px", height: "32px", color: "#4a7fc3" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", fontWeight: 400, color: "#000", marginBottom: "12px" }}>Already Accepted</h1>
          <p style={{ fontSize: "14px", color: "#2F2C26", marginBottom: "32px" }}>
            This invitation has already been accepted. You can log in to access your account.
          </p>
          <Link
            href="/login"
            style={{ display: "inline-block", padding: "14px 32px", backgroundColor: "#1A1A1A", color: "#fff", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", textDecoration: "none" }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Token expired
  if (invitation.expiresAt < new Date()) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fefaf3" }}>
        <div style={{ maxWidth: "480px", width: "100%", padding: "48px", backgroundColor: "#FFFFFF", border: "1px solid #e0d6c8", borderRadius: "16px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", margin: "0 auto 24px", borderRadius: "50%", backgroundColor: "#fff3cd", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg style={{ width: "32px", height: "32px", color: "#c8a822" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", fontWeight: 400, color: "#000", marginBottom: "12px" }}>Invitation Expired</h1>
          <p style={{ fontSize: "14px", color: "#2F2C26", marginBottom: "32px" }}>
            This invitation link has expired. Please contact the administrator to request a new invitation.
          </p>
          <Link
            href="/login"
            style={{ display: "inline-block", padding: "14px 32px", backgroundColor: "#1A1A1A", color: "#fff", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", textDecoration: "none" }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Valid invitation - fetch batch and role info
  const userBatch = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId: invitation.userId, batchId: invitation.batchId } },
    include: { batch: true },
  });

  if (!userBatch) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fefaf3" }}>
        <div style={{ maxWidth: "480px", width: "100%", padding: "48px", backgroundColor: "#FFFFFF", border: "1px solid #e0d6c8", borderRadius: "16px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", fontWeight: 400, color: "#000", marginBottom: "12px" }}>Invalid Invitation</h1>
          <p style={{ fontSize: "14px", color: "#2F2C26", marginBottom: "32px" }}>This invitation is no longer valid. Please contact the administrator.</p>
          <Link href="/login" style={{ display: "inline-block", padding: "14px 32px", backgroundColor: "#1A1A1A", color: "#fff", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", textDecoration: "none" }}>Go to Login</Link>
        </div>
      </div>
    );
  }

  const batchName = userBatch.batch.name;
  const role = roleDisplayName[userBatch.role] || userBatch.role;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fefaf3", padding: "20px" }}>
      <div style={{ maxWidth: "520px", width: "100%", padding: "48px", backgroundColor: "#FFFFFF", border: "1px solid #e0d6c8", borderRadius: "16px", textAlign: "center" }}>
        <div style={{ marginBottom: "32px" }}>
          <Image src="/images/Outsome-Full_Black.svg" alt="Outsome" width={160} height={40} style={{ margin: "0 auto" }} />
        </div>

        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", fontWeight: 400, color: "#000", marginBottom: "16px" }}>
          You're Invited!
        </h1>

        <p style={{ fontSize: "14px", color: "#2F2C26", marginBottom: "8px" }}>
          You've been invited to join
        </p>

        <p style={{ fontSize: "20px", fontWeight: "600", color: "#000", marginBottom: "8px" }}>
          {batchName}
        </p>

        <p style={{ fontSize: "14px", color: "#666666", marginBottom: "32px" }}>
          as a {role}
        </p>

        <Link
          href={`/api/invite/accept?token=${token}`}
          style={{ display: "inline-block", padding: "14px 32px", backgroundColor: "#1A1A1A", color: "#fff", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", textDecoration: "none" }}
        >
          Join Now
        </Link>

        <p style={{ fontSize: "13px", color: "#666666", marginTop: "24px" }}>
          Click the button above to accept your invitation and get started.
        </p>
      </div>
    </div>
  );
}
