"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { formatDateTime } from "@/lib/utils";
import { isStaff, isFounder } from "@/lib/permissions-client";
import { createOfficeHourSlot, requestOfficeHour, respondToRequest, deleteSlot } from "@/actions/office-hour";
import type { UserWithBatch, OfficeHourSlotStatus, OfficeHourRequestStatus } from "@/types";

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
}

interface OfficeHoursListProps {
  user: UserWithBatch;
  slots: OfficeHourSlot[];
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

export function OfficeHoursList({ user, slots }: OfficeHoursListProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<OfficeHourSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreateSlot = isStaff(user.role);
  const canRequest = isFounder(user.role);

  const handleCreateSlot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
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
    const result = await requestOfficeHour(selectedSlot.id, message);

    if (result.success) {
      setRequestModalOpen(false);
      setSelectedSlot(null);
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleApproveRequest = async (requestId: string) => {
    const result = await respondToRequest(requestId, "approved");
    if (!result.success) {
      alert(result.error);
    } else if (result.warning) {
      alert(result.warning);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to reject this request?")) return;

    const result = await respondToRequest(requestId, "rejected");
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;

    setLoading(true);
    const result = await deleteSlot(slotId);
    if (!result.success) {
      alert(result.error);
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
      <div className="flex items-center justify-end">
        {canCreateSlot && (
          <Button onClick={() => setCreateModalOpen(true)} size="sm">
            Create Slot
          </Button>
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
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canRequest && slot.status === "available" && !userHasRequested && (
                      <Button
                        size="sm"
                        onClick={() => openRequestModal(slot)}
                      >
                        Request
                      </Button>
                    )}
                    {userHasRequested && (
                      <Badge variant="warning">Request Pending</Badge>
                    )}
                    {(isHost || user.role === "super_admin" || user.role === "admin") && 
                     pendingRequests.length === 0 && 
                     !approvedRequest && (
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

                {slot.status === "confirmed" && slot.googleMeetLink && (
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
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRejectRequest(request.id)}
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
          />
          <Input
            label="End Time"
            name="endTime"
            type="datetime-local"
            required
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
    </div>
  );
}
