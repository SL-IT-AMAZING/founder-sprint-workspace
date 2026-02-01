"use client";

import { useState, useTransition } from "react";
import { createAnswer } from "@/actions/question";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface AnswerFormProps {
  questionId: string;
}

export function AnswerForm({ questionId }: AnswerFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Please enter an answer");
      return;
    }

    startTransition(async () => {
      const result = await createAnswer(questionId, content);

      if (result.success) {
        setContent("");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your answer..."
        rows={6}
        error={error}
        disabled={isPending}
      />
      <div className="flex justify-end mt-4">
        <Button type="submit" loading={isPending} disabled={!content.trim()}>
          Submit Answer
        </Button>
      </div>
    </form>
  );
}
