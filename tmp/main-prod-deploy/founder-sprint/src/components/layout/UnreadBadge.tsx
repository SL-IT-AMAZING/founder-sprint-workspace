"use client";

import { useUnreadCount } from "@/hooks/useUnreadCount";

export default function UnreadBadge() {
  const { unreadCount } = useUnreadCount();
  
  if (unreadCount === 0) return null;
  
  return (
    <span
      style={{
        position: "absolute",
        top: "-4px",
        right: "-4px",
        backgroundColor: "#C62828",
        color: "#FFFFFF",
        fontSize: "10px",
        fontWeight: 700,
        minWidth: "16px",
        height: "16px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 4px",
        lineHeight: 1,
      }}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
