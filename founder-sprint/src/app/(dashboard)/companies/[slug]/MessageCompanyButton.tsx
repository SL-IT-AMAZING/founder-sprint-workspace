"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateDMConversation } from "@/actions/messaging";

export default function MessageCompanyButton({ founderId }: { founderId: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!founderId) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await getOrCreateDMConversation(founderId);
      if (result.success) {
        router.push(`/messages?conversation=${result.data.conversationId}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        backgroundColor: "#1A1A1A",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "9px",
        padding: "8px 16px",
        cursor: loading ? "wait" : "pointer",
        fontSize: "14px",
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        opacity: loading ? 0.7 : 1,
        marginLeft: "12px",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {loading ? "Opening..." : "Message"}
    </button>
  );
}
