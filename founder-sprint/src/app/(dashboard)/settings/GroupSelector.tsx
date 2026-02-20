"use client";

import { useState, useTransition } from "react";
import { selectGroup } from "@/actions/group";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

interface GroupSelectorProps {
  currentGroupId: string | null;
  currentGroupName: string | null;
  availableGroups: Array<{ id: string; name: string; _count: { members: number } }>;
  isOnboarding: boolean;
}

export function GroupSelector({ currentGroupId, currentGroupName, availableGroups, isOnboarding }: GroupSelectorProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId || "");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleSubmit = () => {
    if (!selectedGroupId) return;
    if (selectedGroupId === currentGroupId) return;

    startTransition(async () => {
      const result = await selectGroup(selectedGroupId);
      if (result.success) {
        toast.success("Group updated!");
      } else {
        toast.error(result.error || "Failed to update group");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">
            {isOnboarding ? "Select Your Group" : "Your Group"}
          </h2>
          {isOnboarding && (
            <p className="text-sm mt-1" style={{ color: "var(--color-foreground-muted)" }}>
              Choose the group you belong to.
            </p>
          )}
        </div>
        {currentGroupName && !isOnboarding && (
          <span
            className="text-sm px-3 py-1 rounded-full"
            style={{
              backgroundColor: "var(--color-background-secondary)",
              color: "var(--color-foreground-secondary)",
            }}
          >
            Current: {currentGroupName}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="form-input flex-1"
          disabled={isPending}
        >
          <option value="">Select a group...</option>
          {availableGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g._count.members} members)
            </option>
          ))}
        </select>
        <Button
          onClick={handleSubmit}
          loading={isPending}
          disabled={!selectedGroupId || selectedGroupId === currentGroupId}
        >
          {currentGroupId ? "Switch Group" : "Join Group"}
        </Button>
      </div>
    </div>
  );
}
