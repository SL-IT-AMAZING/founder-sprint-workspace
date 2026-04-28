"use client";

import { useState, useTransition } from "react";
import { createJoinCompanyRequest } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

interface JoinCompanyRequestButtonProps {
  targetCompanyId: string;
  targetCompanyName: string;
  batchId?: string | null;
  disabled?: boolean;
}

export function JoinCompanyRequestButton({ targetCompanyId, targetCompanyName, batchId, disabled = false }: JoinCompanyRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await createJoinCompanyRequest({
        targetCompanyId,
        batchId: batchId || undefined,
        note: (formData.get("note") as string) || undefined,
      });
      setMessage(result.success ? `Join request submitted for ${targetCompanyName}.` : result.error);
      if (result.success) setIsOpen(false);
    });
  };

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)} disabled={disabled || isPending}>
        Request to join company
      </Button>
      {message && <p style={{ width: "100%", fontSize: 13, color: "#666666" }}>{message}</p>}

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title={`Request to join ${targetCompanyName}`}>
        <form action={handleSubmit} className="space-y-4">
          <p style={{ color: "#666666", fontSize: 14 }}>
            The admin team will review this request before adding you to <strong>{targetCompanyName}</strong>.
          </p>
          <Textarea name="note" label="Optional note" rows={3} placeholder="Add context that will help the admin review this request" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" loading={isPending}>Submit request</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
