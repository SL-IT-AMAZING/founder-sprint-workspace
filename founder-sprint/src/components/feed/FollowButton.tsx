"use client";

import { useState, useTransition } from "react";
import { followUser, unfollowUser } from "@/actions/follow";

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
  size?: "sm" | "md";
}

export function FollowButton({
  targetUserId,
  isFollowing: initialIsFollowing,
  size = "md",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovering, setIsHovering] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
    // Optimistic update
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);

    startTransition(async () => {
      const result = isFollowing
        ? await unfollowUser(targetUserId)
        : await followUser(targetUserId);

      if (!result.success) {
        // Revert on error
        setIsFollowing(previousState);
      }
    });
  };

  const sizeStyles = {
    sm: {
      padding: "2px 10px",
      fontSize: "12px",
      height: "28px",
    },
    md: {
      padding: "0 18px",
      fontSize: "13px",
      height: "36px",
    },
  };

  const baseStyles = {
    borderRadius: "9px",
    fontWeight: 500,
    cursor: isPending ? "default" : "pointer",
    transition: "all 0.2s",
    border: "1px solid",
    opacity: isPending ? 0.7 : 1,
  };

  let buttonStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
  };

  if (!isFollowing) {
    // Not following - solid dark button matching design system
    buttonStyles = {
      ...buttonStyles,
      backgroundColor: "#1A1A1A",
      color: "white",
      borderColor: "#1A1A1A",
    };
  } else if (isHovering) {
    // Following + hovering - show unfollow state
    buttonStyles = {
      ...buttonStyles,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      color: "#ef4444",
      borderColor: "#ef4444",
    };
  } else {
    // Following + not hovering - outline button
    buttonStyles = {
      ...buttonStyles,
      backgroundColor: "transparent",
      color: "#1A1A1A",
      borderColor: "#d0d0d0",
    };
  }

  const buttonText = !isFollowing ? "Follow" : isHovering ? "Unfollow" : "Following";
  const shouldAnimateText = !isFollowing && !isPending;

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isPending}
      className={shouldAnimateText ? "hover-slide" : undefined}
      style={buttonStyles}
    >
      {shouldAnimateText ? (
        <span className="btn-text-wrap">
          <span className="btn-text-initial">{buttonText}</span>
          <span className="btn-text-reveal" aria-hidden="true">{buttonText}</span>
        </span>
      ) : (
        buttonText
      )}
    </button>
  );
}
