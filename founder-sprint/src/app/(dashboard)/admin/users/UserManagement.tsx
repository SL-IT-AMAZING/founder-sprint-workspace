"use client";

import { useState, useTransition, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getAllBatchUsers,
  getBatchUsers,
  inviteUser,
  bulkInviteUsers,
  inviteBatchMembersFromSource,
  updateUserRole,
  updateAdditionalRoles,
  removeUserFromBatch,
  cancelInvite,
  resendInvite,
  deactivateUser,
  reactivateUser,
  dropoutUserFromBatch,
  restoreUserBatch,
  getRecentUserManagementAuditLogs,
  getFounderActivitySummaries,
} from "@/actions/user-management";
import { getCompaniesForSelect } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { EmailChipInput } from "@/components/ui/EmailChipInput";
import { getRolesBelow } from "@/lib/role-hierarchy";
import { getRoleDisplayName as _getRoleDisplayName, formatDate, getDisplayName } from "@/lib/utils";

function getRoleDisplayName(role: string): string {
  return role === "super_admin" ? "Super Admin" : _getRoleDisplayName(role);
}
import { getBatchStatusLabel } from "@/lib/batch-utils";
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
  canAssignSuperAdmin: boolean;
}

interface BatchUser {
  id: string;
  userId: string;
  batchId: string;
  role: UserRole;
  founderId?: string | null;
  additionalRoles: string[];
  status: "invited" | "active" | "dropped_out";
  invitedAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
    profileImage: string | null;
    status: "active" | "inactive" | string;
  };
  batch: {
    id: string;
    name: string;
    status: string;
  };
  allMemberships?: BatchUser[];
}

interface SourceBatchInviteCandidate {
  id: string;
  userId: string;
  role: UserRole;
  founderId?: string | null;
  email: string;
  name: string | null;
  status: "invited" | "active" | "dropped_out";
}

interface AuditEntry {
  id: string;
  action: string;
  userName: string;
  createdAt: Date;
  details: string | null;
}

interface FounderActivityEntry {
  userId: string;
  name: string | null;
  email: string;
  profileImage: string | null;
  role: UserRole;
  submissionCount: number;
  feedbackCount: number;
  officeHourCount: number;
  postCount: number;
}

const baseRoleOptions = [
  { value: "admin", label: "Admin" },
  { value: "mentor", label: "Mentor" },
  { value: "founder", label: "Founder" },
  { value: "co_founder", label: "Co-founder" },
];

const membershipStatusPriority: Record<BatchUser["status"], number> = {
  active: 0,
  invited: 1,
  dropped_out: 2,
};

function compareMembershipsForAllUsersView(a: BatchUser, b: BatchUser) {
  const statusDiff = membershipStatusPriority[a.status] - membershipStatusPriority[b.status];
  if (statusDiff !== 0) return statusDiff;

  const invitedAtDiff = new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime();
  if (invitedAtDiff !== 0) return invitedAtDiff;

  return a.batch.name.localeCompare(b.batch.name);
}

function dedupeBatchUsersByUser(batchUsers: BatchUser[]) {
  const membershipsByUser = new Map<string, BatchUser[]>();

  for (const userBatch of batchUsers) {
    const current = membershipsByUser.get(userBatch.userId) || [];
    current.push(userBatch);
    membershipsByUser.set(userBatch.userId, current);
  }

  return Array.from(membershipsByUser.values())
    .map((memberships) => {
      const sortedMemberships = [...memberships].sort(compareMembershipsForAllUsersView);
      return {
        ...sortedMemberships[0],
        allMemberships: sortedMemberships,
      };
    })
    .sort((a, b) => getDisplayName(a.user).localeCompare(getDisplayName(b.user)));
}

export function UserManagement({ batches, canAssignSuperAdmin }: UserManagementProps) {
  const [users, setUsers] = useState<BatchUser[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedBatchId = searchParams.get("batchId") || "";
  const sourceInviteBatchId = searchParams.get("sourceBatchId") || "";
  const shouldOpenInviteFromQuery = searchParams.get("openInvite") === "1";
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [formError, setFormError] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; userName: string; batchId: string; batchName: string } | null>(null);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; _count: { members: number } }>>([]);
  const [selectedRole, setSelectedRole] = useState("founder");
  const [inviteMode, setInviteMode] = useState<"single" | "bulk">("single");
  const [bulkEmails, setBulkEmails] = useState<string[]>([]);
  const [bulkResults, setBulkResults] = useState<Array<{ email: string; success: boolean; error?: string; inviteLink?: string }> | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [activityEntries, setActivityEntries] = useState<FounderActivityEntry[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [sourceInviteCandidates, setSourceInviteCandidates] = useState<SourceBatchInviteCandidate[]>([]);
  const [selectedSourceUserIds, setSelectedSourceUserIds] = useState<string[]>([]);
  const [isLoadingSourceCandidates, setIsLoadingSourceCandidates] = useState(false);
  const linkCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedScopeRef = useRef<string | null>(null);
  const roleOptions = canAssignSuperAdmin
    ? [{ value: "super_admin", label: "Super Admin" }, ...baseRoleOptions]
    : baseRoleOptions;

  useEffect(() => {
    return () => {
      if (linkCopiedTimerRef.current) clearTimeout(linkCopiedTimerRef.current);
    };
  }, []);

  // Load users function
  const loadUsers = useCallback((batchId: string) => {
    setIsLoadingUsers(true);
    const usersRequest = batchId ? getBatchUsers(batchId) : getAllBatchUsers();
    usersRequest
      .then((data) => setUsers(data as BatchUser[]))
      .catch(() => setUsers([]))
      .finally(() => setIsLoadingUsers(false));
  }, []);

  const loadAuditLogs = useCallback((batchId: string) => {
    setIsLoadingAudit(true);
    getRecentUserManagementAuditLogs(batchId)
      .then((data) => setAuditEntries(data as AuditEntry[]))
      .catch(() => setAuditEntries([]))
      .finally(() => setIsLoadingAudit(false));
  }, []);

  const loadFounderActivity = useCallback((batchId: string) => {
    setIsLoadingActivity(true);
    getFounderActivitySummaries(batchId)
      .then((data) => setActivityEntries(data as FounderActivityEntry[]))
      .catch(() => setActivityEntries([]))
      .finally(() => setIsLoadingActivity(false));
  }, []);

  const loadScope = useCallback((batchId: string) => {
    setUsers([]);
    setAuditEntries([]);
    setActivityEntries([]);
    loadUsers(batchId);
    if (batchId) {
      loadAuditLogs(batchId);
      loadFounderActivity(batchId);
    }
  }, [loadUsers, loadAuditLogs, loadFounderActivity]);

  // Handle batch selection change
  const handleBatchChange = (batchId: string) => {
    setSourceInviteCandidates([]);
    setSelectedSourceUserIds([]);

    const params = new URLSearchParams(searchParams.toString());
    if (batchId) {
      params.set("batchId", batchId);
    } else {
      params.delete("batchId");
      params.delete("sourceBatchId");
      params.delete("openInvite");
      setIsInviteModalOpen(false);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Fetch companies (not batch-scoped)
  useEffect(() => {
    getCompaniesForSelect().then((c) => {
      if (c) setCompanies(c);
    });
  }, []);
  useEffect(() => {
    if (loadedScopeRef.current !== selectedBatchId) {
      loadedScopeRef.current = selectedBatchId;
      loadScope(selectedBatchId);
    }

    if (shouldOpenInviteFromQuery && selectedBatchId) {
      Promise.resolve().then(() => setIsInviteModalOpen(true));
    }
  }, [selectedBatchId, shouldOpenInviteFromQuery, loadScope]);

  useEffect(() => {
    let cancelled = false;

    if (!sourceInviteBatchId || !selectedBatchId) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setSourceInviteCandidates([]);
        setSelectedSourceUserIds([]);
        setIsLoadingSourceCandidates(false);
      });
      return () => {
        cancelled = true;
      };
    }

    Promise.resolve().then(async () => {
      if (cancelled) return;
      setIsLoadingSourceCandidates(true);

      try {
        const data = await getBatchUsers(sourceInviteBatchId);
        if (cancelled) return;

        const candidates = (data as BatchUser[])
          .filter((membership) => membership.status === "active")
          .map((membership) => ({
            id: membership.id,
            userId: membership.userId,
            role: membership.role,
            founderId: membership.role === "co_founder" ? membership.founderId : undefined,
            email: membership.user.email,
            name: membership.user.name,
            status: membership.status,
          }));
        setSourceInviteCandidates(candidates);
        setSelectedSourceUserIds([]);
      } catch {
        if (cancelled) return;
        setSourceInviteCandidates([]);
        setSelectedSourceUserIds([]);
      } finally {
        if (!cancelled) setIsLoadingSourceCandidates(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sourceInviteBatchId, selectedBatchId]);

  const handleInviteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await inviteUser(formData);

      if (result.success) {
        setIsInviteModalOpen(false);
        setInviteLink(result.data.inviteLink ?? null);
        setLinkCopied(false);
        loadUsers(selectedBatchId);
        (e.target as HTMLFormElement).reset();
        if (result.warning) {
          toast.warning(result.warning);
        } else if (result.data.membershipStatus === "active") {
          toast.success("Existing user added directly to this batch");
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

  const toggleSourceCandidate = (userId: string) => {
    setSelectedSourceUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const handleInviteSourceMembers = async () => {
    if (!selectedBatchId || !sourceInviteBatchId || selectedSourceUserIds.length === 0) {
      setFormError("Select at least one source member to invite");
      return;
    }

    setFormError("");

    startTransition(async () => {
      const result = await inviteBatchMembersFromSource({
        sourceBatchId: sourceInviteBatchId,
        targetBatchId: selectedBatchId,
        userIds: selectedSourceUserIds,
      });

      if (result.success) {
        setBulkResults(result.data.results);
        loadUsers(selectedBatchId);
        if (result.warning) {
          toast.warning(result.warning);
        }
      } else {
        setFormError(result.error);
      }
    });
  };

  const refreshCurrentScope = () => loadUsers(selectedBatchId);
  const refreshBatchPanelsIfVisible = (batchId: string) => {
    if (selectedBatchId !== batchId) return;
    loadAuditLogs(batchId);
    loadFounderActivity(batchId);
  };

  const handleRoleChange = async (userBatch: BatchUser, newRole: string) => {
    startTransition(async () => {
      const result = await updateUserRole(userBatch.userId, userBatch.batchId, newRole as UserRole);

      if (result.success) {
        refreshCurrentScope();
        refreshBatchPanelsIfVisible(userBatch.batchId);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleToggleAdditionalRole = async (userBatch: BatchUser, role: UserRole, checked: boolean) => {
    const nextRoles = checked
      ? Array.from(new Set([...(userBatch.additionalRoles || []), role]))
      : (userBatch.additionalRoles || []).filter((additionalRole) => additionalRole !== role);

    startTransition(async () => {
      const result = await updateAdditionalRoles(userBatch.userId, userBatch.batchId, nextRoles);
      if (result.success) {
        refreshCurrentScope();
        refreshBatchPanelsIfVisible(userBatch.batchId);
      } else {
        toast.error(result.error);
      }
    });
  };

  const getVisibleRoles = (userBatch: BatchUser) => Array.from(
    new Set<UserRole>([
      userBatch.role,
      ...(userBatch.additionalRoles || []).filter((role): role is UserRole =>
        ["admin", "mentor", "founder", "co_founder"].includes(role)
      ),
    ])
  );

  const renderRoleBadges = (userBatch: BatchUser) => (
    <div className="flex items-center gap-2 flex-wrap">
      {Array.from(new Set(getDisplayMemberships(userBatch).flatMap((membership) => getVisibleRoles(membership)))).map((role) => (
        <Badge key={`${userBatch.userId}-${role}`} variant="role">{getRoleDisplayName(role)}</Badge>
      ))}
    </div>
  );

  const renderAdditionalRoleControls = (userBatch: BatchUser) => {
    if (userBatch.role === "super_admin") return null;

    const options = getRolesBelow(userBatch.role);
    if (options.length === 0) return null;

    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs" style={{ color: "var(--color-foreground-secondary)" }}>Also</span>
        {options.map((role) => (
          <label key={`${userBatch.id}-${role}-toggle`} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={(userBatch.additionalRoles || []).includes(role)}
              onChange={(e) => handleToggleAdditionalRole(userBatch, role, e.target.checked)}
              disabled={isPending}
            />
            {getRoleDisplayName(role)}
          </label>
        ))}
      </div>
    );
  };

  const renderRoleEditor = (userBatch: BatchUser, compact = false) => {
    if (userBatch.role === "super_admin") {
      return <span className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>Super admins are managed separately.</span>;
    }

    const editableRoleOptions = canAssignSuperAdmin
      ? [{ value: "super_admin", label: "Super Admin" }, ...baseRoleOptions]
      : baseRoleOptions;

    return (
      <div className={`flex ${compact ? "flex-col" : "flex-col items-end"} gap-2`}>
        <select
          value={userBatch.role}
          onChange={(e) => handleRoleChange(userBatch, e.target.value)}
          disabled={isPending}
          className={compact ? "form-input flex-1" : "form-input"}
          style={compact ? { fontSize: "14px", height: 36 } : { minWidth: 140, fontSize: "14px", height: 36 }}
        >
          {editableRoleOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {renderAdditionalRoleControls(userBatch)}
      </div>
    );
  };

  const handleRemoveUser = async (userId: string, batchId: string) => {
    startTransition(async () => {
      const result = await removeUserFromBatch(userId, batchId);

      if (result.success) {
        refreshCurrentScope();
        refreshBatchPanelsIfVisible(batchId);
        setConfirmRemove(null);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleCancelInvite = async (userId: string, batchId: string, userName: string, batchName: string) => {
    if (!confirm(`Cancel invite for ${userName} in ${batchName}? They will need to be re-invited.`)) return;

    startTransition(async () => {
      const result = await cancelInvite(userId, batchId);

      if (result.success) {
        refreshCurrentScope();
        refreshBatchPanelsIfVisible(batchId);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleResendInvite = async (userId: string, batchId: string) => {
    startTransition(async () => {
      const result = await resendInvite(userId, batchId);
      if (result.success) {
        if (result.warning) {
          toast.warning(result.warning);
          setInviteLink(result.data.inviteLink);
        } else {
          toast.success("Invitation resent");
        }
        refreshBatchPanelsIfVisible(batchId);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDeactivateUser = async (userId: string, batchId: string, userName: string) => {
    if (!confirm(`Deactivate ${userName}? They will no longer be able to sign in.`)) return;

    startTransition(async () => {
      const result = await deactivateUser(userId, batchId);
      if (result.success) {
        toast.success("User deactivated");
        refreshCurrentScope();
        refreshBatchPanelsIfVisible(batchId);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleReactivateUser = async (userId: string, batchId: string) => {
    startTransition(async () => {
      const result = await reactivateUser(userId, batchId);
      if (result.success) {
        toast.success("User reactivated");
        refreshCurrentScope();
        refreshBatchPanelsIfVisible(batchId);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDropoutUser = async (userId: string, batchId: string, userName: string, batchName: string) => {
    if (!confirm(`Mark ${userName} as dropped out from ${batchName}? They will lose access to this batch but remain active in other batches.`)) return;

    startTransition(async () => {
      const result = await dropoutUserFromBatch(userId, batchId);
      if (result.success) {
        toast.success("User dropped out from batch");
        refreshCurrentScope();
        refreshBatchPanelsIfVisible(batchId);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRestoreBatchUser = async (userId: string, batchId: string) => {
    startTransition(async () => {
      const result = await restoreUserBatch(userId, batchId);
      if (result.success) {
        toast.success("Batch membership restored");
        refreshCurrentScope();
        refreshBatchPanelsIfVisible(batchId);
      } else {
        toast.error(result.error);
      }
    });
  };

  const getAuditDescription = (entry: AuditEntry) => {
    let details: Record<string, unknown> = {};
    try {
      details = entry.details ? JSON.parse(entry.details) : {};
    } catch {
      details = {};
    }

    const userEmail = typeof details.userEmail === "string" ? details.userEmail : "user";
    const previousRole = typeof details.previousRole === "string" ? details.previousRole : undefined;
    const newRole = typeof details.newRole === "string" ? details.newRole : undefined;

    if (entry.action === "user_role_changed") {
      return `${entry.userName} changed ${userEmail} role from ${previousRole || "unknown"} to ${newRole || "unknown"}`;
    }

    if (entry.action === "user_additional_roles_changed") {
      return `${entry.userName} updated additional roles for ${userEmail}`;
    }

    if (entry.action === "user_deactivated") {
      return `${entry.userName} deactivated ${userEmail}`;
    }

    if (entry.action === "user_reactivated") {
      return `${entry.userName} reactivated ${userEmail}`;
    }

    if (entry.action === "user_batch_dropped_out") {
      return `${entry.userName} marked ${userEmail} as dropped out from this batch`;
    }

    if (entry.action === "user_batch_restored") {
      return `${entry.userName} restored ${userEmail} to this batch`;
    }

    if (entry.action === "invite_resent") {
      return `${entry.userName} resent an invite to ${userEmail}`;
    }

    return `${entry.userName} performed ${entry.action}`;
  };

  const batchOptions = [
    { value: "", label: "All Users" },
    ...batches.map((batch) => ({
      value: batch.id,
      label: `${batch.name} (${getBatchStatusLabel({ status: batch.status as BatchStatus, endDate: new Date(batch.endDate) })})`,
    })),
  ];

  const isAllUsersView = !selectedBatchId;
  const displayUsers = useMemo(
    () => (isAllUsersView ? dedupeBatchUsersByUser(users) : users),
    [isAllUsersView, users]
  );
  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const sourceInviteBatch = batches.find((b) => b.id === sourceInviteBatchId);
  const founderChoices = users.filter((userBatch) => getVisibleRoles(userBatch).includes("founder"));
  const userListDescription = isAllUsersView
    ? `Showing all users (${displayUsers.length})`
    : `Showing users in ${selectedBatch?.name || "selected batch"} (${displayUsers.length})`;

  const getDisplayMemberships = (userBatch: BatchUser) => userBatch.allMemberships || [userBatch];

  const hasMultipleMembershipsInAllUsersView = (userBatch: BatchUser) =>
    isAllUsersView && getDisplayMemberships(userBatch).length > 1;

  const renderBatchBadge = (userBatch: BatchUser) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {getDisplayMemberships(userBatch).map((membership) => (
        <Badge key={membership.id} variant="outline" size="sm">{membership.batch.name}</Badge>
      ))}
    </div>
  );

  const renderStatusBadges = (userBatch: BatchUser) => {
    const statuses = Array.from(new Set(getDisplayMemberships(userBatch).map((membership) => membership.status)));

    return (
      <div className="flex items-center gap-2 flex-wrap">
        {statuses.map((status) => (
          <Badge key={`${userBatch.userId}-${status}`} variant={status === "active" ? "success" : status === "dropped_out" ? "default" : "warning"}>
            {status}
          </Badge>
        ))}
        {userBatch.user.status === "inactive" && (
          <Badge variant="error">Deactivated</Badge>
        )}
      </div>
    );
  };

  const renderMembershipManagementHint = () => (
    <span className="text-sm text-right" style={{ color: "var(--color-foreground-secondary)" }}>
      Filter by a batch to manage memberships.
    </span>
  );

  const renderMembershipActions = (userBatch: BatchUser, compact = false) => (
    hasMultipleMembershipsInAllUsersView(userBatch) ? (
      renderMembershipManagementHint()
    ) : (
      <>
        {renderRoleEditor(userBatch, compact)}
        {userBatch.role !== "super_admin" && (
          <div className={`flex items-center ${compact ? "" : "justify-end"} gap-2 flex-wrap`}>
            {userBatch.status === "invited" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResendInvite(userBatch.userId, userBatch.batchId)}
                  disabled={isPending}
                >
                  Resend Invite
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelInvite(userBatch.userId, userBatch.batchId, getDisplayName(userBatch.user), userBatch.batch.name)}
                  disabled={isPending}
                >
                  Cancel Invite
                </Button>
              </>
            )}
            {userBatch.user.status === "inactive" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReactivateUser(userBatch.userId, userBatch.batchId)}
                disabled={isPending}
              >
                Reactivate
              </Button>
            ) : userBatch.status === "dropped_out" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRestoreBatchUser(userBatch.userId, userBatch.batchId)}
                disabled={isPending}
              >
                Restore Batch
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDropoutUser(userBatch.userId, userBatch.batchId, getDisplayName(userBatch.user), userBatch.batch.name)}
                  disabled={isPending || userBatch.status !== "active"}
                >
                  Dropout
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeactivateUser(userBatch.userId, userBatch.batchId, getDisplayName(userBatch.user))}
                  disabled={isPending}
                >
                  Deactivate
                </Button>
              </>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={() => openRemoveConfirm(userBatch)}
              disabled={isPending}
            >
              Remove
            </Button>
          </div>
        )}
      </>
    )
  );

  const openRemoveConfirm = (userBatch: BatchUser) => {
    setConfirmRemove({
      userId: userBatch.userId,
      userName: getDisplayName(userBatch.user),
      batchId: userBatch.batchId,
      batchName: userBatch.batch.name,
    });
  };

  return (
    <div className="space-y-6">
      {/* Batch selector */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select
              label="Filter by Batch"
              options={batchOptions}
              placeholder="Choose a batch filter..."
              value={selectedBatchId}
              onChange={(e) => handleBatchChange(e.target.value)}
            />
          </div>
          {selectedBatchId && selectedBatch && (
            <div className="pt-6">
              <Button onClick={() => setIsInviteModalOpen(true)}>
                Invite User
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Users list */}
      {isLoadingUsers ? (
        <div className="card text-center py-12">
          <p className="text-lg" style={{ color: "var(--color-foreground-secondary)" }}>
            Loading users...
          </p>
        </div>
      ) : displayUsers.length === 0 ? (
        <EmptyState
          title={isAllUsersView ? "No users found" : "No users in this batch"}
          description={isAllUsersView ? "No batch memberships found yet" : "Invite users to get started"}
          action={
            selectedBatchId && selectedBatch ? (
              <Button onClick={() => setIsInviteModalOpen(true)}>
                Invite First User
              </Button>
            ) : null
          }
        />
        ) : (
          <div className="space-y-4">
            <div className="card py-3">
              <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                {userListDescription}
              </p>
            </div>
            <div className="md:hidden space-y-4">
              {displayUsers.map((userBatch) => (
                <div
                  key={userBatch.id}
                  className="p-4 rounded-lg bg-white space-y-4"
                  style={{
                    border: "1px solid var(--color-card-border)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}
                >
                  <Link
                    href={`/profile/${userBatch.user.id}`}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
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
                  </Link>
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                    <span>Batch</span>
                    {renderBatchBadge(userBatch)}
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    {renderRoleBadges(userBatch)}
                    {renderStatusBadges(userBatch)}
                  </div>

                  <div className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                    Joined {formatDate(userBatch.invitedAt)}
                  </div>

                  <div className="space-y-3 pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                    {renderMembershipActions(userBatch, true)}
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
                    Batch
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
                {displayUsers.map((userBatch) => (
                  <tr
                    key={userBatch.id}
                    style={{ borderBottom: "1px solid var(--color-card-border)" }}
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/profile/${userBatch.user.id}`}
                        className="flex items-center gap-3 hover:opacity-80"
                      >
                         <Avatar
                          src={userBatch.user.profileImage}
                          name={getDisplayName(userBatch.user)}
                          size={36}
                        />
                        <span className="font-medium">{getDisplayName(userBatch.user)}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/profile/${userBatch.user.id}`}
                        className="hover:opacity-80"
                        style={{ color: "var(--color-foreground-secondary)" }}
                      >
                        {userBatch.user.email}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      {renderBatchBadge(userBatch)}
                    </td>
                    <td className="py-3 px-4">
                      {renderRoleBadges(userBatch)}
                    </td>
                    <td className="py-3 px-4">
                      {renderStatusBadges(userBatch)}
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ color: "var(--color-foreground-secondary)", fontSize: "14px" }}>
                        {formatDate(userBatch.invitedAt)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-end gap-2">
                        {renderMembershipActions(userBatch)}
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

      {selectedBatchId && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-medium">Recent Audit Entries</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadAuditLogs(selectedBatchId)}
              disabled={isPending || isLoadingAudit}
            >
              Refresh
            </Button>
          </div>
          {isLoadingAudit ? (
            <p style={{ color: "var(--color-foreground-secondary)" }}>Loading recent activity...</p>
          ) : auditEntries.length === 0 ? (
            <p style={{ color: "var(--color-foreground-secondary)" }}>No recent role or lifecycle changes.</p>
          ) : (
            <div className="space-y-2">
              {auditEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg"
                  style={{ border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-background-secondary)" }}
                >
                  <p className="text-sm">{getAuditDescription(entry)}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-foreground-secondary)" }}>
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedBatchId && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-medium">Founder Activity</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadFounderActivity(selectedBatchId)}
              disabled={isPending || isLoadingActivity}
            >
              Refresh
            </Button>
          </div>
          {isLoadingActivity ? (
            <p style={{ color: "var(--color-foreground-secondary)" }}>Loading founder activity...</p>
          ) : activityEntries.length === 0 ? (
            <p style={{ color: "var(--color-foreground-secondary)" }}>No founder activity yet.</p>
          ) : (
            <div className="space-y-2">
              {activityEntries.map((entry) => (
                <div
                  key={entry.userId}
                  className="p-3 rounded-lg flex items-center justify-between gap-4"
                  style={{ border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-background-secondary)" }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={entry.profileImage} name={getDisplayName(entry)} size={36} />
                    <div>
                      <p className="text-sm font-medium">{getDisplayName(entry)}</p>
                      <p className="text-xs" style={{ color: "var(--color-foreground-secondary)" }}>{entry.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                    <Badge variant="default">Submissions {entry.submissionCount}</Badge>
                    <Badge variant="default">Feedback {entry.feedbackCount}</Badge>
                    <Badge variant="default">OH {entry.officeHourCount}</Badge>
                    <Badge variant="default">Posts {entry.postCount}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        title={bulkResults ? "Invitation Results" : "Add Users"}
      >
        {!bulkResults && sourceInviteBatchId && selectedBatchId && (
          <div
            className="space-y-3"
            style={{
              padding: "16px",
              borderRadius: "10px",
              backgroundColor: "var(--color-background-secondary)",
              border: "1px solid var(--color-card-border)",
              marginBottom: "16px",
            }}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">Invite from source batch</p>
              <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                Preload active members from <strong>{sourceInviteBatch?.name || "the source batch"}</strong> into <strong>{selectedBatch?.name || "this batch"}</strong>.
              </p>
            </div>

            {isLoadingSourceCandidates ? (
              <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>Loading source members...</p>
            ) : sourceInviteCandidates.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>No active source members available to preload.</p>
            ) : (
              <>
                <div
                  style={{
                    maxHeight: "180px",
                    overflowY: "auto",
                    borderRadius: "8px",
                    border: "1px solid var(--color-card-border)",
                    backgroundColor: "white",
                  }}
                >
                  {sourceInviteCandidates.map((candidate, index) => (
                    <label
                      key={candidate.userId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderBottom: index < sourceInviteCandidates.length - 1 ? "1px solid var(--color-card-border)" : "none",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSourceUserIds.includes(candidate.userId)}
                        onChange={() => toggleSourceCandidate(candidate.userId)}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="text-sm font-medium">{candidate.name || candidate.email}</div>
                        <div className="text-xs" style={{ color: "var(--color-foreground-secondary)" }}>{candidate.email}</div>
                      </div>
                      <Badge variant="role">{getRoleDisplayName(candidate.role)}</Badge>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between gap-2">
                  <p className="text-xs" style={{ color: "var(--color-foreground-secondary)" }}>
                    {selectedSourceUserIds.length} selected
                  </p>
                  <Button type="button" variant="ghost" size="sm" onClick={handleInviteSourceMembers} loading={isPending}>
                    Invite Selected Members
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

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
              onClick={() => { setInviteMode("bulk"); setFormError(""); if (selectedRole === "co_founder") setSelectedRole("founder"); }}
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
                  <div style={{ fontSize: "13px", color: "var(--color-foreground-secondary)" }}>Invited</div>
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
                  <div style={{ fontSize: "13px", color: "var(--color-foreground-secondary)" }}>Skipped</div>
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

            {selectedRole === "co_founder" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Primary Founder</label>
                <select name="founderId" className="form-input" required>
                  <option value="">Select founder</option>
                  {founderChoices.map((userBatch) => (
                    <option key={userBatch.userId} value={userBatch.userId}>
                      {getDisplayName(userBatch.user)} ({userBatch.user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Company Assignment (optional, for founders/co-founders) */}
            {(selectedRole === "founder" || selectedRole === "co_founder") && companies.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Company (Optional)</label>
                <select
                  name="companyId"
                  className="form-input"
                >
                  <option value="">No company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c._count.members} members)
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
                Add User
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
              options={roleOptions.filter((option) => option.value !== "co_founder")}
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
                Add Users
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
            Are you sure you want to remove <strong>{confirmRemove?.userName}</strong> from <strong>{confirmRemove?.batchName}</strong>?
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
              onClick={() => confirmRemove && handleRemoveUser(confirmRemove.userId, confirmRemove.batchId)}
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
