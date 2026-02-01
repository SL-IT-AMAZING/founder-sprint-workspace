import React, { HTMLAttributes } from "react";

/**
 * Skeleton Loader Component
 * 
 * Provides loading states with a shimmer animation.
 * Uses existing design tokens from globals.css.
 */

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

// Inline styles for the shimmer animation to avoid modifying globals.css
const shimmerStyles = `
  @keyframes skeleton-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  
  .skeleton-shimmer {
    background: linear-gradient(
      90deg,
      var(--color-input-bg) 25%,
      var(--color-card-border) 37%,
      var(--color-input-bg) 63%
    );
    background-size: 400% 100%;
    animation: skeleton-shimmer 1.4s ease infinite;
  }
`;

export const Skeleton = ({
  className = "",
  width,
  height,
  circle = false,
  style,
  ...props
}: SkeletonProps) => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmerStyles }} />
      <div
        className={`skeleton-shimmer ${className}`}
        style={{
          width,
          height,
          borderRadius: circle ? "50%" : "var(--radius-md)",
          ...style,
        }}
        {...props}
      />
    </>
  );
};

export const SkeletonText = ({
  lines = 1,
  className = "",
  ...props
}: SkeletonProps & { lines?: number }) => {
  if (lines === 1) {
    return (
      <Skeleton
        height="1em"
        width="100%"
        className={`my-1 ${className}`}
        {...props}
      />
    );
  }
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1em"
          width={i === lines - 1 && lines > 1 ? "80%" : "100%"}
          {...props}
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar = ({
  size = "md",
  className = "",
  ...props
}: SkeletonProps & { size?: "sm" | "md" | "lg" | number }) => {
  let width: string | number;
  let height: string | number;

  if (typeof size === "number") {
    width = size;
    height = size;
  } else {
    switch (size) {
      case "sm":
        width = 24;
        height = 24;
        break;
      case "lg":
        width = 48;
        height = 48;
        break;
      case "md":
      default:
        width = 36;
        height = 36;
        break;
    }
  }

  return (
    <Skeleton
      circle
      width={width}
      height={height}
      className={`shrink-0 ${className}`}
      {...props}
    />
  );
};

export const SkeletonCard = ({
  className = "",
  ...props
}: SkeletonProps) => {
  return (
    <Skeleton
      className={`w-full rounded-lg ${className}`}
      height={200}
      {...props}
    />
  );
};

export const SkeletonButton = ({
  className = "",
  ...props
}: SkeletonProps) => {
  return (
    <Skeleton
      className={`${className}`}
      height="var(--button-height)"
      width={120}
      style={{ borderRadius: "9px" }}
      {...props}
    />
  );
};
