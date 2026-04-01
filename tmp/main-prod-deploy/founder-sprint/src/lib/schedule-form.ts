export function formatDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function addMinutesToDateTimeLocalValue(value: string, minutes: number): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setMinutes(date.getMinutes() + minutes);
  return formatDateTimeLocalValue(date);
}

export function addMinutesToTimeValue(value: string, minutes: number): string {
  const [hoursPart, minutesPart] = value.split(":");
  const hours = Number(hoursPart);
  const mins = Number(minutesPart);

  if (!Number.isInteger(hours) || !Number.isInteger(mins)) {
    return "";
  }

  const totalMinutes = ((hours * 60 + mins + minutes) % 1440 + 1440) % 1440;
  const nextHours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const nextMinutes = String(totalMinutes % 60).padStart(2, "0");

  return `${nextHours}:${nextMinutes}`;
}

export function getDateTimeRangeDurationMinutes(startValue: string, endValue: string): number | null {
  const startDate = new Date(startValue);
  const endDate = new Date(endValue);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  return duration > 0 ? duration : null;
}

export function getTimeRangeDurationMinutes(startValue: string, endValue: string): number | null {
  const [startHoursPart, startMinutesPart] = startValue.split(":");
  const [endHoursPart, endMinutesPart] = endValue.split(":");
  const startHours = Number(startHoursPart);
  const startMinutes = Number(startMinutesPart);
  const endHours = Number(endHoursPart);
  const endMinutes = Number(endMinutesPart);

  if (
    !Number.isInteger(startHours) ||
    !Number.isInteger(startMinutes) ||
    !Number.isInteger(endHours) ||
    !Number.isInteger(endMinutes)
  ) {
    return null;
  }

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  const duration = endTotalMinutes - startTotalMinutes;

  return duration > 0 ? duration : null;
}
