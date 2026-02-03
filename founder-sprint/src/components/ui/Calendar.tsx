"use client";

import { useState, useMemo } from "react";
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

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

interface CalendarProps {
  events: CalendarEvent[];
  onDayClick?: (date: Date) => void;
}

export function Calendar({ events, onDayClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = format(new Date(event.startTime), "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, event]);
    });
    return map;
  }, [events]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    onDayClick?.(day);
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
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
          className="p-2 hover:bg-gray-100 rounded"
          style={{ border: "none", background: "none", cursor: "pointer" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="font-medium py-2" style={{ color: "var(--color-foreground-muted)" }}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(dateKey) || [];
          const hasEvents = dayEvents.length > 0;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className="relative p-2 text-center rounded transition-colors"
              style={{
                minHeight: 40,
                border: "none",
                background: isCurrentDay ? "var(--color-primary)" : "transparent",
                color: isCurrentDay
                  ? "white"
                  : isCurrentMonth
                  ? "var(--color-foreground)"
                  : "var(--color-foreground-muted)",
                cursor: "pointer",
                opacity: isCurrentMonth ? 1 : 0.5,
              }}
            >
              {format(day, "d")}
              {hasEvents && (
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
