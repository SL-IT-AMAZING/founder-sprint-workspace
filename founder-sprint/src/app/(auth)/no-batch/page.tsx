import Image from "next/image";
import { signOut } from "@/actions/auth";

export default function NoBatchPage() {
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
              Not Part of Any Batch
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#666666",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              You&apos;re not currently enrolled in any active batch program.
            </p>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            padding: "16px 20px",
            backgroundColor: "#FFF8E1",
            border: "1px solid #FFE082",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: "#F57C00",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Please contact your program administrator for access.
          </p>
        </div>

        <form action={signOut} style={{ width: "100%" }}>
          <button
            type="submit"
            style={{
              width: "100%",
              height: 48,
              backgroundColor: "#f5f1eb",
              color: "#2F2C26",
              border: "none",
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background-color 0.2s ease",
            }}
          >
            Sign Out
          </button>
        </form>

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
