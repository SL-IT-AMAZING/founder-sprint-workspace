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

const VISIBLE_COUNT = 5;

function UserAvatar({ user }: { user: SuggestedUser }) {
  const [imgError, setImgError] = useState(false);
  const initial = user.name?.[0]?.toUpperCase() || "?";

  if (user.profileImage && !imgError) {
    return (
      <img
        src={user.profileImage}
        alt={user.name || "User"}
        onError={() => setImgError(true)}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#1A1A1A",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

export function PeopleToFollow({ suggestions, currentUserId }: PeopleToFollowProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleSuggestions = suggestions.filter(
    (suggestion) => suggestion.id !== currentUserId && !dismissedIds.has(suggestion.id)
  );
  const sidebarSuggestions = visibleSuggestions.slice(0, VISIBLE_COUNT);

  const handleDismiss = (userId: string) => {
    setDismissedIds((prev) => new Set([...prev, userId]));
  };

  if (sidebarSuggestions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column" as const,
        gap: "4px",
        width: "100%",
        backgroundColor: "#FCFBF8",
        border: "1px solid #E8E1D4",
        borderRadius: "16px",
        padding: "20px",
      }}
    >
      <div style={{ paddingBottom: "4px" }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#2F2C26",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          People To Follow
        </h3>
      </div>

      <div>
        {sidebarSuggestions.map((user) => {
          const subtitle = user.jobTitle && user.company
            ? `${user.jobTitle} at ${user.company}`
            : user.jobTitle || user.company || user.headline;

          return (
            <div
              key={user.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 0",
                borderBottom: "1px solid #EEE7DB",
              }}
            >
              {/* Avatar */}
              <Link
                href={`/profile/${user.id}`}
                style={{ textDecoration: "none", flexShrink: 0 }}
              >
                <UserAvatar user={user} />
              </Link>

              {/* Name + badge + subtitle */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link
                  href={`/profile/${user.id}`}
                  style={{
                    display: "block",
                    fontSize: "14px",
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
                      display: "inline-block",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "#6A6357",
                      backgroundColor: "#F4EFE4",
                      padding: "1px 6px",
                      borderRadius: "999px",
                      border: "1px solid #E7DFCF",
                      marginTop: "3px",
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      lineHeight: 1.4,
                    }}
                  >
                    {user.batchName}
                  </span>
                )}
                {subtitle && (
                  <p
                    style={{
                      fontSize: "12px",
                      lineHeight: 1.4,
                      color: "#7A7468",
                      margin: 0,
                      marginTop: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Follow + Dismiss */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                <FollowButton
                  targetUserId={user.id}
                  isFollowing={false}
                  size="sm"
                />
                <button
                  type="button"
                  onClick={() => handleDismiss(user.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#B5AFA5",
                    cursor: "pointer",
                    fontSize: "12px",
                    lineHeight: 1,
                    padding: "4px",
                    borderRadius: "4px",
                    flexShrink: 0,
                  }}
                  title="Dismiss suggestion"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ paddingTop: "6px" }}>
        <Link
          href="/founders"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#2F2C26",
            textDecoration: "none",
          }}
        >
          See more →
        </Link>
      </div>
    </div>
  );
}
