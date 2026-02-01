"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { updateGroup, deleteGroup, removeGroupMember } from "@/actions/group";

interface User {
  id: string;
  name: string;
  profileImage: string | null;
}

interface GroupMember {
  id: string;
  joinedAt: Date;
  user: User;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  members: GroupMember[];
}

interface GroupManageProps {
  group: Group;
}

export function GroupManage({ group }: GroupManageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);

    startTransition(async () => {
      const result = await updateGroup(group.id, formData);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  const handleDeleteGroup = async () => {
    startTransition(async () => {
      const result = await deleteGroup(group.id);
      if (result.success) {
        router.push("/groups");
      } else {
        setError(result.error);
      }
    });
  };

  const handleRemoveMember = async (userId: string) => {
    startTransition(async () => {
      const result = await removeGroupMember(group.id, userId);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
        <Link href="/groups">Groups</Link>
        <span>/</span>
        <Link href={`/groups/${group.id}`}>{group.name}</Link>
        <span>/</span>
        <span>Manage</span>
      </div>

      <h1 className="text-2xl">Manage Group</h1>

        {error && (
          <div className="form-error p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

      {/* Group Settings */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Group Settings</h3>
        <form onSubmit={handleUpdateGroup} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Group Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description for the group"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Members Management */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Members ({group.members.length})</h3>
        <div className="space-y-3">
          {group.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-4 p-3 rounded-lg" style={{ backgroundColor: "var(--color-background)" }}>
              <div className="flex items-center gap-3">
                <Avatar
                  src={member.user.profileImage}
                  name={member.user.name}
                  size={40}
                />
                <div>
                  <p className="font-medium">{member.user.name}</p>
                  <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleRemoveMember(member.user.id)}
                loading={isPending}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: "var(--color-error)" }}>
        <h3 className="text-lg font-medium mb-2" style={{ color: "var(--color-error)" }}>
          Danger Zone
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--color-foreground-secondary)" }}>
          Deleting a group is permanent and cannot be undone. All posts and data associated with this group will be removed.
        </p>

        {!showDeleteConfirm ? (
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
          >
            Delete Group
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: "var(--color-error)" }}>
              Are you sure you want to delete this group? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteGroup}
                loading={isPending}
                style={{ backgroundColor: "var(--color-error)" }}
              >
                Yes, Delete Group
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
