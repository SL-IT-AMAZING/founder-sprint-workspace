"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createAssignment } from "@/actions/assignment";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  templateUrl: string | null;
  dueDate: Date;
  targetGroup?: { id: string; name: string } | null;
  targetUserIds?: string[];
  batch?: { id: string; name: string } | null;
  _count?: { submissions: number };
}

interface BatchOption {
  id: string;
  name: string;
}

interface TargetGroupOption {
  id: string;
  name: string;
}

interface TargetUserOption {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface AssignmentsListProps {
  assignments: AssignmentItem[];
  canCreate: boolean;
  isAdmin: boolean;
  batches: BatchOption[];
  currentBatchId: string;
  availableGroups: TargetGroupOption[];
  availableUsers: TargetUserOption[];
}

export function AssignmentsList({
  assignments,
  canCreate,
  isAdmin,
  batches,
  currentBatchId,
  availableGroups,
  availableUsers,
}: AssignmentsListProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [targetMode, setTargetMode] = useState<"all" | "group" | "users">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showThisWeekOnly, setShowThisWeekOnly] = useState(false);

  const weekStart = new Date();
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const visibleAssignments = assignments.filter((assignment) => {
    if (!showThisWeekOnly) return true;
    const dueAt = new Date(assignment.dueDate);
    return dueAt >= weekStart && dueAt < weekEnd;
  });

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (targetMode === "all") {
      formData.delete("targetGroupId");
    }

    if (targetMode !== "users") {
      formData.delete("targetUserIds");
    } else {
      selectedUsers.forEach((userId) => formData.append("targetUserIds", userId));
    }

    startTransition(async () => {
      const result = await createAssignment(formData);
      if (result.success) {
        setCreateOpen(false);
        setSelectedUsers([]);
        setTargetMode("all");
        form.reset();
      } else {
        setError(result.error);
      }
    });
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>
          Assignments
        </h1>
        {canCreate && <Button onClick={() => setCreateOpen(true)}>Create Assignment</Button>}
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Assignments will appear here once they are published."
          action={canCreate ? <Button onClick={() => setCreateOpen(true)}>Create Assignment</Button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
            <input
              type="checkbox"
              checked={showThisWeekOnly}
              onChange={(event) => setShowThisWeekOnly(event.target.checked)}
            />
            This week only
          </label>

          {visibleAssignments.length === 0 && (
            <div className="card">
              <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                No assignments due this week.
              </p>
            </div>
          )}

          {visibleAssignments.map((assignment) => (
            <div key={assignment.id} className="card">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">{assignment.title}</h3>
                    <p className="text-sm" style={{ color: "var(--color-foreground-secondary)", whiteSpace: "pre-wrap" }}>
                      {assignment.description}
                    </p>
                  </div>
                  <Badge variant="warning">Due {formatDate(assignment.dueDate)}</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {assignment.batch && <Badge variant="default">{assignment.batch.name}</Badge>}
                  {assignment.targetGroup && <Badge variant="success">Group: {assignment.targetGroup.name}</Badge>}
                  {(assignment.targetUserIds?.length || 0) > 0 && (
                    <Badge variant="success">Users: {assignment.targetUserIds?.length}</Badge>
                  )}
                  {assignment.templateUrl && (
                    <a href={assignment.templateUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                      Template →
                    </a>
                  )}
                  <span style={{ color: "var(--color-foreground-muted)" }}>
                    {(assignment._count?.submissions || 0)} submission(s)
                  </span>
                </div>

                <div>
                  <Link href={`/assignments/${assignment.id}`} style={{ color: "var(--color-primary)", fontSize: 14 }}>
                    View assignment →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setError(null); }} title="Create Assignment">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input name="title" label="Title" required disabled={isPending} />
          <Textarea name="description" label="Description" required rows={5} disabled={isPending} />
          <Input name="templateUrl" label="Template URL" type="url" disabled={isPending} />
          <Input name="dueDate" label="Due Date" type="date" required disabled={isPending} />

          {isAdmin && batches.length > 0 && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Batch</label>
              <select name="batchId" defaultValue={currentBatchId} className="w-full px-3 py-2 rounded-lg border" disabled={isPending}>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Target</label>
            <div className="flex gap-2 flex-wrap">
              <Button type="button" variant={targetMode === "all" ? "primary" : "ghost"} onClick={() => { setTargetMode("all"); setSelectedUsers([]); }} disabled={isPending}>All founders</Button>
              <Button type="button" variant={targetMode === "group" ? "primary" : "ghost"} onClick={() => { setTargetMode("group"); setSelectedUsers([]); }} disabled={isPending}>Specific group</Button>
              <Button type="button" variant={targetMode === "users" ? "primary" : "ghost"} onClick={() => setTargetMode("users")} disabled={isPending}>Specific founders</Button>
            </div>

            {targetMode === "group" && (
              <select name="targetGroupId" className="w-full px-3 py-2 rounded-lg border" disabled={isPending} defaultValue="">
                <option value="">Select a group</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            )}

            {targetMode === "users" && (
              <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--color-card-border)", borderRadius: 8, padding: 12 }}>
                {availableUsers.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 py-1" style={{ cursor: "pointer" }}>
                    <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleUser(user.id)} disabled={isPending} />
                    <span>{user.name || user.email}</span>
                    <span style={{ color: "var(--color-foreground-muted)", fontSize: 12 }}>({user.role})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <div className="form-error p-3 rounded-lg text-sm">{error}</div>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => { setCreateOpen(false); setError(null); }} disabled={isPending}>Cancel</Button>
            <Button type="submit" loading={isPending}>Create Assignment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
