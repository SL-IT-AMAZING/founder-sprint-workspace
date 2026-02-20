"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { getBatchUsers, inviteUser, bulkInviteUsers, updateUserRole, removeUserFromBatch, cancelInvite } from "@/actions/user-management";
import { getGroups } from "@/actions/group";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { EmailChipInput } from "@/components/ui/EmailChipInput";
import { getRoleDisplayName, formatDate, getDisplayName } from "@/lib/utils";
import { getBatchStatusLabel, isBatchActive } from "@/lib/batch-utils";
import { useToast } from "@/hooks/useToast";
import type { UserRole, BatchStatus } from "@/types";

interface Batch {
  id: string;
  name: string;
  status: string;
  endDate: Date;
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
    name: string | null;
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
  const toast = useToast();
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [formError, setFormError] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; userName: string } | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; _count: { members: number; posts: number } }>>([]);
  const [selectedRole, setSelectedRole] = useState("founder");
  const [inviteMode, setInviteMode] = useState<"single" | "bulk">("single");
  const [bulkEmails, setBulkEmails] = useState<string[]>([]);
  const [bulkResults, setBulkResults] = useState<Array<{ email: string; success: boolean; error?: string; inviteLink?: string }> | null>(null);
  const linkCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (linkCopiedTimerRef.current) clearTimeout(linkCopiedTimerRef.current);
    };
  }, []);

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
        if (result.warning) {
          toast.warning(result.warning);
        }
      } else {
        setFormError(result.error);
      }
    });
  };

  const handleBulkInviteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (bulkEmails.length === 0) {
      setFormError("Add at least one email address");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("emails", bulkEmails.join("\n"));

    startTransition(async () => {
      const result = await bulkInviteUsers(formData);

      if (result.success) {
        setBulkResults(result.data.results);
        setBulkEmails([]);
        loadUsers(selectedBatchId);
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
        toast.error(result.error);
      }
    });
  };

  const batchOptions = batches.map((batch) => ({
    value: batch.id,
    label: `${batch.name} (${getBatchStatusLabel({ status: batch.status as BatchStatus, endDate: new Date(batch.endDate) })})`,
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
          {selectedBatchId && selectedBatch && isBatchActive({ status: selectedBatch.status as BatchStatus, endDate: new Date(selectedBatch.endDate) }) && (
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
            selectedBatch && isBatchActive({ status: selectedBatch.status as BatchStatus, endDate: new Date(selectedBatch.endDate) }) ? (
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
                      name={getDisplayName(userBatch.user)}
                      size={40}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{getDisplayName(userBatch.user)}</div>
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
                        onClick={() => handleCancelInvite(userBatch.userId, getDisplayName(userBatch.user))}
                        disabled={isPending}
                      >
                        Cancel Invite
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmRemove({ userId: userBatch.userId, userName: getDisplayName(userBatch.user) })}
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
                          name={getDisplayName(userBatch.user)}
                          size={36}
                        />
                        <span className="font-medium">{getDisplayName(userBatch.user)}</span>
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
                            onClick={() => handleCancelInvite(userBatch.userId, getDisplayName(userBatch.user))}
                            disabled={isPending}
                          >
                            Cancel Invite
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmRemove({ userId: userBatch.userId, userName: getDisplayName(userBatch.user) })}
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
          setInviteMode("single");
          setBulkEmails([]);
          setBulkResults(null);
        }}
        title={bulkResults ? "Invitation Results" : "Invite Users"}
      >
        {/* Mode toggle — hidden when showing results */}
        {!bulkResults && (
          <div
            style={{
              display: "flex",
              padding: "3px",
              borderRadius: "8px",
              backgroundColor: "var(--color-background-secondary)",
              border: "1px solid var(--color-card-border)",
              marginBottom: "16px",
            }}
          >
            <button
              type="button"
              onClick={() => { setInviteMode("single"); setFormError(""); }}
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                backgroundColor: inviteMode === "single" ? "white" : "transparent",
                color: inviteMode === "single" ? "var(--color-foreground)" : "var(--color-foreground-secondary)",
                boxShadow: inviteMode === "single" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => { setInviteMode("bulk"); setFormError(""); }}
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                backgroundColor: inviteMode === "bulk" ? "white" : "transparent",
                color: inviteMode === "bulk" ? "var(--color-foreground)" : "var(--color-foreground-secondary)",
                boxShadow: inviteMode === "bulk" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Bulk
            </button>
          </div>
        )}

        {/* ── Results view ── */}
        {bulkResults ? (() => {
          const successCount = bulkResults.filter((r) => r.success).length;
          const failCount = bulkResults.filter((r) => !r.success).length;
          return (
            <div className="space-y-4">
              {/* Summary cards */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(34, 197, 94, 0.08)",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                  }}
                >
                  <div style={{ fontSize: "24px", fontWeight: 600, color: "#16a34a" }}>{successCount}</div>
                  <div style={{ fontSize: "13px", color: "var(--color-foreground-secondary)" }}>Sent</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: failCount > 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(0,0,0,0.02)",
                    border: failCount > 0 ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid var(--color-card-border)",
                  }}
                >
                  <div style={{ fontSize: "24px", fontWeight: 600, color: failCount > 0 ? "#dc2626" : "var(--color-foreground-secondary)" }}>{failCount}</div>
                  <div style={{ fontSize: "13px", color: "var(--color-foreground-secondary)" }}>Failed</div>
                </div>
              </div>

              {/* Per-email results */}
              <div
                style={{
                  maxHeight: "240px",
                  overflowY: "auto",
                  borderRadius: "8px",
                  border: "1px solid var(--color-card-border)",
                }}
              >
                {bulkResults.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      fontSize: "14px",
                      borderBottom: i < bulkResults.length - 1 ? "1px solid var(--color-card-border)" : "none",
                    }}
                  >
                    <span style={{ color: r.success ? "#16a34a" : "#dc2626", flexShrink: 0 }}>
                      {r.success ? "\u2713" : "\u2717"}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.email}
                    </span>
                    {r.error && (
                      <span style={{ fontSize: "12px", color: "#dc2626", flexShrink: 0 }}>
                        {r.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setBulkResults(null);
                    setBulkEmails([]);
                    setFormError("");
                  }}
                >
                  Invite More
                </Button>
                <Button
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setBulkResults(null);
                    setBulkEmails([]);
                    setFormError("");
                    setInviteMode("single");
                    setSelectedRole("founder");
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          );
        })()

        /* ── Single invite form ── */
        : inviteMode === "single" ? (
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              required
              placeholder="user@example.com"
            />

            <Input
              label="Name (Optional)"
              name="name"
              type="text"
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
                  setInviteMode("single");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isPending}>
                Send Invitation
              </Button>
            </div>
          </form>

        /* ── Bulk invite form ── */
        ) : (
          <form onSubmit={handleBulkInviteSubmit} className="space-y-4">
            <EmailChipInput
              label="Email Addresses"
              value={bulkEmails}
              onChange={setBulkEmails}
              placeholder="Type or paste emails..."
            />

            <Select
              label="Role"
              name="role"
              options={roleOptions}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
            />

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
                  setInviteMode("single");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isPending}>
                Send Invitations
              </Button>
            </div>
          </form>
        )}
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
                if (linkCopiedTimerRef.current) clearTimeout(linkCopiedTimerRef.current);
                linkCopiedTimerRef.current = setTimeout(() => setLinkCopied(false), 2000);
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
