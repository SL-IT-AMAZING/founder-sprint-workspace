"use client";

import { useState, useTransition, useEffect } from "react";
import { getBatchUsers, inviteUser, updateUserRole, removeUserFromBatch, cancelInvite } from "@/actions/user-management";
import { getGroups } from "@/actions/group";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { getRoleDisplayName, formatDate } from "@/lib/utils";
import type { UserRole } from "@/types";

interface Batch {
  id: string;
  name: string;
  status: string;
}

interface UserManagementProps {
  batches: Batch[];
}

interface BatchUser {
  id: string;
  userId: string;
  batchId: string;
  role: UserRole;
  status: "invited" | "active";
  invitedAt: Date;
  user: {
    id: string;
    email: string;
    name: string;
    profileImage: string | null;
  };
  batch: {
    id: string;
    name: string;
    status: string;
  };
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "mentor", label: "Mentor" },
  { value: "founder", label: "Founder" },
  { value: "co_founder", label: "Co-founder" },
];

export function UserManagement({ batches }: UserManagementProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [users, setUsers] = useState<BatchUser[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [formError, setFormError] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; userName: string } | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; _count: { members: number; posts: number } }>>([]);
  const [selectedRole, setSelectedRole] = useState("founder");

  // Handle batch selection change
  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    setUsers([]); // Clear users when changing batch
    if (batchId) {
      loadUsers(batchId);
    }
  };

  // Load users function
  const loadUsers = (batchId: string) => {
    setIsLoadingUsers(true);
    getBatchUsers(batchId)
      .then((data) => setUsers(data as BatchUser[]))
      .catch(() => setUsers([]))
      .finally(() => setIsLoadingUsers(false));
  };

  // Fetch groups when batch changes
  useEffect(() => {
    if (selectedBatchId) {
      getGroups(selectedBatchId).then((g) => {
        if (g) setGroups(g);
      });
    } else {
      setGroups([]);
    }
  }, [selectedBatchId]);

  const handleInviteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await inviteUser(formData);

      if (result.success) {
        setIsInviteModalOpen(false);
        setInviteLink(result.data.inviteLink);
        setLinkCopied(false);
        loadUsers(selectedBatchId);
        (e.target as HTMLFormElement).reset();
      } else {
        setFormError(result.error);
      }
    });
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    startTransition(async () => {
      const result = await updateUserRole(userId, selectedBatchId, newRole as UserRole);

      if (result.success) {
        loadUsers(selectedBatchId);
      }
    });
  };

  const handleRemoveUser = async (userId: string) => {
    startTransition(async () => {
      const result = await removeUserFromBatch(userId, selectedBatchId);

      if (result.success) {
        loadUsers(selectedBatchId);
        setConfirmRemove(null);
      }
    });
  };

  const handleCancelInvite = async (userId: string, userName: string) => {
    if (!confirm(`Cancel invite for ${userName}? They will need to be re-invited.`)) return;

    startTransition(async () => {
      const result = await cancelInvite(userId);

      if (result.success) {
        loadUsers(selectedBatchId);
      } else {
        alert(result.error);
      }
    });
  };

  const batchOptions = batches.map((batch) => ({
    value: batch.id,
    label: `${batch.name} (${batch.status})`,
  }));

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  return (
    <div className="space-y-6">
      {/* Batch selector */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select
              label="Select Batch"
              options={batchOptions}
              placeholder="Choose a batch to view users..."
              value={selectedBatchId}
              onChange={(e) => handleBatchChange(e.target.value)}
            />
          </div>
          {selectedBatchId && selectedBatch?.status === "active" && (
            <div className="pt-6">
              <Button onClick={() => setIsInviteModalOpen(true)}>
                Invite User
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Users list */}
      {!selectedBatchId ? (
        <EmptyState
          title="No batch selected"
          description="Select a batch from the dropdown above to view and manage its users"
        />
      ) : isLoadingUsers ? (
        <div className="card text-center py-12">
          <p className="text-lg" style={{ color: "var(--color-foreground-secondary)" }}>
            Loading users...
          </p>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title="No users in this batch"
          description="Invite users to get started"
          action={
            selectedBatch?.status === "active" ? (
              <Button onClick={() => setIsInviteModalOpen(true)}>
                Invite First User
              </Button>
            ) : null
          }
        />
        ) : (
          <div className="space-y-4">
            <div className="md:hidden space-y-4">
              {users.map((userBatch) => (
                <div
                  key={userBatch.id}
                  className="p-4 rounded-lg bg-white space-y-4"
                  style={{
                    border: "1px solid var(--color-card-border)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={userBatch.user.profileImage}
                      name={userBatch.user.name}
                      size={40}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{userBatch.user.name}</div>
                      <div className="text-sm truncate" style={{ color: "var(--color-foreground-secondary)" }}>
                        {userBatch.user.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="role">{getRoleDisplayName(userBatch.role)}</Badge>
                    <Badge variant={userBatch.status === "active" ? "success" : "warning"}>
                      {userBatch.status}
                    </Badge>
                  </div>

                  <div className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                    Joined {formatDate(userBatch.invitedAt)}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                    <select
                      value={userBatch.role}
                      onChange={(e) => handleRoleChange(userBatch.userId, e.target.value)}
                      disabled={isPending}
                      className="form-input flex-1"
                      style={{ fontSize: "14px", height: 36 }}
                    >
                      <option value="admin">Admin</option>
                      <option value="mentor">Mentor</option>
                      <option value="founder">Founder</option>
                      <option value="co_founder">Co-founder</option>
                    </select>
                    {userBatch.status === "invited" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(userBatch.userId, userBatch.user.name)}
                        disabled={isPending}
                      >
                        Cancel Invite
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmRemove({ userId: userBatch.userId, userName: userBatch.user.name })}
                      disabled={isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block card">
              <div className="overflow-x-auto">
                <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-card-border)" }}>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-secondary)" }}>
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-secondary)" }}>
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-secondary)" }}>
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-secondary)" }}>
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-secondary)" }}>
                    Joined
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-secondary)" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((userBatch) => (
                  <tr
                    key={userBatch.id}
                    style={{ borderBottom: "1px solid var(--color-card-border)" }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={userBatch.user.profileImage}
                          name={userBatch.user.name}
                          size={36}
                        />
                        <span className="font-medium">{userBatch.user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ color: "var(--color-foreground-secondary)" }}>
                        {userBatch.user.email}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="role">{getRoleDisplayName(userBatch.role)}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={userBatch.status === "active" ? "success" : "warning"}>
                        {userBatch.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ color: "var(--color-foreground-secondary)", fontSize: "14px" }}>
                        {formatDate(userBatch.invitedAt)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={userBatch.role}
                          onChange={(e) => handleRoleChange(userBatch.userId, e.target.value)}
                          disabled={isPending}
                          className="form-input"
                          style={{ minWidth: 140, fontSize: "14px", height: 36 }}
                        >
                          <option value="admin">Admin</option>
                          <option value="mentor">Mentor</option>
                          <option value="founder">Founder</option>
                          <option value="co_founder">Co-founder</option>
                        </select>
                        {userBatch.status === "invited" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvite(userBatch.userId, userBatch.user.name)}
                            disabled={isPending}
                          >
                            Cancel Invite
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmRemove({ userId: userBatch.userId, userName: userBatch.user.name })}
                          disabled={isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Invite Modal */}
      <Modal
        open={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setFormError("");
          setSelectedRole("founder");
        }}
        title="Invite User"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            required
            placeholder="user@example.com"
          />

          <Input
            label="Name"
            name="name"
            type="text"
            required
            placeholder="John Doe"
          />

          <Select
            label="Role"
            name="role"
            options={roleOptions}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            required
          />

          {/* Group Assignment (optional, for founders/co-founders) */}
          {(selectedRole === "founder" || selectedRole === "co_founder") && groups.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Group (Optional)</label>
              <select
                name="groupId"
                className="form-input"
              >
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g._count.members} members)
                  </option>
                ))}
              </select>
            </div>
          )}

          <input type="hidden" name="batchId" value={selectedBatchId} />

          {formError && (
            <div className="form-error p-3 rounded-lg text-sm">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsInviteModalOpen(false);
                setFormError("");
                setSelectedRole("founder");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invite Link Modal */}
      <Modal
        open={!!inviteLink}
        onClose={() => setInviteLink(null)}
        title="Invitation Sent"
      >
        <div className="space-y-4">
          <p style={{ color: "var(--color-foreground-secondary)" }}>
            The user has been invited. Share this link with them if the email doesn&apos;t arrive:
          </p>
          <div
            className="p-3 rounded-lg text-sm break-all font-mono"
            style={{ backgroundColor: "var(--color-background-secondary)", border: "1px solid var(--color-card-border)" }}
          >
            {inviteLink}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setInviteLink(null)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink || "");
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
            >
              {linkCopied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Remove User"
      >
        <div className="space-y-4">
          <p style={{ color: "var(--color-foreground-secondary)" }}>
            Are you sure you want to remove <strong>{confirmRemove?.userName}</strong> from this batch?
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmRemove(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmRemove && handleRemoveUser(confirmRemove.userId)}
              loading={isPending}
            >
              Remove User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
