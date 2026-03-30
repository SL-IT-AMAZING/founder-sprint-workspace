"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { OfficeHourSchedulerModal } from "@/components/office-hours/OfficeHourSchedulerModal";
import { getDisplayName } from "@/lib/utils";
import { isAdmin, isFounder } from "@/lib/permissions-client";
import { requestOfficeHour, respondToRequest, deleteSlot, proposeOfficeHour, grantOfficeHourCredits, markOfficeHourNoShow, getOfficeHourBatchContext, cancelRequest, promoteWaitlistedRequest } from "@/actions/office-hour";
import { useToast } from "@/hooks/useToast";
import type { UserWithBatch, OfficeHourSlotMode, OfficeHourSlotStatus, OfficeHourRequestStatus } from "@/types";
import type { FounderOption, MentorOption } from "@/types/invite";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { displayRangeInUserTimezone } from "@/lib/timezone";
import { addMinutesToDateTimeLocalValue, getDateTimeRangeDurationMinutes } from "@/lib/schedule-form";

interface CompanyMemberInfo {
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
  };
}

interface CompanyForList {
  id: string;
  name: string;
  _count: {
    members: number;
    posts: number;
  };
}

interface OfficeHourRequest {
  id: string;
  agenda?: string | null;
  message: string | null;
  noShow?: boolean;
  status: OfficeHourRequestStatus;
  createdAt: Date;
  requester: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
  };
}

interface OfficeHourSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  status: OfficeHourSlotStatus;
  slotMode: OfficeHourSlotMode;
  googleMeetLink: string | null;
  host: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
  };
  requests: OfficeHourRequest[];
  targetFounderIds: string[];
  company?: {
    id: string;
    name: string;
    members: CompanyMemberInfo[];
  } | null;
  group?: {
    id: string;
    name: string;
    members: CompanyMemberInfo[];
  } | null;
}

interface OfficeHoursListProps {
  user: UserWithBatch;
  slots: OfficeHourSlot[];
  companies: CompanyForList[];
  founders: FounderOption[];
  mentors: MentorOption[];
  requesterStats: {
    totalCredits: number | null;
    remainingCredits: number | null;
    weeklyLimit: number;
    remainingWeeklyRequests: number;
    isBatchActive: boolean;
  };
  batchOptions: Array<{ id: string; name: string }>;
  currentBatchId: string;
}

function getStatusBadgeVariant(status: OfficeHourSlotStatus): "default" | "success" | "warning" | "error" {
  switch (status) {
    case "available":
      return "success";
    case "requested":
      return "warning";
    case "confirmed":
      return "default";
    case "completed":
      return "default";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
}

function getStatusLabel(status: OfficeHourSlotStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "requested":
      return "Requested";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function getSlotModeBadgeVariant(mode: OfficeHourSlotMode): "default" | "success" | "warning" | "error" {
  switch (mode) {
    case "open_batch":
      return "success";
    case "direct_founder":
      return "warning";
    case "direct_company":
    default:
      return "default";
  }
}

function getSlotModeLabel(mode: OfficeHourSlotMode): string {
  switch (mode) {
    case "open_batch":
      return "Open to Batch";
    case "direct_founder":
      return "Direct Invite - Founder";
    case "direct_company":
    default:
      return "Direct Invite - Company";
  }
}

function getSlotModeDescription(slot: OfficeHourSlot): string | null {
  if (slot.slotMode === "open_batch" && slot.status === "available" && !slot.company) {
    return "Any founder in this batch can book this slot for their company. First booking confirms immediately.";
  }

  if (slot.slotMode === "direct_founder") {
    return "This office hour was scheduled as a direct founder invite.";
  }

  if (slot.slotMode === "direct_company") {
    return "This office hour was scheduled as a direct company invite.";
  }

  return null;
}

export function OfficeHoursList({ user, slots, companies, founders, mentors, requesterStats, batchOptions, currentBatchId }: OfficeHoursListProps) {
   const router = useRouter();
   const searchParams = useSearchParams();
   const prefillDate = searchParams.get("date");
   const defaultCompanyId = companies.length === 1 ? companies[0].id : "";

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(Boolean(prefillDate && isAdmin(user.role)));
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<OfficeHourSlot | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(defaultCompanyId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const proposeStartTimeRef = useRef<HTMLInputElement>(null);
  const proposeEndTimeRef = useRef<HTMLInputElement>(null);
  const proposeDurationMinutesRef = useRef(30);
  const [selectedMentorId, setSelectedMentorId] = useState<string>(mentors.length === 1 ? mentors[0].id : "");
  const [grantCreditsModalOpen, setGrantCreditsModalOpen] = useState(false);
  const [selectedCreditFounderId, setSelectedCreditFounderId] = useState<string>("");
  const [grantBatchId, setGrantBatchId] = useState<string>(currentBatchId);
  const [grantFounders, setGrantFounders] = useState<FounderOption[]>(founders);
  const [grantContextLoading, setGrantContextLoading] = useState(false);

  const isAdminUser = isAdmin(user.role);
  const isFounderUser = isFounder(user.role);
  const canRequest = isFounderUser;
  const requestModalTitle = selectedSlot?.slotMode === "open_batch" ? "Book Open Office Hour" : "Request Office Hour";
  const requestSubmitLabel = selectedSlot?.slotMode === "open_batch" ? "Book & Send Invites" : "Send Request";

  const loadGrantBatchContext = async (batchId: string) => {
    if (!isAdminUser) return;

    setGrantContextLoading(true);
    const result = await getOfficeHourBatchContext(batchId);

    if (result.success) {
      setGrantBatchId(batchId);
      setGrantFounders(result.data.founders);
      setSelectedCreditFounderId("");
      setError(null);
    } else {
      setError(result.error);
    }

    setGrantContextLoading(false);
  };

  const resetGrantContext = () => {
    setGrantBatchId(currentBatchId);
    setGrantFounders(founders);
    setSelectedCreditFounderId("");
  };

  const handleProposeStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startVal = e.target.value;
    if (startVal && proposeEndTimeRef.current) {
      const nextEndValue = addMinutesToDateTimeLocalValue(startVal, proposeDurationMinutesRef.current);
      if (nextEndValue) {
        proposeEndTimeRef.current.value = nextEndValue;
      }
    }
  };

  const handleProposeEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (proposeStartTimeRef.current && e.target.value) {
      const nextDuration = getDateTimeRangeDurationMinutes(proposeStartTimeRef.current.value, e.target.value);
      if (nextDuration) {
        proposeDurationMinutesRef.current = nextDuration;
      }
    }
  };

  const handleProposeOH = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mentors.length > 0 && !selectedMentorId) {
      setError("Please select a mentor");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    if (selectedMentorId) {
      formData.set("mentorId", selectedMentorId);
    }
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      setError("End time must be after start time");
      setLoading(false);
      return;
    }
    const result = await proposeOfficeHour(formData);

    if (result.success) {
      setProposeModalOpen(false);
      setSelectedMentorId(mentors.length === 1 ? mentors[0].id : "");
      proposeDurationMinutesRef.current = 30;
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      setError(result.error || "Failed to request office hour");
    }

    setLoading(false);
  };

  const handleRequestSlot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const message = formData.get("message") as string;
    const agenda = (formData.get("agenda") as string) || "";
    const result = await requestOfficeHour(selectedSlot.id, selectedCompanyId, message, agenda);

    if (result.success) {
      if (result.warning) {
        toast.warning(result.warning);
      }
      setRequestModalOpen(false);
      setSelectedSlot(null);
      setSelectedCompanyId("");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleApproveRequest = async (requestId: string) => {
    const result = await respondToRequest(requestId, "approved");
    if (!result.success) {
      toast.error(result.error);
    } else if (result.warning) {
      toast.warning(result.warning);
      router.refresh();
    } else {
      router.refresh();
    }
  };

  const handlePromoteWaitlisted = async (requestId: string) => {
    const result = await promoteWaitlistedRequest(requestId);
    if (!result.success) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to reject this request?")) return;

    const result = await respondToRequest(requestId, "rejected");
    if (!result.success) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;

    setLoading(true);
    const result = await deleteSlot(slotId);
    if (!result.success) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  const handleNoShowToggle = async (requestId: string, nextValue: boolean) => {
    const result = await markOfficeHourNoShow(requestId, nextValue);
    if (!result.success) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;

    const result = await cancelRequest(requestId);
    if (!result.success) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
  };

  const openRequestModal = (slot: OfficeHourSlot) => {
    setSelectedSlot(slot);
    setSelectedCompanyId(defaultCompanyId);
    setRequestModalOpen(true);
    setError(null);
  };

  const handleGrantCredits = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const founderId = (formData.get("founderId") as string) || selectedCreditFounderId;
    const amount = Number(formData.get("amount") as string);
    const reason = (formData.get("reason") as string) || undefined;

    const result = await grantOfficeHourCredits(founderId, grantBatchId, amount, reason);
    if (result.success) {
      setGrantCreditsModalOpen(false);
      resetGrantContext();
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {isFounderUser && (
          <div className="mr-auto flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
            {requesterStats.isBatchActive ? (
              <Badge variant="success">Unlimited during active batch</Badge>
            ) : (
              <Badge variant="default">Credits {requesterStats.remainingCredits}/{requesterStats.totalCredits}</Badge>
            )}
            <Badge variant="warning">Weekly requests left {requesterStats.remainingWeeklyRequests}/{requesterStats.weeklyLimit}</Badge>
          </div>
        )}
        {isFounderUser && companies.length > 0 && (
          <Button onClick={() => setProposeModalOpen(true)} size="sm">
            Request Office Hour
          </Button>
        )}
        {isAdminUser && (
          <>
            <Button variant="secondary" size="sm" onClick={() => { resetGrantContext(); setGrantCreditsModalOpen(true); }}>
              Grant Credits
            </Button>
              <button
               onClick={() => { setScheduleModalOpen(true); setError(null); }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-success)" }}
            >
              Schedule Office Hour
            </button>
          </>
        )}
      </div>

      {slots.length === 0 ? (
        <EmptyState
          title="No office hours available"
          description="Office hour sessions will appear here when scheduled"
          action={
            isAdminUser ? (
               <Button onClick={() => { setScheduleModalOpen(true); setError(null); }}>Schedule Office Hour</Button>
             ) : undefined
           }
        />
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => {
            const isHost = slot.host.id === user.id;
            const pendingRequests = slot.requests.filter((r) => r.status === "pending");
            const waitlistedRequests = slot.requests.filter((r) => r.status === "waitlisted");
            const approvedRequest = slot.requests.find((r) => r.status === "approved");
            const userPendingRequest = slot.requests.find((r) => r.requester.id === user.id && r.status === "pending");
            const userWaitlistedRequest = slot.requests.find((r) => r.requester.id === user.id && r.status === "waitlisted");
            const userHasRequested = Boolean(userPendingRequest);
            const userIsWaitlisted = Boolean(userWaitlistedRequest);
            const canFounderAccessSlot = slot.targetFounderIds.length === 0 || slot.targetFounderIds.includes(user.id);
            const hasActiveRequest = pendingRequests.length > 0 || Boolean(approvedRequest);
            const slotModeDescription = getSlotModeDescription(slot);

            return (
              <div key={slot.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={slot.host.profileImage} name={getDisplayName(slot.host)} size={48} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getDisplayName(slot.host)}</span>
                        <Badge variant={getStatusBadgeVariant(slot.status)}>
                          {getStatusLabel(slot.status)}
                        </Badge>
                        <Badge variant={getSlotModeBadgeVariant(slot.slotMode)}>
                          {getSlotModeLabel(slot.slotMode)}
                        </Badge>
                      </div>
                      <div className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                  {displayRangeInUserTimezone(slot.startTime, slot.endTime, user.timezone, slot.timezone)}
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                        Timezone: {slot.timezone}
                      </div>
                      {slotModeDescription && (
                        <div className="text-xs" style={{ color: "var(--color-foreground-secondary)", maxWidth: 480 }}>
                          {slotModeDescription}
                        </div>
                      )}
                      {(slot.company || slot.group) && (
                        <div className="flex items-center gap-1 text-sm" style={{ color: "var(--color-primary)" }}>
                          <span className="font-medium">Company: {slot.company?.name || slot.group?.name}</span>
                          <span style={{ color: "var(--color-foreground-secondary)" }}>({(slot.company?.members || slot.group?.members)?.length || 0} members)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canRequest && canFounderAccessSlot && slot.status === "available" && !userHasRequested && !userIsWaitlisted && companies.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => openRequestModal(slot)}
                        disabled={loading}
                      >
                        {slot.slotMode === "open_batch" ? "Book" : "Request"}
                      </Button>
                    )}
                    {canRequest && canFounderAccessSlot && !userHasRequested && !userIsWaitlisted && companies.length > 0 && hasActiveRequest && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openRequestModal(slot)}
                        disabled={loading}
                      >
                        Join Waitlist
                      </Button>
                    )}
                    {isFounderUser && companies.length === 0 && slot.status === "available" && (
                      <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                        Join a company to request
                      </p>
                    )}
                    {userHasRequested && (
                      <div className="flex items-center gap-2">
                        <Badge variant="warning">Request Pending</Badge>
                        {userPendingRequest && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelRequest(userPendingRequest.id)}
                            disabled={loading}
                            style={{ color: "var(--color-error)" }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                    {userIsWaitlisted && (
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Waitlisted</Badge>
                        {userWaitlistedRequest && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelRequest(userWaitlistedRequest.id)}
                            disabled={loading}
                            style={{ color: "var(--color-error)" }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                    {(isHost || user.role === "super_admin" || user.role === "admin") &&
                     (user.role === "super_admin" || user.role === "admin" || slot.status === "completed" || (pendingRequests.length === 0 && !approvedRequest)) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={loading}
                        style={{ color: "var(--color-error)" }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {(slot.status === "confirmed" || slot.status === "completed") && slot.googleMeetLink && (
                  <div className="pt-2 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                    <a
                      href={slot.googleMeetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm"
                      style={{ color: "var(--color-accent)" }}
                    >
                      Join Google Meet
                    </a>
                  </div>
                )}

                {approvedRequest && (
                  <div className="pt-2 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={approvedRequest.requester.profileImage}
                        name={getDisplayName(approvedRequest.requester)}
                        size={32}
                      />
                      <div className="text-sm">
                        <div className="font-medium">{getDisplayName(approvedRequest.requester)}</div>
                        {approvedRequest.agenda && (
                          <div style={{ color: "var(--color-foreground-secondary)" }}>
                            Agenda: {approvedRequest.agenda}
                          </div>
                        )}
                        {approvedRequest.message && (
                          <div style={{ color: "var(--color-foreground-secondary)" }}>
                            {approvedRequest.message}
                          </div>
                        )}
                        {approvedRequest.noShow && (
                          <div>
                            <Badge variant="error">No-show</Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {(isHost || isAdminUser) && slot.status === "completed" && (
                          <Button
                            size="sm"
                            variant={approvedRequest.noShow ? "secondary" : "ghost"}
                            onClick={() => handleNoShowToggle(approvedRequest.id, !approvedRequest.noShow)}
                          >
                            {approvedRequest.noShow ? "Mark Attended" : "Mark No-show"}
                          </Button>
                        )}
                        {isAdminUser && slot.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelRequest(approvedRequest.id)}
                            style={{ color: "var(--color-error)" }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {slot.status === "confirmed" && (slot.company || slot.group) && !approvedRequest && (
                  <div className="pt-2 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                    <div className="text-sm font-medium mb-2">Company Members:</div>
                    <div className="flex flex-wrap gap-2">
                      {(slot.company?.members || slot.group?.members || []).slice(0, 5).map((m) => (
                        <div key={m.user.id} className="flex items-center gap-1">
                           <Avatar src={m.user.profileImage} name={getDisplayName(m.user)} size={24} />
                           <span className="text-xs">{getDisplayName(m.user)}</span>
                        </div>
                      ))}
                      {((slot.company?.members || slot.group?.members)?.length || 0) > 5 && (
                        <span className="text-xs" style={{ color: "var(--color-foreground-secondary)" }}>
                          +{((slot.company?.members || slot.group?.members)?.length || 0) - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {isHost && pendingRequests.length > 0 && (
                  <div className="pt-2 border-t space-y-3" style={{ borderColor: "var(--color-card-border)" }}>
                    <div className="text-sm font-medium">Pending Requests</div>
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="flex items-start justify-between gap-4 p-3 rounded" style={{ backgroundColor: "var(--color-background-secondary)" }}>
                        <div className="flex items-start gap-3">
                           <Avatar
                            src={request.requester.profileImage}
                            name={getDisplayName(request.requester)}
                            size={36}
                          />
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{getDisplayName(request.requester)}</div>
                            {request.agenda && (
                              <div className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                                Agenda: {request.agenda}
                              </div>
                            )}
                            {request.message && (
                              <div className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                                {request.message}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={loading}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={loading}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(isHost || isAdminUser) && waitlistedRequests.length > 0 && (
                  <div className="pt-2 border-t space-y-3" style={{ borderColor: "var(--color-card-border)" }}>
                    <div className="text-sm font-medium">Waitlist</div>
                    {waitlistedRequests.map((request) => (
                      <div key={request.id} className="flex items-start justify-between gap-4 p-3 rounded" style={{ backgroundColor: "var(--color-background-secondary)" }}>
                        <div className="flex items-start gap-3">
                          <Avatar src={request.requester.profileImage} name={getDisplayName(request.requester)} size={36} />
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{getDisplayName(request.requester)}</div>
                            {request.agenda && <div className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>Agenda: {request.agenda}</div>}
                            {request.message && <div className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>{request.message}</div>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handlePromoteWaitlisted(request.id)} disabled={loading || hasActiveRequest}>
                            Promote
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleRejectRequest(request.id)} disabled={loading}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={requestModalOpen} onClose={() => setRequestModalOpen(false)} title={requestModalTitle}>
        <form onSubmit={handleRequestSlot} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded text-sm"
              style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
            >
              {error}
            </div>
          )}
          {selectedSlot && (
            <div className="p-3 rounded" style={{ backgroundColor: "var(--color-background-secondary)" }}>
              <div className="flex items-center gap-3">
                <Avatar src={selectedSlot.host.profileImage} name={getDisplayName(selectedSlot.host)} size={40} />
                <div>
                  <div className="font-medium">{getDisplayName(selectedSlot.host)}</div>
                  <div className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                {displayRangeInUserTimezone(selectedSlot.startTime, selectedSlot.endTime, user.timezone, selectedSlot.timezone)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium">Batch</label>
            <div className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-card-border)", backgroundColor: "var(--color-background-secondary)", color: "var(--color-foreground-secondary)" }}>
              {user.batchName}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Company</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-card-border)", backgroundColor: "var(--color-background)" }}
              required
            >
              <option value="">Select your company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Textarea
            label="Agenda"
            name="agenda"
            placeholder="Main topics you want to cover"
            rows={3}
            required
          />
          <Textarea
            label="Message (Optional)"
            name="message"
            placeholder="What would you like to discuss?"
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {requestSubmitLabel}
            </Button>
          </div>
        </form>
      </Modal>

      <OfficeHourSchedulerModal
        open={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setError(null);
        }}
        batchOptions={batchOptions}
        companies={companies.map((company) => ({
          id: company.id,
          name: company.name,
          memberCount: company._count.members,
        }))}
        founders={founders}
        currentBatchId={currentBatchId}
        defaultStartDateTime={prefillDate ? `${prefillDate}T09:00` : undefined}
        defaultEndDateTime={prefillDate ? addMinutesToDateTimeLocalValue(`${prefillDate}T09:00`, 30) || undefined : undefined}
      />

      <Modal open={proposeModalOpen} onClose={() => { setProposeModalOpen(false); setError(null); setSelectedMentorId(mentors.length === 1 ? mentors[0].id : ""); proposeDurationMinutesRef.current = 30; }} title="Request Office Hour">
        <form onSubmit={handleProposeOH} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded text-sm"
              style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
            >
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Batch</label>
            <div className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-card-border)", backgroundColor: "var(--color-background-secondary)", color: "var(--color-foreground-secondary)" }}>
              {user.batchName}
            </div>
          </div>
          {mentors.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mentor</label>
              <select
                name="mentorId"
                value={selectedMentorId}
                onChange={(e) => setSelectedMentorId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              >
                <option value="">Select mentor</option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {(mentor.name || mentor.email)} ({mentor.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Company</label>
            <select
              name="companyId"
              required
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              <option value="">Select your company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Start Time"
            name="startTime"
            type="datetime-local"
            required
            ref={proposeStartTimeRef}
            onChange={handleProposeStartTimeChange}
          />
          <Input
            label="End Time"
            name="endTime"
            type="datetime-local"
            required
            ref={proposeEndTimeRef}
            onChange={handleProposeEndTimeChange}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Timezone</label>
            <select
              name="timezone"
              defaultValue="KST"
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              <option value="KST">KST (Korea Standard Time)</option>
              <option value="PST">PST (Pacific Standard Time)</option>
              <option value="EST">EST (Eastern Standard Time)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <Textarea
            label="Agenda"
            name="agenda"
            placeholder="Main topics you want to cover"
            rows={3}
            required
          />
          <Textarea
            label="Message (Optional)"
            name="message"
            placeholder="What would you like to discuss?"
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setProposeModalOpen(false); setError(null); }}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Send Request
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={grantCreditsModalOpen} onClose={() => { setGrantCreditsModalOpen(false); setError(null); resetGrantContext(); }} title="Grant Office Hour Credits">
        <form onSubmit={handleGrantCredits} className="space-y-4">
          {error && (
            <div className="p-3 rounded text-sm" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}>
              {error}
            </div>
          )}
          {isAdminUser && batchOptions.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Batch</label>
              <select
                value={grantBatchId}
                onChange={(e) => void loadGrantBatchContext(e.target.value)}
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              >
                {batchOptions.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </select>
            </div>
          )}
          <SearchableSelect
            label="Founder"
            options={grantFounders.map((f) => ({
              id: f.id,
              label: f.name || f.email,
              secondary: f.companyName ? `${f.email} - ${f.companyName}` : f.email,
              imageUrl: f.profileImage,
            }))}
            value={selectedCreditFounderId}
            onChange={setSelectedCreditFounderId}
            placeholder="Search founder"
            required
            emptyMessage="No founders found"
          />
          <Input label="Credits to add" name="amount" type="number" min="1" defaultValue="1" required />
          <Textarea label="Reason (Optional)" name="reason" rows={3} placeholder="Why are you granting extra credits?" />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setGrantCreditsModalOpen(false); resetGrantContext(); }}>Cancel</Button>
            <Button type="submit" loading={loading || grantContextLoading}>Grant Credits</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
