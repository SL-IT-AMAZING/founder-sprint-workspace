"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { addFeedback } from "@/actions/assignment";

interface FeedbackFormProps {
  submissionId: string;
}

export function FeedbackForm({ submissionId }: FeedbackFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError("");

    startTransition(async () => {
      const result = await addFeedback(submissionId, content);
      if (result.success) {
        setContent("");
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
          Submit Feedback
        </Button>
      </div>
    </form>
  );
}
