"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuestion } from "@/actions/question";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function QuestionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<{ title?: string; content?: string; general?: string }>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: typeof errors = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }

    if (!content.trim()) {
      newErrors.content = "Content is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);

      const result = await createQuestion(formData);

      if (result.success) {
        router.push(`/questions/${result.data.id}`);
      } else {
        setErrors({ general: result.error });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="space-y-6">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's your question?"
          error={errors.title}
          disabled={isPending}
          required
        />

        <Textarea
          label="Details"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Provide more details about your question..."
          rows={10}
          error={errors.content}
          disabled={isPending}
          required
        />

        {errors.general && (
          <div className="form-error p-3 rounded">
            {errors.general}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/questions")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isPending}
            disabled={!title.trim() || !content.trim()}
          >
            Submit Question
          </Button>
        </div>
      </div>
    </form>
  );
}
