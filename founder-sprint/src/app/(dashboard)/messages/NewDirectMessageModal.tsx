"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";

interface MessagingUser {
  id: string;
  name: string | null;
  profileImage: string | null;
}

interface NewDirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: MessagingUser[];
  onStartConversation: (userId: string) => void | Promise<void>;
  onCreateGroupClick: () => void;
}

export default function NewDirectMessageModal({
  isOpen,
  onClose,
  users,
  onStartConversation,
  onCreateGroupClick,
}: NewDirectMessageModalProps) {
  const [query, setQuery] = useState("");
  const [startingUserId, setStartingUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sortedUsers = [...users].sort((a, b) =>
      (a.name || "Unnamed user").localeCompare(b.name || "Unnamed user")
    );

    if (!normalizedQuery) return sortedUsers;

    return sortedUsers.filter((user) =>
      (user.name || "Unnamed user").toLowerCase().includes(normalizedQuery)
    );
  }, [query, users]);

  if (!isOpen) return null;

  const handleStart = async (userId: string) => {
    if (startingUserId) return;
    setStartingUserId(userId);
    try {
      await onStartConversation(userId);
    } finally {
      setStartingUserId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Start a direct message"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(18, 17, 15, 0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(440px, 100%)",
          maxHeight: "min(640px, 90vh)",
          backgroundColor: "#FFFFFF",
          border: "1px solid #e0e0e0",
          borderRadius: "14px",
          boxShadow: "0 18px 60px rgba(0, 0, 0, 0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          className="flex"
          style={{
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px 12px",
            borderBottom: "1px solid #f1eadd",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 600,
                color: "#2F2C26",
                fontFamily: '"Libre Caslon Condensed", Georgia, serif',
              }}
            >
              New message
            </h2>
            <p style={{ margin: "4px 0 0", color: "#777", fontSize: "13px" }}>
              Pick a founder and open a direct chat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "#f3f4f6",
              color: "#666",
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "12px 16px" }}>
          <input
            autoFocus
            type="text"
            placeholder="Search founders"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{
              width: "100%",
              height: "38px",
              backgroundColor: "#f3f4f6",
              border: "none",
              borderRadius: "10px",
              padding: "0 12px",
              fontSize: "14px",
              color: "#2F2C26",
              outline: "none",
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
          {filteredUsers.length === 0 ? (
            <div
              style={{
                color: "#999",
                fontSize: "14px",
                textAlign: "center",
                padding: "32px 12px",
              }}
            >
              No founders found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => void handleStart(user.id)}
                disabled={Boolean(startingUserId)}
                style={{
                  width: "100%",
                  border: "none",
                  backgroundColor: "transparent",
                  borderRadius: "10px",
                  padding: "10px",
                  cursor: startingUserId ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  textAlign: "left",
                  opacity: startingUserId && startingUserId !== user.id ? 0.55 : 1,
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = "#fefaf3";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Avatar src={user.profileImage} name={user.name} size={40} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: "#2F2C26",
                      fontSize: "15px",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.name || "Unnamed user"}
                  </div>
                  <div style={{ color: "#999", fontSize: "12px" }}>
                    {startingUserId === user.id ? "Opening..." : "Start direct message"}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div
          className="flex"
          style={{
            padding: "12px 16px 16px",
            borderTop: "1px solid #f1eadd",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ color: "#777", fontSize: "13px" }}>Need more than one person?</span>
          <button
            type="button"
            onClick={onCreateGroupClick}
            style={{
              border: "1px solid #e0e0e0",
              backgroundColor: "#FFFFFF",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#2F2C26",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Create group
          </button>
        </div>
      </div>
    </div>
  );
}
