"use client";

import { useState, useTransition } from "react";
import { approveCompanyChangeRequest, rejectCompanyChangeRequest } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface RequestItem {
  id: string;
  targetType: string;
  status: string;
  requestedCompanyName: string | null;
  requestedDescription: string | null;
  note: string | null;
  hasDependentCoFounders: boolean;
  resolutionType: string | null;
  createdAt: Date;
  requester: { id: string; name: string | null; email: string };
  batch: { id: string; name: string } | null;
  currentCompany: { id: string; name: string } | null;
  dependentCoFounders: Array<{ id: string; name: string | null; email: string }>;
}

export function CompanyRequestList({ initialRequests }: { initialRequests: RequestItem[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [resolutionByRequest, setResolutionByRequest] = useState<Record<string, { type: "promote_one" | "convert_all"; promotedUserId?: string }>>({});
  const [isPending, startTransition] = useTransition();

  const handleApprove = (request: RequestItem) => {
    startTransition(async () => {
      const resolution = resolutionByRequest[request.id];
      const result = await approveCompanyChangeRequest({
        requestId: request.id,
        resolutionType: resolution?.type,
        promotedUserId: resolution?.promotedUserId,
      });
      if (result.success) {
        setRequests((prev) => prev.filter((item) => item.id !== request.id));
      }
    });
  };

  const handleReject = (requestId: string) => {
    startTransition(async () => {
      const result = await rejectCompanyChangeRequest({ requestId });
      if (result.success) {
        setRequests((prev) => prev.filter((item) => item.id !== requestId));
      }
    });
  };

  if (requests.length === 0) {
    return <EmptyState title="No company requests" description="Company leave and new company requests will appear here for admin review." />;
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Pending company requests</h2>
        <p className="text-sm" style={{ color: "#666" }}>Review and resolve company change requests from founders and co-founders.</p>
      </div>
      <div className="space-y-3">
        {requests.map((request) => {
          const resolution = resolutionByRequest[request.id];
          return (
            <div key={request.id} style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, backgroundColor: "#fff" }}>
              <div className="space-y-1 mb-3">
                <div className="font-medium">{request.targetType === "new_company" ? "New company request" : "Leave company request"}</div>
                <div className="text-sm" style={{ color: "#666" }}>
                  {request.requester.name || request.requester.email} ({request.requester.email})
                </div>
                {request.batch && <div className="text-sm" style={{ color: "#666" }}>Batch: {request.batch.name}</div>}
                {request.currentCompany && <div className="text-sm" style={{ color: "#666" }}>Current company: {request.currentCompany.name}</div>}
                {request.requestedCompanyName && <div className="text-sm" style={{ color: "#666" }}>Requested company: {request.requestedCompanyName}</div>}
                {request.note && <div className="text-sm" style={{ color: "#666" }}>Note: {request.note}</div>}
                {request.requestedDescription && <div className="text-sm" style={{ color: "#666" }}>Description: {request.requestedDescription}</div>}
              </div>

              {request.hasDependentCoFounders && (
                <div style={{ padding: 12, backgroundColor: "#f7f3eb", borderRadius: 8, marginBottom: 12 }}>
                  <div className="text-sm font-medium mb-2">Founder departure needs review</div>
                  <div className="text-sm" style={{ color: "#666", marginBottom: 8 }}>
                    This founder still has {request.dependentCoFounders.length} co-founder(s) linked to them.
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`resolution-${request.id}`}
                        checked={resolution?.type === "promote_one"}
                        onChange={() => setResolutionByRequest((prev) => ({ ...prev, [request.id]: { type: "promote_one" } }))}
                      />
                      Promote one co-founder to founder
                    </label>
                    {resolution?.type === "promote_one" && (
                      <select
                        className="form-input"
                        value={resolution.promotedUserId || ""}
                        onChange={(e) => setResolutionByRequest((prev) => ({ ...prev, [request.id]: { ...prev[request.id], type: "promote_one", promotedUserId: e.target.value } }))}
                      >
                        <option value="">Select co-founder</option>
                        {request.dependentCoFounders.map((user) => (
                          <option key={user.id} value={user.id}>{user.name || user.email} ({user.email})</option>
                        ))}
                      </select>
                    )}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`resolution-${request.id}`}
                        checked={resolution?.type === "convert_all"}
                        onChange={() => setResolutionByRequest((prev) => ({ ...prev, [request.id]: { type: "convert_all" } }))}
                      />
                      Convert all remaining co-founders to founders
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => handleReject(request.id)} disabled={isPending}>Reject</Button>
                <Button
                  type="button"
                  onClick={() => handleApprove(request)}
                  disabled={isPending || (request.hasDependentCoFounders && (!resolution?.type || (resolution.type === "promote_one" && !resolution.promotedUserId)))}
                  loading={isPending}
                >
                  Approve
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
