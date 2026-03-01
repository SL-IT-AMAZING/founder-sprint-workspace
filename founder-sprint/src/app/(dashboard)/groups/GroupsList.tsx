"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { createGroup } from "@/actions/group";

interface Group {
  id: string;
  name: string;
  description: string | null;
  _count: {
    members: number;
    posts: number;
  };
}

interface GroupsListProps {
  groups: Group[];
  isAdmin: boolean;
}

export function GroupsList({ groups, isAdmin }: GroupsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createGroup(formData);
      if (result.success) {
        setIsModalOpen(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Companies</h1>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>Create Company</Button>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No companies yet"
          description="Companies will appear here once created"
          action={
            isAdmin ? (
              <Button onClick={() => setIsModalOpen(true)}>Create First Company</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="card cursor-pointer"
              onClick={() => router.push(`/groups/${group.id}`)}
              style={{ transition: "border-color 0.2s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-card-border)";
              }}
            >
              <div className="space-y-3">
                <h3 className="text-lg font-medium">{group.name}</h3>

                {group.description && (
                  <p
                    className="text-sm line-clamp-2"
                    style={{ color: "var(--color-foreground-secondary)" }}
                  >
                    {group.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                  <span>{group._count.members} members</span>
                  <span>{group._count.posts} posts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Company">
        <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="form-error p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

          <Input
            name="name"
            label="Company Name"
            placeholder="Acme Corp"
            required
          />

          <Textarea
            name="description"
            label="Description"
            placeholder="Brief description of the company"
            rows={3}
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
              Create Company
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
