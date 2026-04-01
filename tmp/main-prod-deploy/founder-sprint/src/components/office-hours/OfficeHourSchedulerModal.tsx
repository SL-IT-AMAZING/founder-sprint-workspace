"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Button } from "@/components/ui/Button";
import {
  createOpenBatchOfficeHour,
  getOfficeHourBatchContext,
  scheduleGroupOfficeHour,
  scheduleIndividualOfficeHour,
} from "@/actions/office-hour";
import { useToast } from "@/hooks/useToast";
import type { CompanyOption, FounderOption } from "@/types/invite";
import { addMinutesToDateTimeLocalValue } from "@/lib/schedule-form";

type SchedulerMode = "direct_company" | "direct_founder" | "open_batch";

interface OfficeHourSchedulerModalProps {
  open: boolean;
  onClose: () => void;
  batchOptions: Array<{ id: string; name: string }>;
  companies: CompanyOption[];
  founders: FounderOption[];
  currentBatchId: string;
  defaultStartDateTime?: string;
  defaultEndDateTime?: string;
  successBehavior?: "refresh" | "redirect-office-hours";
  title?: string;
}

const timezoneOptions = [
  { value: "KST", label: "KST (Korea Standard Time)" },
  { value: "PST", label: "PST (Pacific Standard Time)" },
  { value: "EST", label: "EST (Eastern Standard Time)" },
  { value: "UTC", label: "UTC" },
];

export function OfficeHourSchedulerModal(props: OfficeHourSchedulerModalProps) {
  const { open, onClose, title = "Schedule Office Hour" } = props;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {open ? <OfficeHourSchedulerModalContent {...props} /> : null}
    </Modal>
  );
}

function OfficeHourSchedulerModalContent({
  onClose,
  batchOptions,
  companies,
  founders,
  currentBatchId,
  defaultStartDateTime,
  defaultEndDateTime,
  successBehavior = "refresh",
}: OfficeHourSchedulerModalProps) {
  const router = useRouter();
  const toast = useToast();
  const endTimeRef = useRef<HTMLInputElement>(null);
  const endTimeDirtyRef = useRef(false);
  const [mode, setMode] = useState<SchedulerMode>("direct_company");
  const [selectedAdminBatchId, setSelectedAdminBatchId] = useState(currentBatchId);
  const [officeHourCompanies, setOfficeHourCompanies] = useState<CompanyOption[]>(companies);
  const [officeHourFounders, setOfficeHourFounders] = useState<FounderOption[]>(founders);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies.length === 1 ? companies[0].id : "");
  const [selectedFounderId, setSelectedFounderId] = useState("");
  const [scheduleContextLoading, setScheduleContextLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOfficeHourBatchContext = async (batchId: string) => {
    setScheduleContextLoading(true);
    const result = await getOfficeHourBatchContext(batchId);

    if (result.success) {
      setSelectedAdminBatchId(batchId);
      setOfficeHourCompanies(result.data.companies);
      setOfficeHourFounders(result.data.founders);
      setSelectedCompanyId(result.data.companies.length === 1 ? result.data.companies[0].id : "");
      setSelectedFounderId("");
      setError(null);
      endTimeDirtyRef.current = false;
    } else {
      setError(result.error);
    }

    setScheduleContextLoading(false);
  };

  const handleStartTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (endTimeDirtyRef.current || !endTimeRef.current || !e.target.value) {
      return;
    }

    const nextEndValue = addMinutesToDateTimeLocalValue(e.target.value, 30);
    if (nextEndValue) {
      endTimeRef.current.value = nextEndValue;
    }
  };

  const handleEndTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    endTimeDirtyRef.current = e.target.value !== "";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

    formData.set("batchId", selectedAdminBatchId);

    let result;
    if (mode === "direct_company") {
      if (!selectedCompanyId) {
        setError("Please select a company");
        setLoading(false);
        return;
      }

      formData.set("companyId", selectedCompanyId);
      result = await scheduleGroupOfficeHour(formData);
    } else if (mode === "direct_founder") {
      if (!selectedFounderId) {
        setError("Please select a founder");
        setLoading(false);
        return;
      }

      formData.set("founderId", selectedFounderId);
      result = await scheduleIndividualOfficeHour(formData);
    } else {
      result = await createOpenBatchOfficeHour(formData);
    }

    if (result.success !== true) {
      setError(("error" in result && result.error) || "Failed to schedule office hour");
      setLoading(false);
      return;
    }

    if ("warning" in result && result.warning) {
      toast.warning(result.warning);
    }

    toast.success(mode === "open_batch" ? "Open office hour created." : "Office hour scheduled.");
    onClose();

    if (successBehavior === "redirect-office-hours") {
      router.push("/office-hours");
    } else {
      router.refresh();
    }
  };

  const primaryActionLabel =
    mode === "direct_company"
      ? "Schedule & Send Company Invites"
      : mode === "direct_founder"
        ? "Schedule & Send Founder Invite"
        : "Create Open Office Hour";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="p-3 rounded text-sm"
          style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
        >
          {error}
        </div>
      )}

      {batchOptions.length > 0 && (
        <Select
          label="Batch"
          value={selectedAdminBatchId}
          onChange={(e) => void loadOfficeHourBatchContext(e.target.value)}
          options={batchOptions.map((batch) => ({ value: batch.id, label: batch.name }))}
          required
        />
      )}

      <div style={{ display: "flex", gap: 0, borderRadius: 6, overflow: "hidden", border: "1px solid #e0e0e0" }}>
        {[
          { value: "direct_company" as const, label: "Direct Invite - Company" },
          { value: "direct_founder" as const, label: "Direct Invite - Founder" },
          { value: "open_batch" as const, label: "Open Office Hour - Batch" },
        ].map((option, index) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setMode(option.value);
              setError(null);
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: '"BDO Grotesk", sans-serif',
              border: "none",
              borderLeft: index === 0 ? "none" : "1px solid #e0e0e0",
              cursor: "pointer",
              backgroundColor: mode === option.value ? "#1A1A1A" : "transparent",
              color: mode === option.value ? "#FFFFFF" : "#666666",
              transition: "background-color 0.15s, color 0.15s",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {mode === "direct_company" && (
        <SearchableSelect
          label="Company"
          options={officeHourCompanies.map((company) => ({
            id: company.id,
            label: company.name,
            secondary: `${company.memberCount} members`,
          }))}
          value={selectedCompanyId}
          onChange={setSelectedCompanyId}
          placeholder="Search for a company..."
          required
          emptyMessage="No companies found"
        />
      )}

      {mode === "direct_founder" && (
        <SearchableSelect
          label="Primary founder contact"
          options={officeHourFounders.map((founder) => ({
            id: founder.id,
            label: founder.name || founder.email,
            secondary: founder.companyName ? `${founder.email} - ${founder.companyName}` : founder.email,
            imageUrl: founder.profileImage,
          }))}
          value={selectedFounderId}
          onChange={setSelectedFounderId}
          placeholder="Search by founder name or email..."
          required
          emptyMessage="No founders found"
        />
      )}

      {mode === "open_batch" && (
        <div
          className="rounded-md border px-3 py-3 text-sm"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-background-secondary)",
            color: "var(--color-foreground-muted)",
          }}
        >
          Any founder in the selected batch can book this slot for their current company. The first booking confirms immediately and sends the calendar invite to the host and booked company.
        </div>
      )}

      <Input
        label="Start Time"
        name="startTime"
        type="datetime-local"
        required
        defaultValue={defaultStartDateTime}
        onChange={handleStartTimeChange}
      />
      <Input
        ref={endTimeRef}
        label="End Time"
        name="endTime"
        type="datetime-local"
        required
        defaultValue={defaultEndDateTime}
        onChange={handleEndTimeChange}
      />
      <Select label="Timezone" name="timezone" options={timezoneOptions} defaultValue="KST" required />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={loading || scheduleContextLoading}>
          {primaryActionLabel}
        </Button>
      </div>
    </form>
  );
}
