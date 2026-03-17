"use client";

import { useState, useMemo, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import type { ScheduleItem, ScheduleItemKind, VisibleScheduleFilter } from "@/types/schedule";
import {
  SCHEDULE_COLORS,
  VISIBLE_SCHEDULE_COLORS,
  getVisibleScheduleFilterForItem,
  matchesVisibleScheduleFilter,
} from "@/types/schedule";

function safeDateKey(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return format(parsed, "yyyy-MM-dd");
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

interface CalendarProps {
  events?: CalendarEvent[];
  items?: ScheduleItem[];
  month?: Date;
  onMonthChange?: (month: Date) => void;
  selectedDay?: Date | null;
  onDayClick?: (date: Date) => void;
  typeFilter?: VisibleScheduleFilter | null;
}

export function Calendar({
  events,
  items,
  month,
  onMonthChange,
  selectedDay,
  onDayClick,
  typeFilter,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = useState(new Date());
  const currentMonth = month ?? internalMonth;

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    if (!events) return null;
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = safeDateKey(event.startTime);
      if (!dateKey) return;
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, event]);
    });
    return map;
  }, [events]);

  const itemsByDate = useMemo(() => {
    if (!items) return null;
    const filtered = typeFilter
      ? items.filter((item) => matchesVisibleScheduleFilter(item, typeFilter))
      : items;
    const map = new Map<string, { kinds: Set<ScheduleItemKind>; count: number; visibleKinds: Set<VisibleScheduleFilter> }>();
    filtered.forEach((item) => {
      const dateKey = item.isAllDay
        ? (typeof item.startTime === "string" ? item.startTime.slice(0, 10) : safeDateKey(item.startTime))
        : safeDateKey(item.startTime);
      if (!dateKey) return;
      const existing = map.get(dateKey) || {
        kinds: new Set<ScheduleItemKind>(),
        count: 0,
        visibleKinds: new Set<VisibleScheduleFilter>(),
      };
      existing.kinds.add(item.kind);
      const visibleKind = getVisibleScheduleFilterForItem(item);
      if (visibleKind) {
        existing.visibleKinds.add(visibleKind);
      }
      existing.count += 1;
      map.set(dateKey, existing);
    });
    return map;
  }, [items, typeFilter]);

  const handlePrevMonth = useCallback(() => {
    const prev = subMonths(currentMonth, 1);
    if (onMonthChange) onMonthChange(prev);
    else setInternalMonth(prev);
  }, [currentMonth, onMonthChange]);

  const handleNextMonth = useCallback(() => {
    const next = addMonths(currentMonth, 1);
    if (onMonthChange) onMonthChange(next);
    else setInternalMonth(next);
  }, [currentMonth, onMonthChange]);

  const handleDayClick = (day: Date) => {
    onDayClick?.(day);
  };

  const isScheduleMode = !!items;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          aria-label="Previous month"
          className="p-2 hover:bg-gray-100 rounded"
          style={{ border: "none", background: "none", cursor: "pointer" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          onClick={handleNextMonth}
          aria-label="Next month"
          className="p-2 hover:bg-gray-100 rounded"
          style={{ border: "none", background: "none", cursor: "pointer" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="font-medium py-2" style={{ color: "var(--color-foreground-muted)" }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);
          const isSelected = selectedDay != null && isSameDay(day, selectedDay);

          const legacyHasEvents = eventsByDate ? (eventsByDate.get(dateKey)?.length ?? 0) > 0 : false;
          const scheduleData = itemsByDate?.get(dateKey);
          const scheduleKinds = scheduleData?.kinds;
          const scheduleVisibleKinds = scheduleData?.visibleKinds;
          const scheduleCount = scheduleData?.count ?? 0;
          const filteredKindActive = Boolean(isScheduleMode && typeFilter && scheduleVisibleKinds?.has(typeFilter));
          const filteredKindColor = filteredKindActive && typeFilter ? VISIBLE_SCHEDULE_COLORS[typeFilter] : null;

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              aria-label={format(day, "EEEE, MMMM d, yyyy")}
              className="relative p-2 text-center rounded transition-colors"
              style={{
                minHeight: 44,
                border: "none",
                background: isCurrentDay
                  ? "var(--color-primary)"
                  : isSelected
                  ? "rgba(26, 26, 26, 0.06)"
                  : filteredKindColor
                  ? `${filteredKindColor}22`
                  : "transparent",
                boxShadow: isSelected && !isCurrentDay
                  ? "inset 0 0 0 2px var(--color-primary)"
                  : filteredKindColor
                  ? `inset 0 0 0 2px ${filteredKindColor}`
                  : "none",
                borderRadius: filteredKindColor ? 8 : 6,
                color: isCurrentDay
                  ? "white"
                  : isCurrentMonth
                  ? "var(--color-foreground)"
                  : "var(--color-foreground-muted)",
                cursor: "pointer",
                opacity: isCurrentMonth ? 1 : 0.5,
              }}
            >
              <span style={{ fontSize: 14 }}>{format(day, "d")}</span>

              {!isScheduleMode && legacyHasEvents && (
                <span
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: isCurrentDay ? "white" : "var(--color-success)",
                  }}
                />
              )}

              {isScheduleMode && scheduleVisibleKinds && scheduleVisibleKinds.size > 0 && !filteredKindActive && (
                <span
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2"
                  style={{ display: "flex", gap: 2, alignItems: "center" }}
                >
                  {(["in_person", "virtual", "general_session", "office_hour"] as VisibleScheduleFilter[]).map((kind) =>
                    scheduleVisibleKinds.has(kind) ? (
                      <span
                        key={kind}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: isCurrentDay ? "white" : VISIBLE_SCHEDULE_COLORS[kind],
                        }}
                      />
                    ) : null
                  )}
                  {scheduleCount > 3 && (
                    <span
                      style={{
                        fontSize: 8,
                        lineHeight: "6px",
                        color: isCurrentDay ? "white" : "var(--color-foreground-muted)",
                        fontWeight: 600,
                      }}
                    >
                      +{scheduleCount - 3}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
