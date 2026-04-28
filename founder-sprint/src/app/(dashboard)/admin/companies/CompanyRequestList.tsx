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
  targetCompany: { id: string; name: string; slug: string } | null;
  dependentCoFounders: Array<{ id: string; name: string | null; email: string }>;
}

function getRequestTitle(request: RequestItem) {
  if (request.targetType === "join_company") return "Join company request";
  if (request.targetType === "new_company") return "New company request";
  if (request.targetType === "leave_company") return "Leave company request";
  return "Company request";
}

export function CompanyRequestList({ initialRequests }: { initialRequests: RequestItem[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [resolutionByRequest, setResolutionByRequest] = useState<Record<string, { type: "promote_one" | "convert_all"; promotedUserId?: string }>>({});
  const [errorByRequest, setErrorByRequest] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleApprove = (request: RequestItem) => {
    setErrorByRequest((prev) => ({ ...prev, [request.id]: "" }));
    startTransition(async () => {
      const resolution = resolutionByRequest[request.id];
      const result = await approveCompanyChangeRequest({
        requestId: request.id,
        resolutionType: resolution?.type,
        promotedUserId: resolution?.promotedUserId,
      });
      if (result.success) {
        setRequests((prev) => prev.filter((item) => item.id !== request.id));
      } else {
        setErrorByRequest((prev) => ({ ...prev, [request.id]: result.error }));
      }
    });
  };

  const handleReject = (requestId: string) => {
    setErrorByRequest((prev) => ({ ...prev, [requestId]: "" }));
    startTransition(async () => {
      const result = await rejectCompanyChangeRequest({ requestId });
      if (result.success) {
        setRequests((prev) => prev.filter((item) => item.id !== requestId));
      } else {
        setErrorByRequest((prev) => ({ ...prev, [requestId]: result.error }));
      }
    });
  };

  if (requests.length === 0) {
    return <EmptyState title="No company requests" description="Company join, leave, and new company requests will appear here for admin review." />;
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
          const requiresLeaveResolution = request.targetType === "leave_company" && request.hasDependentCoFounders;
          return (
            <div key={request.id} style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16, backgroundColor: "#fff" }}>
              <div className="space-y-1 mb-3">
                <div className="font-medium">{getRequestTitle(request)}</div>
                <div className="text-sm" style={{ color: "#666" }}>
                  {request.requester.name || request.requester.email} ({request.requester.email})
                </div>
                {request.batch && <div className="text-sm" style={{ color: "#666" }}>Batch: {request.batch.name}</div>}
                {request.currentCompany && <div className="text-sm" style={{ color: "#666" }}>Current company: {request.currentCompany.name}</div>}
                {request.targetCompany && <div className="text-sm" style={{ color: "#666" }}>Target company: {request.targetCompany.name}</div>}
                {request.requestedCompanyName && <div className="text-sm" style={{ color: "#666" }}>Requested company: {request.requestedCompanyName}</div>}
                {request.note && <div className="text-sm" style={{ color: "#666" }}>Note: {request.note}</div>}
                {request.requestedDescription && <div className="text-sm" style={{ color: "#666" }}>Description: {request.requestedDescription}</div>}
              </div>

              {requiresLeaveResolution && (
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

              {errorByRequest[request.id] && (
                <div className="text-sm mb-3" style={{ color: "var(--color-error)" }}>
                  {errorByRequest[request.id]}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => handleReject(request.id)} disabled={isPending}>Reject</Button>
                <Button
                  type="button"
                  onClick={() => handleApprove(request)}
                  disabled={isPending || (requiresLeaveResolution && (!resolution?.type || (resolution.type === "promote_one" && !resolution.promotedUserId)))}
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
