"use client";

import { useState } from "react";
import Link from "next/link";
import { FollowButton } from "@/components/feed/FollowButton";

interface SuggestedUser {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
  company: string | null;
  jobTitle: string | null;
  headline: string | null;
  followerCount: number;
  batchName: string | null;
}

interface PeopleToFollowProps {
  suggestions: SuggestedUser[];
  currentUserId: string;
}

export function PeopleToFollow({ suggestions, currentUserId }: PeopleToFollowProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleSuggestions = suggestions.filter(
    (s) => s.id !== currentUserId && !dismissedIds.has(s.id)
  );

  const handleDismiss = (userId: string) => {
    setDismissedIds((prev) => new Set([...prev, userId]));
  };

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        border: "1px solid #e0e0e0",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 10px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#2F2C26",
            margin: 0,
            fontFamily: '"BDO Grotesk", sans-serif',
          }}
        >
          People To Follow
        </h3>
      </div>

      {/* Suggestion list */}
      <div>
        {visibleSuggestions.map((user) => (
          <div
            key={user.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              borderBottom: "1px solid #f5f5f5",
              position: "relative",
            }}
          >
            {/* Avatar */}
            <Link
              href={`/profile/${user.id}`}
              style={{ textDecoration: "none", flexShrink: 0 }}
            >
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name || "User"}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#1A1A1A",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {user.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </Link>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  marginBottom: "1px",
                }}
              >
                <Link
                  href={`/profile/${user.id}`}
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#2F2C26",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.name || "Unnamed User"}
                </Link>
                {user.batchName && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "#1A1A1A",
                      backgroundColor: "rgba(26, 26, 26, 0.1)",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      flexShrink: 0,
                      fontFamily: '"Roboto Mono", monospace',
                    }}
                  >
                    {user.batchName}
                  </span>
                )}
              </div>
              {(user.company || user.jobTitle) && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#666666",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.jobTitle && user.company
                    ? `${user.jobTitle} at ${user.company}`
                    : user.company || user.jobTitle}
                </p>
              )}
            </div>

            {/* Follow button */}
            <div style={{ flexShrink: 0 }}>
              <FollowButton
                targetUserId={user.id}
                isFollowing={false}
                size="sm"
              />
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => handleDismiss(user.id)}
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                background: "none",
                border: "none",
                color: "#999999",
                cursor: "pointer",
                fontSize: "14px",
                lineHeight: 1,
                padding: "2px",
                borderRadius: "4px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#666666";
                e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#999999";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="Dismiss suggestion"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Footer link */}
      <div style={{ padding: "10px 16px" }}>
        <Link
          href="/founders"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "#1A1A1A",
            textDecoration: "none",
          }}
        >
          View all members →
        </Link>
      </div>
    </div>
  );
}
