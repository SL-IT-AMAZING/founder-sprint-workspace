"use client";

import { useEffect, useState } from "react";
import { getPublicGroups, joinPublicGroup } from "@/actions/messaging";
import type { PublicGroupItem } from "@/actions/messaging";

interface BrowseGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGroup: (conversationId: string) => void;
}

type SortBy = "recent" | "members";

export default function BrowseGroupsModal({
  isOpen,
  onClose,
  onJoinGroup,
}: BrowseGroupsModalProps) {
  const [groups, setGroups] = useState<PublicGroupItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchGroups = async () => {
      setLoading(true);
      setError(null);
      const result = await getPublicGroups("", sortBy);
      if (result.success) {
        setGroups(result.data);
      } else {
        setError(result.error || "Failed to load groups");
      }
      setLoading(false);
    };

    fetchGroups();
  }, [isOpen, sortBy]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      const result = await getPublicGroups(searchQuery, sortBy);
      if (result.success) {
        setGroups(result.data);
      } else {
        setError(result.error || "Failed to load groups");
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, searchQuery, sortBy]);

  const handleJoin = async (conversationId: string) => {
    setJoiningGroupId(conversationId);
    const result = await joinPublicGroup(conversationId);
    if (result.success) {
      setGroups((prev) =>
        prev.map((group) =>
          group.id === conversationId ? { ...group, isJoined: true, memberCount: group.memberCount + 1 } : group
        )
      );
      onJoinGroup(conversationId);
    } else {
      setError(result.error || "Failed to join group");
    }
    setJoiningGroupId(null);
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
          width: "520px",
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
          <h2 style={{ margin: 0, color: "#2F2C26", fontSize: "20px", fontWeight: 700 }}>Browse Public Groups</h2>
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
            aria-label="Close browse groups modal"
          >
            ×
          </button>
        </div>

        <div style={{ padding: "16px", borderBottom: "1px solid #f1eadd" }}>
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              width: "100%",
              margin: "0 0 12px",
              color: "#2F2C26",
              fontSize: "14px",
              outline: "none",
            }}
          />

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setSortBy("recent")}
              style={{
                border: sortBy === "recent" ? "none" : "1px solid #e0e0e0",
                backgroundColor: sortBy === "recent" ? "#1A1A1A" : "transparent",
                color: sortBy === "recent" ? "#FFFFFF" : "#2F2C26",
                borderRadius: "9px",
                padding: "6px 12px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Recently Active
            </button>
            <button
              onClick={() => setSortBy("members")}
              style={{
                border: sortBy === "members" ? "none" : "1px solid #e0e0e0",
                backgroundColor: sortBy === "members" ? "#1A1A1A" : "transparent",
                color: sortBy === "members" ? "#FFFFFF" : "#2F2C26",
                borderRadius: "9px",
                padding: "6px 12px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Most Members
            </button>
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: "8px 0", flex: 1 }}>
          {loading && (
            <div style={{ padding: "20px 16px", color: "#666666", fontSize: "14px", textAlign: "center" }}>
              Loading groups...
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "20px 16px", color: "#C62828", fontSize: "14px", textAlign: "center" }}>
              {error}
            </div>
          )}

          {!loading && !error && groups.length === 0 && (
            <div style={{ padding: "20px 16px", color: "#999999", fontSize: "14px", textAlign: "center" }}>
              No public groups found.
            </div>
          )}

          {!loading &&
            !error &&
            groups.map((group) => (
              <div
                key={group.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  padding: "12px 16px",
                  borderBottom: "1px solid #f1eadd",
                }}
              >
                <div style={{ fontSize: "24px", width: "28px", textAlign: "center", flexShrink: 0 }}>
                  {group.groupEmoji || "💬"}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#2F2C26" }}>{group.groupName}</div>
                  <div style={{ fontSize: "12px", color: "#666666", marginTop: "2px" }}>
                    by {group.createdBy?.name || "Unknown"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", marginTop: "4px", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#999999" }}>{group.memberCount} members</span>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {group.memberAvatars.slice(0, 3).map((memberAvatar, index) => (
                        <div
                          key={`${group.id}-avatar-${index}`}
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            border: "1px solid #FFFFFF",
                            backgroundColor: "#f1eadd",
                            backgroundImage: memberAvatar.profileImage ? `url(${memberAvatar.profileImage})` : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            marginLeft: index === 0 ? "0" : "-5px",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ minWidth: "72px", textAlign: "right" }}>
                  {group.isJoined ? (
                    <span style={{ color: "#2E7D32", fontSize: "13px", fontWeight: 500 }}>Joined ✓</span>
                  ) : (
                    <button
                      onClick={() => handleJoin(group.id)}
                      disabled={joiningGroupId === group.id}
                      style={{
                        backgroundColor: "#1A1A1A",
                        color: "#FFFFFF",
                        borderRadius: "9px",
                        padding: "6px 14px",
                        fontSize: "13px",
                        border: "none",
                        cursor: joiningGroupId === group.id ? "not-allowed" : "pointer",
                        opacity: joiningGroupId === group.id ? 0.7 : 1,
                      }}
                    >
                      {joiningGroupId === group.id ? "Joining..." : "Join"}
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
