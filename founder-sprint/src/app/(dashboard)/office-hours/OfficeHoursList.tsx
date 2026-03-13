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
import { getDisplayName } from "@/lib/utils";
import { isAdmin, isFounder } from "@/lib/permissions-client";
import { requestOfficeHour, respondToRequest, deleteSlot, scheduleGroupOfficeHour, scheduleIndividualOfficeHour, proposeOfficeHour, grantOfficeHourCredits, markOfficeHourNoShow } from "@/actions/office-hour";
import { useToast } from "@/hooks/useToast";
import type { UserWithBatch, OfficeHourSlotStatus, OfficeHourRequestStatus } from "@/types";
import type { FounderOption, MentorOption } from "@/types/invite";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { displayRangeInUserTimezone } from "@/lib/timezone";

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
  googleMeetLink: string | null;
  host: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
  };
  requests: OfficeHourRequest[];
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
    totalCredits: number;
    remainingCredits: number;
    weeklyLimit: number;
    remainingWeeklyRequests: number;
  };
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

export function OfficeHoursList({ user, slots, companies, founders, mentors, requesterStats }: OfficeHoursListProps) {
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
   const scheduleEndTimeRef = useRef<HTMLInputElement>(null);
   const proposeEndTimeRef = useRef<HTMLInputElement>(null);
    const [scheduleMode, setScheduleMode] = useState<"company" | "individual">("company");
    const [selectedFounderId, setSelectedFounderId] = useState<string>("");
    const [selectedMentorId, setSelectedMentorId] = useState<string>(mentors.length === 1 ? mentors[0].id : "");
    const [grantCreditsModalOpen, setGrantCreditsModalOpen] = useState(false);
    const [selectedCreditFounderId, setSelectedCreditFounderId] = useState<string>("");

  const handleScheduleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startVal = e.target.value;
    if (startVal && scheduleEndTimeRef.current) {
      const startDate = new Date(startVal);
      startDate.setMinutes(startDate.getMinutes() + 30);
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, "0");
      const day = String(startDate.getDate()).padStart(2, "0");
      const hours = String(startDate.getHours()).padStart(2, "0");
      const minutes = String(startDate.getMinutes()).padStart(2, "0");
      scheduleEndTimeRef.current.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  };

  const handleProposeStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startVal = e.target.value;
    if (startVal && proposeEndTimeRef.current) {
      const startDate = new Date(startVal);
      startDate.setMinutes(startDate.getMinutes() + 30);
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, "0");
      const day = String(startDate.getDate()).padStart(2, "0");
      const hours = String(startDate.getHours()).padStart(2, "0");
      const minutes = String(startDate.getMinutes()).padStart(2, "0");
      proposeEndTimeRef.current.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  };

  const handleScheduleOH = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      setError("End time must be after start time");
      setLoading(false);
      return;
    }

    let result;
    if (scheduleMode === "individual") {
      if (!selectedFounderId) {
        setError("Please select a founder");
        setLoading(false);
        return;
      }
      formData.set("founderId", selectedFounderId);
      result = await scheduleIndividualOfficeHour(formData);
    } else {
      formData.set("companyId", selectedCompanyId);
      result = await scheduleGroupOfficeHour(formData);
    }

    if (result.success) {
      if ('warning' in result && result.warning) {
        setError(result.warning);
      }
      setScheduleModalOpen(false);
      setScheduleMode("company");
      setSelectedFounderId("");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      setError(result.error || "Failed to schedule");
    }

    setLoading(false);
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
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      setError(result.error || "Failed to request office hour");
    }

    setLoading(false);
  };

  const isAdminUser = isAdmin(user.role);
  const isFounderUser = isFounder(user.role);
  const canRequest = isFounderUser;

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

  const openRequestModal = (slot: OfficeHourSlot) => {
    setSelectedSlot(slot);
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

    const result = await grantOfficeHourCredits(founderId, user.batchId, amount, reason);
    if (result.success) {
      setGrantCreditsModalOpen(false);
      setSelectedCreditFounderId("");
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
            <Badge variant="default">Credits {requesterStats.remainingCredits}/{requesterStats.totalCredits}</Badge>
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
            <Button variant="secondary" size="sm" onClick={() => setGrantCreditsModalOpen(true)}>
              Grant Credits
            </Button>
            <button
              onClick={() => setScheduleModalOpen(true)}
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
              <Button onClick={() => setScheduleModalOpen(true)}>Schedule Office Hour</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => {
            const isHost = slot.host.id === user.id;
            const pendingRequests = slot.requests.filter((r) => r.status === "pending");
            const approvedRequest = slot.requests.find((r) => r.status === "approved");
            const userHasRequested = slot.requests.some((r) => r.requester.id === user.id && r.status === "pending");

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
                      </div>
                      <div className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                  {displayRangeInUserTimezone(slot.startTime, slot.endTime, user.timezone, slot.timezone)}
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                        Timezone: {slot.timezone}
                      </div>
                      {(slot.company || slot.group) && (
                        <div className="flex items-center gap-1 text-sm" style={{ color: "var(--color-primary)" }}>
                          <span className="font-medium">Company: {slot.company?.name || slot.group?.name}</span>
                          <span style={{ color: "var(--color-foreground-secondary)" }}>({(slot.company?.members || slot.group?.members)?.length || 0} members)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canRequest && slot.status === "available" && !userHasRequested && companies.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => openRequestModal(slot)}
                        disabled={loading}
                      >
                        Request
                      </Button>
                    )}
                    {isFounderUser && companies.length === 0 && slot.status === "available" && (
                      <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                        Join a company to request
                      </p>
                    )}
                    {userHasRequested && (
                      <Badge variant="warning">Request Pending</Badge>
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
                      {(isHost || isAdminUser) && slot.status === "completed" && (
                        <Button
                          size="sm"
                          variant={approvedRequest.noShow ? "secondary" : "ghost"}
                          onClick={() => handleNoShowToggle(approvedRequest.id, !approvedRequest.noShow)}
                        >
                          {approvedRequest.noShow ? "Mark Attended" : "Mark No-show"}
                        </Button>
                      )}
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
              </div>
            );
          })}
        </div>
      )}

      <Modal open={requestModalOpen} onClose={() => setRequestModalOpen(false)} title="Request Office Hour">
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
              Send Request
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={scheduleModalOpen} onClose={() => { setScheduleModalOpen(false); setError(null); setScheduleMode("company"); setSelectedFounderId(""); }} title="Schedule Office Hour">
        <form onSubmit={handleScheduleOH} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded text-sm"
              style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
            >
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 0, borderRadius: 6, overflow: "hidden", border: "1px solid #e0e0e0" }}>
            <button
              type="button"
              onClick={() => { setScheduleMode("company"); setSelectedFounderId(""); }}
              style={{
                flex: 1, padding: "8px 12px", fontSize: 13, fontWeight: 500,
                fontFamily: '"BDO Grotesk", sans-serif', border: "none", cursor: "pointer",
                backgroundColor: scheduleMode === "company" ? "#1A1A1A" : "transparent",
                color: scheduleMode === "company" ? "#FFFFFF" : "#666666",
                transition: "background-color 0.15s, color 0.15s",
              }}
            >
              Company Team
            </button>
            <button
              type="button"
              onClick={() => { setScheduleMode("individual"); setSelectedCompanyId(""); }}
              style={{
                flex: 1, padding: "8px 12px", fontSize: 13, fontWeight: 500,
                fontFamily: '"BDO Grotesk", sans-serif', border: "none",
                borderLeft: "1px solid #e0e0e0", cursor: "pointer",
                backgroundColor: scheduleMode === "individual" ? "#1A1A1A" : "transparent",
                color: scheduleMode === "individual" ? "#FFFFFF" : "#666666",
                transition: "background-color 0.15s, color 0.15s",
              }}
            >
              Primary Founder
            </button>
          </div>
          {scheduleMode === "company" ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Company</label>
              <select
                name="companyId"
                required={scheduleMode === "company"}
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={{
                  backgroundColor: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c._count.members} members)</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <SearchableSelect
                label="Primary founder contact"
                options={founders.map((f) => ({
                  id: f.id,
                  label: f.name || f.email,
                  secondary: f.companyName ? `${f.email} - ${f.companyName}` : f.email,
                  imageUrl: f.profileImage,
                }))}
                value={selectedFounderId}
                onChange={setSelectedFounderId}
                placeholder="Search by founder name or email..."
                required
                emptyMessage="No founders found"
              />
            </div>
          )}
          <Input
            label="Start Time"
            name="startTime"
            type="datetime-local"
            required
            onChange={handleScheduleStartTimeChange}
            defaultValue={prefillDate ? `${prefillDate}T09:00` : undefined}
          />
          <Input
            label="End Time"
            name="endTime"
            type="datetime-local"
            required
            ref={scheduleEndTimeRef}
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
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setScheduleModalOpen(false); setError(null); setScheduleMode("company"); setSelectedFounderId(""); }}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {scheduleMode === "individual" ? "Schedule & Send Invite" : "Schedule & Send Invites"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={proposeModalOpen} onClose={() => { setProposeModalOpen(false); setError(null); setSelectedMentorId(mentors.length === 1 ? mentors[0].id : ""); }} title="Request Office Hour">
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
            <label className="text-sm font-medium">Mentor</label>
            <select
              name="mentorId"
              value={selectedMentorId}
              onChange={(e) => setSelectedMentorId(e.target.value)}
              required={mentors.length > 0}
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
            {mentors.length === 0 && (
              <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                No mentors are currently listed in this batch. Request will use default office hour recipient.
              </p>
            )}
          </div>
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
            onChange={handleProposeStartTimeChange}
          />
          <Input
            label="End Time"
            name="endTime"
            type="datetime-local"
            required
            ref={proposeEndTimeRef}
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

      <Modal open={grantCreditsModalOpen} onClose={() => { setGrantCreditsModalOpen(false); setError(null); setSelectedCreditFounderId(""); }} title="Grant Office Hour Credits">
        <form onSubmit={handleGrantCredits} className="space-y-4">
          {error && (
            <div className="p-3 rounded text-sm" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}>
              {error}
            </div>
          )}
          <SearchableSelect
            label="Founder"
            options={founders.map((f) => ({
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
            <Button type="button" variant="secondary" onClick={() => setGrantCreditsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Grant Credits</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
