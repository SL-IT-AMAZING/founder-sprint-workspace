import Image from "next/image";
import { signInWithLinkedIn } from "@/actions/auth";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Authentication failed. Please try again.",
  auth_failed: "LinkedIn authentication failed. Please try again.",
  no_email: "Could not retrieve your email from LinkedIn.",
  server_error: "Server error. Please try again later.",
  auth_callback_error: "Authentication callback failed. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] || "An error occurred." : null;
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fefaf3",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e0d6c8",
          padding: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <Image
            src="/images/Outsome-Full_Black.svg"
            alt="Outsome"
            width={180}
            height={48}
            style={{ width: 180, height: "auto" }}
            priority
          />
          
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 28,
                fontWeight: 400,
                color: "#000000",
                margin: 0,
                marginBottom: 8,
                letterSpacing: "-0.02em",
              }}
            >
              Founder Sprint Workspace
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#666666",
                margin: 0,
              }}
            >
              Sign in to access your workspace
            </p>
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#dc2626",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {errorMessage}
          </div>
        )}

        <form action={signInWithLinkedIn} style={{ width: "100%" }}>
          <AnimatedButton type="submit" variant="linkedin" size="default">
            <Image
              src="/images/icon-social-linkedin.svg"
              alt="LinkedIn"
              width={20}
              height={20}
              style={{ width: 20, height: 20, filter: "brightness(0) invert(1)" }}
            />
            Sign in with LinkedIn
          </AnimatedButton>
        </form>

        <p
          style={{
            fontSize: 12,
            color: "#999999",
            textAlign: "center",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          By signing in, you agree to our
          <br />
          Terms of Service and Privacy Policy
        </p>

        <p
          style={{
            fontSize: 11,
            color: "#bbbbbb",
            textAlign: "center",
            margin: 0,
          }}
        >
          초대받은 분만 참여 가능합니다
        </p>
      </div>
    </div>
  );
}
