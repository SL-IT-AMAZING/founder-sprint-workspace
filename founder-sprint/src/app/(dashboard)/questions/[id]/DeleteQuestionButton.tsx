"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { deleteQuestion } from "@/actions/question";
import { useToast } from "@/hooks/useToast";

export function DeleteQuestionButton({ questionId }: { questionId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this question? This will also delete all answers and summaries.")) {
      return;
    }

    setLoading(true);
    const result = await deleteQuestion(questionId);

    if (result.success) {
      router.push("/questions");
    } else {
      toast.error(result.error);
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      loading={loading}
      style={{ color: "var(--color-error)" }}
    >
      Delete
    </Button>
  );
}
