"use client";

import { useTransition } from "react";
import { sendAssignmentDeadlineReminders } from "@/actions/assignment";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

interface SendReminderButtonProps {
  assignmentId: string;
}

export function SendReminderButton({ assignmentId }: SendReminderButtonProps) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleClick = () => {
    startTransition(async () => {
      const result = await sendAssignmentDeadlineReminders(assignmentId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const sent = result.data?.sent ?? 0;
      if (sent === 0) {
        toast.success("No reminders needed — everyone submitted already.");
      } else {
        toast.success(`Sent ${sent} reminder${sent === 1 ? "" : "s"}.`);
      }
    });
  };

  return (
    <Button size="sm" variant="secondary" onClick={handleClick} loading={isPending}>
      Send Deadline Reminder
    </Button>
  );
}
