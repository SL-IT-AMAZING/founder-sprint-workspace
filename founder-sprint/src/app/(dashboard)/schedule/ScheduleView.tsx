"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useMemo } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/Calendar";
import { DayPanel } from "./DayPanel";
import type { ScheduleItem, ScheduleItemKind } from "@/types/schedule";
import type { CompanyOption, FounderOption } from "@/types/invite";
import { SCHEDULE_COLORS, SCHEDULE_LABELS } from "@/types/schedule";

interface ScheduleViewProps {
  items: ScheduleItem[];
  month: string;
  selectedDay: string | null;
  typeFilter: ScheduleItemKind | null;
  isAdmin: boolean;
  companies: CompanyOption[];
  founders: FounderOption[];
  totalBatchMembers: number;
}

const ALL_KINDS: ScheduleItemKind[] = ["event", "officeHour", "session"];

export function ScheduleView({
  items,
  month,
  selectedDay,
  typeFilter,
  isAdmin,
  companies,
  founders,
  totalBatchMembers,
}: ScheduleViewProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const monthDate = useMemo(() => parseISO(month), [month]);
  const selectedDayDate = useMemo(
    () => (selectedDay ? parseISO(selectedDay) : null),
    [selectedDay]
  );

  const filteredItems = useMemo(
    () => (typeFilter ? items.filter((i) => i.kind === typeFilter) : items),
    [items, typeFilter]
  );

  const dayItems = useMemo(() => {
    if (!selectedDayDate || !selectedDay) return [];
    return filteredItems.filter((item) =>
      item.isAllDay
        ? item.startTime.slice(0, 10) === selectedDay
        : isSameDay(parseISO(item.startTime), selectedDayDate)
    );
  }, [filteredItems, selectedDay, selectedDayDate]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    startTransition(() => {
      router.push(`/schedule?${params.toString()}`, { scroll: false });
    });
  };

  const handleMonthChange = (newMonth: Date) => {
    updateParams({
      month: format(newMonth, "yyyy-MM"),
      day: null,
    });
  };

  const handleDayClick = (date: Date) => {
    updateParams({
      month: format(date, "yyyy-MM"),
      day: format(date, "yyyy-MM-dd"),
    });
  };

  const handleTypeFilter = (kind: ScheduleItemKind | null) => {
    updateParams({ type: kind });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleTypeFilter(null)}
          className={!typeFilter ? "btn btn-primary" : "btn btn-secondary"}
          style={{ fontSize: 14, height: 36, padding: "0 16px" }}
        >
          All
        </button>
        {ALL_KINDS.map((kind) => (
          <button
            key={kind}
            onClick={() => handleTypeFilter(kind)}
            className={typeFilter === kind ? "btn btn-primary" : "btn btn-secondary"}
            style={{
              fontSize: 14,
              height: 36,
              padding: "0 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: SCHEDULE_COLORS[kind],
                flexShrink: 0,
              }}
            />
            {SCHEDULE_LABELS[kind]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2"
          style={{
            opacity: isPending ? 0.5 : 1,
            transition: "opacity 150ms ease",
            pointerEvents: isPending ? "none" : "auto",
          }}
        >
          <Calendar
            items={filteredItems}
            month={monthDate}
            onMonthChange={handleMonthChange}
            selectedDay={selectedDayDate}
            onDayClick={handleDayClick}
            typeFilter={typeFilter}
          />
        </div>
        <div>
          <DayPanel
            items={dayItems}
            selectedDay={selectedDayDate}
            isAdmin={isAdmin}
            companies={companies}
            founders={founders}
            totalBatchMembers={totalBatchMembers}
          />
        </div>
      </div>
    </div>
  );
}
