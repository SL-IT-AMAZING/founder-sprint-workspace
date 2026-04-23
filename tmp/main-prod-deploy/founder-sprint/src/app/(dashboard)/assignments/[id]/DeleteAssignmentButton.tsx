"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { deleteAssignment } from "@/actions/assignment";

interface DeleteAssignmentButtonProps {
  assignmentId: string;
  assignmentTitle: string;
}

export function DeleteAssignmentButton({ assignmentId, assignmentTitle }: DeleteAssignmentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${assignmentTitle}"?\n\nThis will permanently delete the assignment and all its submissions. This action cannot be undone.`
    );

    if (!confirmed) return;

    setLoading(true);
    const result = await deleteAssignment(assignmentId);

    if (result.success) {
      router.push("/assignments");
    } else {
      alert(result.error || "Failed to delete assignment");
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
      Delete Assignment
    </Button>
  );
}
