"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createAssignment } from "@/actions/assignment";
import { formatDate } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  _count: {
    submissions: number;
  };
}

interface AssignmentsListProps {
  assignments: Assignment[];
  canCreate: boolean;
}

export function AssignmentsList({ assignments, canCreate }: AssignmentsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createAssignment(formData);
      if (result.success) {
        setIsModalOpen(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error);
      }
    });
  };

  const getDueDateBadge = (dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge variant="error">Overdue</Badge>;
    } else if (diffDays <= 3) {
      return <Badge variant="warning">Due soon</Badge>;
    } else {
      return <Badge>Upcoming</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Assignments</h1>
        {canCreate && (
          <Button onClick={() => setIsModalOpen(true)}>Create Assignment</Button>
        )}
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Assignments will appear here once created"
          action={
            canCreate ? (
              <Button onClick={() => setIsModalOpen(true)}>Create First Assignment</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="card cursor-pointer"
              onClick={() => router.push(`/assignments/${assignment.id}`)}
              style={{ transition: "all 0.2s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-card-border)";
              }}
            >
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{assignment.title}</h3>
                    <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                      Due {formatDate(assignment.dueDate)}
                    </p>
                  </div>
                  <div className="self-start">
                    {getDueDateBadge(assignment.dueDate)}
                  </div>
                </div>

                <p
                  className="text-sm line-clamp-2"
                  style={{ color: "var(--color-foreground-secondary)" }}
                >
                  {assignment.description}
                </p>

                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                  <span>{assignment._count.submissions} submissions</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Assignment">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="form-error p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            name="title"
            label="Title"
            placeholder="Assignment 1: Business Model Canvas"
            required
          />

          <Textarea
            name="description"
            label="Description"
            placeholder="Detailed instructions for the assignment"
            rows={4}
            required
          />

          <Input
            name="templateUrl"
            label="Template URL (optional)"
            type="url"
            placeholder="https://docs.google.com/document/..."
          />

          <Input
            name="dueDate"
            label="Due Date"
            type="datetime-local"
            required
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Create Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
