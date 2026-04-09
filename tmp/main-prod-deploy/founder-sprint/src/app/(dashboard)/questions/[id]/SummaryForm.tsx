"use client";

import { useState, useTransition } from "react";
import { createSummary } from "@/actions/question";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface SummaryFormProps {
  questionId: string;
}

export function SummaryForm({ questionId }: SummaryFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Please enter a summary");
      return;
    }

    startTransition(async () => {
      const result = await createSummary(questionId, content);

      if (result.success) {
        setContent("");
        // The page will revalidate automatically, showing the summary
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a summary that closes this question..."
        rows={6}
        error={error}
        disabled={isPending}
      />
      <div className="flex justify-end mt-4">
        <Button type="submit" variant="primary" loading={isPending} disabled={!content.trim()}>
          Create Summary & Close Question
        </Button>
      </div>
    </form>
  );
}
