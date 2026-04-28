"use client";

import { useState, useTransition } from "react";
import { createNewCompanyRequest } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

interface NewCompanyRequestButtonProps {
  batchId?: string | null;
  disabled?: boolean;
}

export function NewCompanyRequestButton({ batchId, disabled = false }: NewCompanyRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await createNewCompanyRequest({
        batchId: batchId || undefined,
        requestedCompanyName: (formData.get("requestedCompanyName") as string) || "",
        requestedDescription: (formData.get("requestedDescription") as string) || undefined,
        note: (formData.get("note") as string) || undefined,
      });
      setMessage(result.success ? "New company request submitted. The admin team will review it." : result.error);
      if (result.success) setIsOpen(false);
    });
  };

  return (
    <>
      <Button type="button" size="sm" onClick={() => setIsOpen(true)} disabled={disabled || isPending}>
        Request new company
      </Button>
      {message && <p style={{ width: "100%", fontSize: 13, color: "#666666" }}>{message}</p>}

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Request new company">
        <form action={handleSubmit} className="space-y-4">
          <Input name="requestedCompanyName" label="Company name" required placeholder="Enter the new company name" />
          <Textarea name="requestedDescription" label="Description (optional)" rows={3} placeholder="What should the admin know about this company?" />
          <Textarea name="note" label="Additional note (optional)" rows={3} placeholder="Any context that will help the admin process this request" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" loading={isPending}>Submit request</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
