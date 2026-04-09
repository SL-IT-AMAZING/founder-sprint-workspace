"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { addFeedback } from "@/actions/assignment";
import type { ChecklistItem } from "@/actions/assignment";

interface FeedbackFormProps {
  submissionId: string;
  reviewCriteria?: string[];
  parentId?: string;
  submitLabel?: string;
}

export function FeedbackForm({
  submissionId,
  reviewCriteria = [],
  parentId,
  submitLabel = "Submit Feedback",
}: FeedbackFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    reviewCriteria.map((label) => ({ label, checked: false }))
  );

  const toggleChecklistItem = (idx: number) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError("");

    startTransition(async () => {
      const result = await addFeedback(
        submissionId,
        content,
        checklist.length > 0 ? checklist : undefined,
        parentId
      );
      if (result.success) {
        setContent("");
        setChecklist(reviewCriteria.map((label) => ({ label, checked: false })));
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="form-error p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!parentId && checklist.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground-muted)" }}>
            Review Criteria
          </p>
          {checklist.map((item, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleChecklistItem(idx)}
                className="rounded"
              />
              <span className="text-sm">{item.label}</span>
            </label>
          ))}
        </div>
      )}

      <Textarea
        placeholder="Provide constructive feedback..."
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={3000}
      />

      <div className="flex justify-between items-center">
        <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
          {content.length} / 3000 characters
        </p>
        <Button
          type="submit"
          loading={isPending}
          disabled={!content.trim()}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
