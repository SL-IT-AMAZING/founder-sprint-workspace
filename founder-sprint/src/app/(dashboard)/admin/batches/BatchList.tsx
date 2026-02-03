"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { createBatch, updateBatch, archiveBatch } from "@/actions/batch";
import { formatDate } from "@/lib/utils";
import type { BatchStatus } from "@/types";

interface Batch {
  id: string;
  name: string;
  description: string | null;
  status: BatchStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  _count: {
    userBatches: number;
  };
}

interface BatchListProps {
  batches: Batch[];
}

export function BatchList({ batches }: BatchListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createBatch(formData);
      if (result.success) {
        setShowCreateModal(false);
        form.reset();
      } else {
        setError(result.error);
      }
    });
  }

  function handleArchive(batchId: string) {
    if (!confirm("Are you sure you want to archive this batch? This will make it read-only.")) return;

    startTransition(async () => {
      const result = await archiveBatch(batchId);
      if (!result.success) {
        alert(result.error);
      }
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editBatch) return;
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await updateBatch(editBatch.id, {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        startDate: new Date(formData.get("startDate") as string),
        endDate: new Date(formData.get("endDate") as string),
      });
      if (result.success) {
        setEditBatch(null);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-end gap-3">
        <Button onClick={() => setShowCreateModal(true)}>
          Create Batch
        </Button>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          title="No batches yet"
          description="Create your first batch to get started."
          action={<Button onClick={() => setShowCreateModal(true)}>Create Batch</Button>}
        />
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div key={batch.id} className="card">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium font-serif">{batch.name}</h3>
                    <Badge variant={batch.status === "active" ? "success" : "error"}>
                      {batch.status}
                    </Badge>
                  </div>
                  {batch.description && (
                    <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                      {batch.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                    <span>{formatDate(batch.startDate)} — {formatDate(batch.endDate)}</span>
                    <span>{batch._count.userBatches} members</span>
                  </div>
                </div>
                {batch.status === "active" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditBatch(batch)}
                      disabled={isPending}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(batch.id)}
                      disabled={isPending}
                    >
                      Archive
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setError(null);
        }}
        title="Create New Batch"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Batch Name"
            name="name"
            required
            placeholder="e.g. W26 Batch"
            disabled={isPending}
          />

          <Textarea
            label="Description"
            name="description"
            placeholder="Optional description"
            disabled={isPending}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              required
              disabled={isPending}
            />
            <Input
              label="End Date"
              name="endDate"
              type="date"
              required
              disabled={isPending}
            />
          </div>

          {error && (
            <div
              className="text-sm"
              style={{
                color: "var(--color-error)",
                padding: "12px",
                backgroundColor: "rgba(198, 40, 40, 0.1)",
                borderRadius: "6px",
              }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setError(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Create Batch
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editBatch}
        onClose={() => {
          setEditBatch(null);
          setError(null);
        }}
        title="Edit Batch"
      >
        {editBatch && (
          <form onSubmit={handleEdit} className="space-y-4">
            <Input
              label="Batch Name"
              name="name"
              required
              defaultValue={editBatch.name}
              disabled={isPending}
            />

            <Textarea
              label="Description"
              name="description"
              placeholder="Optional description"
              defaultValue={editBatch.description || ""}
              disabled={isPending}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                name="startDate"
                type="date"
                required
                defaultValue={new Date(editBatch.startDate).toISOString().split("T")[0]}
                disabled={isPending}
              />
              <Input
                label="End Date"
                name="endDate"
                type="date"
                required
                defaultValue={new Date(editBatch.endDate).toISOString().split("T")[0]}
                disabled={isPending}
              />
            </div>

            {error && (
              <div
                className="text-sm"
                style={{
                  color: "var(--color-error)",
                  padding: "12px",
                  backgroundColor: "rgba(198, 40, 40, 0.1)",
                  borderRadius: "6px",
                }}
              >
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setEditBatch(null);
                  setError(null);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
