"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { formatDateTime } from "@/lib/utils";
import { isStaff, isFounder } from "@/lib/permissions-client";
import { createOfficeHourSlot, requestOfficeHour, respondToRequest, deleteSlot, scheduleGroupOfficeHour, proposeOfficeHour } from "@/actions/office-hour";
import { useToast } from "@/hooks/useToast";
import type { UserWithBatch, OfficeHourSlotStatus, OfficeHourRequestStatus } from "@/types";

interface GroupMember {
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  _count: {
    members: number;
    posts: number;
  };
}

interface GroupDetail {
  id: string;
  name: string;
  members: GroupMember[];
}

interface OfficeHourRequest {
  id: string;
  message: string | null;
  status: OfficeHourRequestStatus;
  createdAt: Date;
  requester: {
    id: string;
    name: string;
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
    name: string;
    email: string;
    profileImage: string | null;
  };
  requests: OfficeHourRequest[];
  group?: {
    id: string;
    name: string;
    members: GroupMember[];
  } | null;
}

interface OfficeHoursListProps {
  user: UserWithBatch;
  slots: OfficeHourSlot[];
  groups: Group[];
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

export function OfficeHoursList({ user, slots, groups }: OfficeHoursListProps) {
   const [createModalOpen, setCreateModalOpen] = useState(false);
   const [requestModalOpen, setRequestModalOpen] = useState(false);
   const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
   const [proposeModalOpen, setProposeModalOpen] = useState(false);
   const [selectedSlot, setSelectedSlot] = useState<OfficeHourSlot | null>(null);
   const [selectedGroupId, setSelectedGroupId] = useState<string>("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const toast = useToast();
   const endTimeRef = useRef<HTMLInputElement>(null);
   const scheduleEndTimeRef = useRef<HTMLInputElement>(null);
   const proposeEndTimeRef = useRef<HTMLInputElement>(null);

   const searchParams = useSearchParams();
   const prefillDate = searchParams.get("date");

   // Auto-select if only one group
   useEffect(() => {
     if (groups.length === 1) {
       setSelectedGroupId(groups[0].id);
     }
   }, [groups]);

   // Auto-open create modal if date is pre-filled
   useEffect(() => {
     if (prefillDate && isStaff(user.role)) {
       setCreateModalOpen(true);
     }
   }, [prefillDate, user.role]);

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startVal = e.target.value;
    if (startVal && endTimeRef.current) {
      const startDate = new Date(startVal);
      startDate.setMinutes(startDate.getMinutes() + 30);
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, "0");
      const day = String(startDate.getDate()).padStart(2, "0");
      const hours = String(startDate.getHours()).padStart(2, "0");
      const minutes = String(startDate.getMinutes()).padStart(2, "0");
      endTimeRef.current.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  };

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

  const handleScheduleGroupOH = async (e: React.FormEvent<HTMLFormElement>) => {
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
    const result = await scheduleGroupOfficeHour(formData);

    if (result.success) {
      setScheduleModalOpen(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error || "Failed to schedule");
    }

    setLoading(false);
  };

  const handleProposeOH = async (e: React.FormEvent<HTMLFormElement>) => {
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
    const result = await proposeOfficeHour(formData);

    if (result.success) {
      setProposeModalOpen(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error || "Failed to request office hour");
    }

    setLoading(false);
  };

  const isStaffUser = isStaff(user.role);
  const isFounderUser = isFounder(user.role);
  const canCreateSlot = isStaffUser;
  const canRequest = isFounderUser;

  const handleCreateSlot = async (e: React.FormEvent<HTMLFormElement>) => {
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
    const result = await createOfficeHourSlot(formData);

    if (result.success) {
      setCreateModalOpen(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error);
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
    const result = await requestOfficeHour(selectedSlot.id, selectedGroupId, message);

    if (result.success) {
      setRequestModalOpen(false);
      setSelectedSlot(null);
      setSelectedGroupId("");
      (e.target as HTMLFormElement).reset();
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
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to reject this request?")) return;

    const result = await respondToRequest(requestId, "rejected");
    if (!result.success) {
      toast.error(result.error);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;

    setLoading(true);
    const result = await deleteSlot(slotId);
    if (!result.success) {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const openRequestModal = (slot: OfficeHourSlot) => {
    setSelectedSlot(slot);
    setRequestModalOpen(true);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {isFounderUser && groups.length > 0 && (
          <Button onClick={() => setProposeModalOpen(true)} size="sm">
            Request Office Hour
          </Button>
        )}
        {isStaffUser && (
          <>
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-success)" }}
            >
              Schedule Group Office Hour
            </button>
            <Button onClick={() => setCreateModalOpen(true)} size="sm">
              Create Slot
            </Button>
          </>
        )}
      </div>

      {slots.length === 0 ? (
        <EmptyState
          title="No office hours available"
          description="Office hour slots will appear here when created"
          action={
            canCreateSlot ? (
              <Button onClick={() => setCreateModalOpen(true)}>Create Slot</Button>
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
                    <Avatar src={slot.host.profileImage} name={slot.host.name} size={48} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{slot.host.name}</span>
                        <Badge variant={getStatusBadgeVariant(slot.status)}>
                          {getStatusLabel(slot.status)}
                        </Badge>
                      </div>
                      <div className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                        {formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime)}
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                        Timezone: {slot.timezone}
                      </div>
                      {slot.group && (
                        <div className="flex items-center gap-1 text-sm" style={{ color: "var(--color-primary)" }}>
                          <span className="font-medium">Group: {slot.group.name}</span>
                          <span style={{ color: "var(--color-foreground-secondary)" }}>({slot.group.members.length} members)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canRequest && slot.status === "available" && !userHasRequested && groups.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => openRequestModal(slot)}
                        disabled={loading}
                      >
                        Request
                      </Button>
                    )}
                    {isFounderUser && groups.length === 0 && slot.status === "available" && (
                      <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                        Join a group to request
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
                        name={approvedRequest.requester.name}
                        size={32}
                      />
                      <div className="text-sm">
                        <div className="font-medium">{approvedRequest.requester.name}</div>
                        {approvedRequest.message && (
                          <div style={{ color: "var(--color-foreground-secondary)" }}>
                            {approvedRequest.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {slot.status === "confirmed" && slot.group && !approvedRequest && (
                  <div className="pt-2 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                    <div className="text-sm font-medium mb-2">Group Members:</div>
                    <div className="flex flex-wrap gap-2">
                      {slot.group.members.slice(0, 5).map((m) => (
                        <div key={m.user.id} className="flex items-center gap-1">
                          <Avatar src={m.user.profileImage} name={m.user.name} size={24} />
                          <span className="text-xs">{m.user.name}</span>
                        </div>
                      ))}
                      {slot.group.members.length > 5 && (
                        <span className="text-xs" style={{ color: "var(--color-foreground-secondary)" }}>
                          +{slot.group.members.length - 5} more
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
                            name={request.requester.name}
                            size={36}
                          />
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{request.requester.name}</div>
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

      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Office Hour Slot">
        <form onSubmit={handleCreateSlot} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded text-sm"
              style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
            >
              {error}
            </div>
          )}
           <Input
             label="Start Time"
             name="startTime"
             type="datetime-local"
             required
             onChange={handleStartTimeChange}
             defaultValue={prefillDate ? `${prefillDate}T09:00` : undefined}
           />
          <Input
            label="End Time"
            name="endTime"
            type="datetime-local"
            required
            ref={endTimeRef}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Timezone</label>
            <select
              name="timezone"
              defaultValue="UTC"
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              <option value="UTC">UTC</option>
              <option value="KST">KST (Korea Standard Time)</option>
              <option value="PST">PST (Pacific Standard Time)</option>
              <option value="EST">EST (Eastern Standard Time)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Slot
            </Button>
          </div>
        </form>
      </Modal>

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
                <Avatar src={selectedSlot.host.profileImage} name={selectedSlot.host.name} size={40} />
                <div>
                  <div className="font-medium">{selectedSlot.host.name}</div>
                  <div className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                    {formatDateTime(selectedSlot.startTime)} - {formatDateTime(selectedSlot.endTime)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium">Group</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-card-border)", backgroundColor: "var(--color-background)" }}
              required
            >
              <option value="">Select your group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
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

      <Modal open={scheduleModalOpen} onClose={() => { setScheduleModalOpen(false); setError(null); }} title="Schedule Group Office Hour">
        <form onSubmit={handleScheduleGroupOH} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded text-sm"
              style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
            >
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Group</label>
            <select
              name="groupId"
              required
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              <option value="">Select group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g._count.members} members)</option>
              ))}
            </select>
          </div>
          <Input
            label="Start Time"
            name="startTime"
            type="datetime-local"
            required
            onChange={handleScheduleStartTimeChange}
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
            <Button type="button" variant="secondary" onClick={() => { setScheduleModalOpen(false); setError(null); }}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Schedule & Send Invites
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={proposeModalOpen} onClose={() => { setProposeModalOpen(false); setError(null); }} title="Request Office Hour">
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
            <label className="text-sm font-medium">Group</label>
            <select
              name="groupId"
              required
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={{
                backgroundColor: "var(--color-background)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              <option value="">Select your group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
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
    </div>
  );
}
