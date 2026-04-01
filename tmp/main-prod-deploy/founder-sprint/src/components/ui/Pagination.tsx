"use client";

import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const separator = basePath.includes("?") ? "&" : "?";

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      {currentPage > 1 ? (
        <Link
          href={currentPage === 2 ? basePath : `${basePath}${separator}page=${currentPage - 1}`}
          className="px-4 py-2 text-sm font-medium rounded-lg"
          style={{
            border: "1px solid var(--color-border, #e0e0e0)",
            color: "var(--color-foreground)",
          }}
        >
          Previous
        </Link>
      ) : (
        <span
          className="px-4 py-2 text-sm font-medium rounded-lg"
          style={{
            border: "1px solid var(--color-border, #e0e0e0)",
            color: "var(--color-foreground-muted, #999)",
            opacity: 0.5,
          }}
        >
          Previous
        </span>
      )}

      <span className="text-sm" style={{ color: "var(--color-foreground-muted, #666)" }}>
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={`${basePath}${separator}page=${currentPage + 1}`}
          className="px-4 py-2 text-sm font-medium rounded-lg"
          style={{
            border: "1px solid var(--color-border, #e0e0e0)",
            color: "var(--color-foreground)",
          }}
        >
          Next
        </Link>
      ) : (
        <span
          className="px-4 py-2 text-sm font-medium rounded-lg"
          style={{
            border: "1px solid var(--color-border, #e0e0e0)",
            color: "var(--color-foreground-muted, #999)",
            opacity: 0.5,
          }}
        >
          Next
        </span>
      )}
    </div>
  );
}
