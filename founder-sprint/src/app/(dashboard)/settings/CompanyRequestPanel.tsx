"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createCompanyLeaveRequest, createNewCompanyRequest, cancelCompanyChangeRequest } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

interface CompanyRequestItem {
  id: string;
  targetType: string;
  requestedCompanyName: string | null;
  targetCompany: { id: string; name: string; slug: string } | null;
  status: string;
  hasDependentCoFounders: boolean;
  createdAt: Date;
}

interface CompanyRequestPanelProps {
  currentCompanyId: string | null;
  currentCompanyName: string | null;
  currentBatchId: string | null;
  currentRole: string;
  requests: CompanyRequestItem[];
}

function getRequestLabel(request: CompanyRequestItem) {
  if (request.targetType === "leave_company") return "Leave company";
  if (request.targetType === "new_company") return request.requestedCompanyName || "New company";
  if (request.targetType === "join_company") return request.targetCompany?.name ? `Join ${request.targetCompany.name}` : "Join company";
  return "Company request";
}

export function CompanyRequestPanel({ currentCompanyId, currentCompanyName, currentBatchId, currentRole, requests }: CompanyRequestPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isNewCompanyOpen, setIsNewCompanyOpen] = useState(false);
  const latestPending = requests.find((request) => request.status === "pending") || null;
  const canRequest = currentRole === "founder" || currentRole === "co_founder";

  const handleLeaveSubmit = (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await createCompanyLeaveRequest({
        currentCompanyId: currentCompanyId!,
        batchId: currentBatchId || undefined,
        note: (formData.get("note") as string) || undefined,
      });
      setMessage(result.success ? "Leave request submitted. The admin team will review it." : result.error);
      if (result.success) setIsLeaveOpen(false);
    });
  };

  const handleNewCompanySubmit = (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await createNewCompanyRequest({
        batchId: currentBatchId || undefined,
        requestedCompanyName: (formData.get("requestedCompanyName") as string) || "",
        requestedDescription: (formData.get("requestedDescription") as string) || undefined,
        note: (formData.get("note") as string) || undefined,
      });
      setMessage(result.success ? "New company request submitted. The admin team will review it." : result.error);
      if (result.success) setIsNewCompanyOpen(false);
    });
  };

  const handleCancelRequest = (requestId: string) => {
    startTransition(async () => {
      const result = await cancelCompanyChangeRequest(requestId);
      setMessage(result.success ? "Request cancelled." : result.error);
    });
  };

  if (!canRequest) return null;

  return (
    <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 16, marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        {currentCompanyId ? (
          <p style={{ fontSize: 14, color: "#666666", marginBottom: 8 }}>
            You are currently assigned to <strong>{currentCompanyName}</strong>. Use this area to request leaving your current company.
          </p>
        ) : (
          <p style={{ fontSize: 14, color: "#666666", marginBottom: 8 }}>
            You are not assigned to a company yet. Browse existing companies, or request a new company if yours is not listed.
          </p>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {currentCompanyId ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsLeaveOpen(true)} disabled={!!latestPending || isPending}>
              Leave current company
            </Button>
          ) : (
            <>
              <Link href="/companies" style={{ textDecoration: "none" }}>
                <Button type="button" variant="ghost" size="sm" disabled={isPending}>
                  Browse existing companies
                </Button>
              </Link>
              <Button type="button" size="sm" onClick={() => setIsNewCompanyOpen(true)} disabled={!!latestPending || isPending}>
                Request new company
              </Button>
            </>
          )}
        </div>
      </div>

      {latestPending && (
        <div style={{ padding: 12, backgroundColor: "#f5f5f5", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              Pending request: {getRequestLabel(latestPending)}
            </div>
            <div style={{ fontSize: 12, color: "#666666" }}>
              {latestPending.hasDependentCoFounders ? "This request needs admin review because other co-founders depend on your founder account." : "The admin team will review this request."}
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => handleCancelRequest(latestPending.id)} disabled={isPending}>
            Cancel request
          </Button>
        </div>
      )}

      {message && <p style={{ fontSize: 13, color: "#666666" }}>{message}</p>}

      <Modal open={isLeaveOpen} onClose={() => setIsLeaveOpen(false)} title="Leave current company">
        <form action={handleLeaveSubmit} className="space-y-4">
          <p style={{ color: "#666666", fontSize: 14 }}>
            You are currently assigned to <strong>{currentCompanyName}</strong>. If you continue, the admin team will review your request before updating your company status.
          </p>
          <Textarea name="note" label="Optional note" rows={3} placeholder="Explain why you need to leave this company (optional)" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsLeaveOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" loading={isPending}>Submit request</Button>
          </div>
        </form>
      </Modal>

      <Modal open={isNewCompanyOpen} onClose={() => setIsNewCompanyOpen(false)} title="Request new company">
        <form action={handleNewCompanySubmit} className="space-y-4">
          <Input name="requestedCompanyName" label="Company name" required placeholder="Enter the new company name" />
          <Textarea name="requestedDescription" label="Description (optional)" rows={3} placeholder="What should the admin know about this company?" />
          <Textarea name="note" label="Additional note (optional)" rows={3} placeholder="Any context that will help the admin process this request" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsNewCompanyOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" loading={isPending}>Submit request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
