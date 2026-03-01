"use client";

import { useMemo, useState, type FormEvent } from "react";
import { createGroupConversation } from "@/actions/messaging";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
  users: { id: string; name: string | null; profileImage: string | null }[];
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
  users,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [groupEmoji, setGroupEmoji] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) return users;

    return users.filter((user) => (user.name || "").toLowerCase().includes(normalizedSearch));
  }, [searchQuery, users]);

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedUserIds.includes(user.id)),
    [selectedUserIds, users]
  );

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupName.trim() || selectedUserIds.length < 1) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createGroupConversation(
      groupName.trim(),
      groupEmoji.trim() || null,
      isPublic,
      selectedUserIds
    );

    if (result.success) {
      onGroupCreated(result.data.conversationId);
      setGroupName("");
      setGroupEmoji("");
      setIsPublic(true);
      setSearchQuery("");
      setSelectedUserIds([]);
      onClose();
    } else {
      setError(result.error || "Failed to create group");
    }

    setSubmitting(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "480px",
          maxHeight: "600px",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ margin: 0, color: "#2F2C26", fontSize: "20px", fontWeight: 700 }}>Create Group</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              backgroundColor: "transparent",
              color: "#666666",
              fontSize: "20px",
              cursor: "pointer",
              lineHeight: 1,
            }}
            aria-label="Close create group modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "16px", overflowY: "auto" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#2F2C26", fontWeight: 600 }}>
            Group Name
          </label>
          <input
            type="text"
            placeholder="e.g., Robotics Founders"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            required
            maxLength={200}
            style={{
              width: "100%",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#2F2C26",
              fontSize: "14px",
              marginBottom: "12px",
              outline: "none",
            }}
          />

          <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#2F2C26", fontWeight: 600 }}>
            Group Emoji
          </label>
          <input
            type="text"
            placeholder="💬"
            value={groupEmoji}
            onChange={(event) => setGroupEmoji(event.target.value)}
            maxLength={10}
            style={{
              width: "60px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "8px",
              textAlign: "center",
              color: "#2F2C26",
              fontSize: "16px",
              marginBottom: "12px",
              outline: "none",
            }}
          />

          <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#2F2C26", fontWeight: 600 }}>
            Visibility
          </label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              style={{
                border: isPublic ? "none" : "1px solid #e0e0e0",
                backgroundColor: isPublic ? "#1A1A1A" : "transparent",
                color: isPublic ? "#FFFFFF" : "#2F2C26",
                borderRadius: "9px",
                padding: "6px 12px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              style={{
                border: !isPublic ? "none" : "1px solid #e0e0e0",
                backgroundColor: !isPublic ? "#1A1A1A" : "transparent",
                color: !isPublic ? "#FFFFFF" : "#2F2C26",
                borderRadius: "9px",
                padding: "6px 12px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Private
            </button>
          </div>

          <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#2F2C26", fontWeight: 600 }}>
            Add Members
          </label>

          {selectedUsers.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              {selectedUsers.map((user) => (
                <button
                  key={`selected-${user.id}`}
                  type="button"
                  onClick={() => handleToggleUser(user.id)}
                  style={{
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#fefaf3",
                    color: "#2F2C26",
                    borderRadius: "999px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {(user.name || "Unknown") + " ×"}
                </button>
              ))}
            </div>
          )}

          <input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            style={{
              width: "100%",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#2F2C26",
              fontSize: "14px",
              marginBottom: "8px",
              outline: "none",
            }}
          />

          <div
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              maxHeight: "180px",
              overflowY: "auto",
              marginBottom: "12px",
            }}
          >
            {filteredUsers.length === 0 ? (
              <div style={{ padding: "12px", color: "#999999", fontSize: "13px", textAlign: "center" }}>
                No users found.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleToggleUser(user.id)}
                    style={{
                      width: "100%",
                      border: "none",
                      borderBottom: "1px solid #f1eadd",
                      backgroundColor: isSelected ? "#fefaf3" : "#FFFFFF",
                      padding: "8px 10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#2F2C26",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#f1eadd",
                          backgroundImage: user.profileImage ? `url(${user.profileImage})` : "none",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "13px" }}>{user.name || "Unknown"}</span>
                    </span>
                    <span style={{ color: isSelected ? "#2E7D32" : "#999999", fontSize: "12px", fontWeight: 600 }}>
                      {isSelected ? "Selected" : "Select"}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {error && <div style={{ color: "#C62828", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}

          <button
            type="submit"
            disabled={submitting || !groupName.trim() || selectedUserIds.length < 1}
            style={{
              width: "100%",
              backgroundColor: "#1A1A1A",
              color: "#FFFFFF",
              borderRadius: "9px",
              padding: "10px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: submitting || !groupName.trim() || selectedUserIds.length < 1 ? "not-allowed" : "pointer",
              opacity: submitting || !groupName.trim() || selectedUserIds.length < 1 ? 0.6 : 1,
            }}
          >
            {submitting ? "Creating..." : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}
