"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { updateSubmissionStatus } from "@/actions/assignment";
import type { SubmissionStatus } from "@/actions/assignment";

interface StatusControlProps {
  submissionId: string;
  currentStatus: SubmissionStatus;
}

const STATUS_OPTIONS: { value: SubmissionStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "needs_revision", label: "Needs Revision" },
];

export function StatusControl({ submissionId, currentStatus }: StatusControlProps) {
  const [selected, setSelected] = useState<SubmissionStatus>(currentStatus);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as SubmissionStatus;
    setSelected(next);
    setError("");

    startTransition(async () => {
      const result = await updateSubmissionStatus(submissionId, next);
      if (!result.success) {
        setSelected(currentStatus);
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={selected}
        onChange={handleChange}
        disabled={isPending}
        className="px-3 py-1.5 rounded-lg border text-sm"
        style={{
          borderColor: "var(--color-card-border)",
          backgroundColor: "var(--color-background)",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
