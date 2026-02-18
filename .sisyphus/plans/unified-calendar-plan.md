# Unified Calendar View — Work Plan (v2)

**Created**: 2026-02-11
**Revised**: 2026-02-11 (post-Momus review, 10 issues addressed)
**Status**: Ready for implementation
**Estimated effort**: 3-4 days
**Architecture reviewed by**: Oracle (Opus)
**Plan reviewed by**: Momus (Opus) — FAIL → revised to address all findings

---

## What We're Building

A unified `/schedule` page that shows all scheduled items (Events, Office Hours, Sessions) on one calendar. Month view with a day-detail side panel. Color-coded by type. Deep-links to existing management pages for actions.

---

## Contracts (Implementer MUST follow these)

### Contract 1: Timezone

**Rule**: All `startTime`/`endTime` in the database are **UTC instants**. The `timezone` column stores the **intended wall-clock timezone** as an IANA string (e.g., `America/Los_Angeles`, `Asia/Seoul`, `UTC`).

**Input flow**: User picks a `datetime-local` value + selects a timezone (PST/KST/UTC) → code converts to UTC using `fromZonedTime(inputString, ianaTimezone)` from `date-fns-tz` → stores UTC in DB + stores IANA string in `timezone` column.

**Display flow**: Read UTC from DB → convert to display timezone using `toZonedTime(utcDate, timezone)` → format for UI.

**Shared helper** (single source of truth, do NOT re-implement per file):
```typescript
// src/lib/timezone.ts
const TIMEZONE_MAP: Record<string, string> = {
  UTC: "UTC",
  KST: "Asia/Seoul",
  PST: "America/Los_Angeles",
  EST: "America/New_York",
};

export function toIanaTimezone(tz: string): string {
  return TIMEZONE_MAP[tz.toUpperCase()] || tz;
}
```
This replaces the inline maps in `office-hour.ts:18-27` and must be used by Events, Sessions, and Office Hours.

**What to fix**: `createEvent()` in `event.ts:57-60` currently does `new Date(validated.startTime)` — this parses in server-local timezone. Change to use `fromZonedTime()` like office hours.

**Stored format**: The `timezone` column stores IANA strings (`America/Los_Angeles`), NOT abbreviations (`PST`). The UI shows abbreviations; the backend converts to IANA before storing.

### Contract 2: Access Control (Batch Scoping)

**Rule**: Every read and mutation on Event, Session, and OfficeHourSlot MUST verify `item.batchId === user.batchId`.

**What to fix** (complete list):

| File | Function | Line | Fix |
|------|----------|------|-----|
| `event.ts` | `getEvent(eventId)` | ~152 | Add `batchId` param, use `findUnique({ where: { id, batchId } })` or verify after fetch |
| `event.ts` | `deleteEvent(eventId)` | ~187 | Verify `event.batchId === user.batchId` before delete |
| `event.ts` | `updateEvent(eventId, ...)` | ~242 | Verify `event.batchId === user.batchId` before update |
| `session.ts` | `getSession(id)` | ~74 | Add `batchId` param, use compound where or verify after fetch |
| `session.ts` | `updateSession(id, ...)` | ~108 | Verify `session.batchId === user.batchId` before update |
| `session.ts` | `deleteSession(id)` | ~134 | Verify `session.batchId === user.batchId` before delete |
| `office-hour.ts` | `deleteSlot(slotId)` | ~790 | Verify `slot.batchId === user.batchId` (partially done via host check, add batch check) |

**Pattern to use** (consistent across all):
```typescript
const item = await prisma.event.findUnique({ where: { id: eventId } });
if (!item || item.batchId !== user.batchId) {
  return { success: false, error: "Not found" }; // Don't reveal existence
}
```

Also fix redirect inconsistency: `events/[id]/page.tsx` redirects to `/auth/login`, `sessions/[id]/page.tsx` redirects to `/login`. Standardize to `/auth/login`.

### Contract 3: Calendar Grid Range

**Rule**: The schedule query MUST fetch data for the full calendar grid, not just the calendar month.

```typescript
// CORRECT: matches Calendar.tsx grid rendering (lines 34-39)
const rangeStart = startOfWeek(startOfMonth(month));  
const rangeEnd = endOfWeek(endOfMonth(month));

// WRONG: misses leading/trailing days
const rangeStart = startOfMonth(month);
const rangeEnd = endOfMonth(month);
```

The existing `Calendar.tsx` renders leading days (e.g., if Feb 1 is Wednesday, it shows Jan 29-31). If we don't fetch those dates, they'll appear empty even if they have items.

### Contract 4: All-Day Events in Google Calendar

**Rule**: When a Session has no `startTime`/`endTime` (only `sessionDate`), create an all-day Google Calendar event.

**What to fix**: `createCalendarEvent()` in `google-calendar.ts` currently always uses `start.dateTime` / `end.dateTime`. Add support for all-day:

```typescript
// In createCalendarEvent params:
interface CreateCalendarEventParams {
  // ... existing fields ...
  isAllDay?: boolean;
  allDayDate?: string; // "2026-02-11" format
}

// In event body construction:
const event = isAllDay
  ? { summary, description, start: { date: allDayDate }, end: { date: allDayDate }, attendees, location }
  : { summary, description, start: { dateTime, timeZone }, end: { dateTime, timeZone }, attendees, location };
```

**For date-only sessions in the schedule view**: Represent as `startTime = 00:00 in session.timezone → UTC`, `endTime = startTime + 24h`, `isAllDay = true`. This allows chronological sorting (all-day items float to top of the day).

### Contract 5: Schedule Day Panel Actions

**Rule for MVP**: The `/schedule` day panel is **view + deep-link only**. No inline CRUD. No inline OH request/approve flows.

Each item in the day panel shows:
- Type badge (colored), title, time range, status
- A single action link: "View details →" or "Manage →"

Deep-link targets:
- Events → `/events` (no per-event detail page needed, the list page is sufficient)
- Office Hours → `/office-hours` (no per-OH detail page exists; link to the list page)
- Sessions → `/sessions` (link to list page)

**Admin quick-create**: The "+ Create" button on the day panel opens a dropdown (Event / Office Hour / Session) that navigates to the respective page with a `?date=YYYY-MM-DD` query param. The existing pages parse this param to pre-fill their create form's date field.

This means:
- No modal extraction refactor needed
- No group/request selection UX in schedule
- Existing pages handle all mutations
- Can add inline actions in a future iteration

---

## Key Architecture Decisions

### 1. Add `/schedule`, keep existing pages

- `/schedule` = primary nav item ("Schedule", calendar icon, first after Home)
- `/events`, `/office-hours`, `/sessions` remain as-is in the sidebar (flat list, no submenu)
- Sidebar change: add one item to the existing `NAV_ITEMS` array. No restructuring.

### 2. New server query for unified data

Create `src/actions/schedule.ts` with `getScheduleItems()`:
- Queries all 3 models in parallel via `Promise.all`
- Filters by calendar grid range (Contract 3)
- Returns normalized `ScheduleItem[]`
- Applies Founder OH filtering (their group's slots + ungrouped only)
- **Read-only**: no side effects, no auto-completion of expired slots

### 3. Build on existing Calendar.tsx, no library

Extend the existing 138-line component. No FullCalendar / react-big-calendar.

### 4. Add start/end times to Sessions + Google Calendar sync

New nullable fields on Session model. Google Calendar helper updated for all-day support.

### 5. Fix side-effect in getOfficeHourSlots

Extract the "auto-complete expired slots" mutation from `getOfficeHourSlots()` (office-hour.ts ~lines 365-378) into a separate function `completeExpiredSlots(batchId)`. Call it:
- From `/office-hours/page.tsx` before fetching (keeps existing behavior)
- NOT from `/schedule` or `getScheduleItems()` (read-only)

This resolves Momus finding #5 without breaking existing behavior.

---

## ScheduleItem Type Definition

```typescript
// src/types/schedule.ts

export type ScheduleItemKind = "event" | "officeHour" | "session";

export interface ScheduleItem {
  id: string;
  kind: ScheduleItemKind;
  title: string;
  startTime: string;        // ISO 8601 UTC string (serializable across server→client)
  endTime: string;           // ISO 8601 UTC string
  timezone: string;          // IANA timezone string
  isAllDay: boolean;         // true for date-only sessions
  
  // Kind-specific fields (optional)
  status?: string;           // OH only: "available" | "requested" | "confirmed" | "completed" | "cancelled"
  eventType?: string;        // Event only: "one_off" | "office_hour" | "in_person"
  hostName?: string;         // OH only: mentor name
  groupName?: string;        // OH only: group name
  googleMeetLink?: string;   // OH/Event: meet link if exists
  location?: string;         // Event: location string
  
  // Navigation
  deepLink: string;          // Link to management page
}
```

Note: `startTime`/`endTime` are **strings** (ISO 8601), not `Date` objects, because Next.js server→client serialization converts Dates to strings anyway. Being explicit prevents type confusion.

---

## Phases

### Phase 0: Shared Utilities & Security Fixes
*~0.5 day*

#### 0.1 Create shared timezone helper

Create `src/lib/timezone.ts` with `toIanaTimezone()` (see Contract 1). Remove duplicate timezone maps from `office-hour.ts`.

#### 0.2 Create shared schedule cache invalidation helper

```typescript
// Add to src/lib/cache-helpers.ts (or similar)
export function revalidateSchedule(batchId: string) {
  revalidatePath("/schedule");
  revalidateTag(`schedule-${batchId}`);
}
```

Call this from **every** scheduling mutation function:

| File | Functions to update |
|------|-------------------|
| `event.ts` | `createEvent`, `updateEvent`, `deleteEvent` |
| `session.ts` | `createSession`, `updateSession`, `deleteSession` |
| `office-hour.ts` | `createOfficeHourSlot`, `scheduleGroupOfficeHour`, `proposeOfficeHour`, `requestOfficeHour`, `respondToRequest`, `updateSlot`, `deleteSlot`, `cancelRequest` |

#### 0.3 Fix cross-batch access control

Apply batch scoping to all reads + mutations per Contract 2 table.

#### 0.4 Fix redirect inconsistency

Standardize all auth redirects to `/auth/login` (not `/login`).

#### 0.5 Standardize timezone in Events

Update `createEvent()` and `updateEvent()` in `event.ts` to use `fromZonedTime()` from `date-fns-tz` via the shared helper, matching the office-hours pattern.

---

### Phase 1: Session Enhancements (Backend)
*~0.5 day*

#### 1.1 Session model migration

Add to `Session` in `prisma/schema.prisma`:

```prisma
model Session {
  // ... existing fields (keep sessionDate for backward compat) ...
  startTime     DateTime? @map("start_time")
  endTime       DateTime? @map("end_time")
  timezone      String    @default("UTC")
  googleEventId String?   @map("google_event_id")
}
```

Validation rule (enforce in code): if `startTime` is provided, `endTime` MUST be provided and `endTime > startTime`.

#### 1.2 Update Google Calendar helper for all-day events

Modify `createCalendarEvent()` in `google-calendar.ts` to accept `isAllDay?: boolean` and `allDayDate?: string`. When `isAllDay` is true, use `start.date` / `end.date` instead of `start.dateTime` / `end.dateTime` (see Contract 4).

#### 1.3 Session Google Calendar sync

Update `createSession()`:
- If `startTime`/`endTime` provided → `createCalendarEvent()` with timed event, all batch members as attendees
- If only `sessionDate` → `createCalendarEvent()` with `isAllDay: true`, all batch members
- Store returned `googleEventId`
- Use `sendUpdates: "all"` for create, `sendUpdates: "externalOnly"` for updates (avoid spam on edits)

Update `updateSession()`:
- If `googleEventId` exists → `updateCalendarEvent()`
- If `googleEventId` doesn't exist but times now provided → `createCalendarEvent()` (first sync)

Update `deleteSession()`:
- If `googleEventId` exists → `deleteCalendarEvent()`

#### 1.4 Extract side-effect from getOfficeHourSlots

Create `completeExpiredSlots(batchId)` as a separate exported function. Remove the `updateMany` block from `getOfficeHourSlots()`. Call `completeExpiredSlots()` from `/office-hours/page.tsx` before the read.

---

### Phase 2: Unified Schedule Query
*~0.5 day*

#### 2.1 Create `src/actions/schedule.ts`

```typescript
export async function getScheduleItems(params: {
  batchId: string;
  viewerId: string;
  viewerRole: string;
  rangeStart: Date;  // startOfWeek(startOfMonth(month))
  rangeEnd: Date;    // endOfWeek(endOfMonth(month))
}): Promise<ScheduleItem[]>
```

Implementation:
- 3 Prisma queries in `Promise.all`:
  - **Events**: `where: { batchId, startTime: { gte: rangeStart, lte: rangeEnd } }`, select: id, title, startTime, endTime, timezone, eventType, location, googleEventId
  - **OfficeHourSlots**: `where: { batchId, startTime: { gte: rangeStart, lte: rangeEnd } }`, select: id, startTime, endTime, timezone, status, googleMeetLink, groupId + host name + group name. For founders: add `AND (groupId IS NULL OR groupId IN [user's groups])`.
  - **Sessions**: `where: { batchId }` with range filter on `startTime` (if present) OR `sessionDate` (if startTime is null). Select: id, title, sessionDate, startTime, endTime, timezone, googleEventId
- Normalize into `ScheduleItem[]`:
  - Events → `kind: "event"`, `deepLink: "/events"`
  - OH → `kind: "officeHour"`, `deepLink: "/office-hours"`
  - Sessions → `kind: "session"`, `deepLink: "/sessions"`, `isAllDay: !session.startTime`
- Sort by `startTime` ascending (all-day items first within a day)
- Cache with `unstable_cache`, tag: `schedule-${batchId}`, revalidate: 60

#### 2.2 Create `src/types/schedule.ts`

Export `ScheduleItem` and `ScheduleItemKind` types (as defined above).

---

### Phase 3: Calendar UI (Frontend)
*~1.5 days*

#### 3.1 Upgrade `Calendar.tsx`

Changes to `src/components/ui/Calendar.tsx`:

- **New props**: Accept `items: ScheduleItem[]` (alongside legacy `events` prop for backward compat if `/events` still uses it)
- **Multi-type indicators**: Replace single green dot with up to 3 colored dots per day:
  - 🔵 Blue dot = has Events
  - 🟢 Green dot = has Office Hours
  - 🟣 Purple dot = has Sessions
- **Controlled month**: Accept optional `month` and `onMonthChange` props. When controlled, don't use internal state.
- **Selected day**: Accept optional `selectedDay` and `onDaySelect` props.
- **Item count**: Show "+N" badge if total items > 3 on a day.
- **A11y**: Add `aria-label="Previous month"` / `aria-label="Next month"` on nav buttons. Day buttons announce `aria-label={format(day, "EEEE, MMMM d, yyyy")} ${count} items`.

Do NOT break existing usage by `/events` page (EventsList.tsx line 201). Either:
- Keep backward compat via optional `events` prop, or
- Update EventsList to pass `items` in the new format

#### 3.2 Create `/schedule` page (server component)

`src/app/(dashboard)/schedule/page.tsx`:

```typescript
export const revalidate = 60;

export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // Default to current month, accept ?month=YYYY-MM
  // Compute grid range per Contract 3
  // Call getScheduleItems(...)
  // Pass to client component
}
```

Accept URL search params: `?month=YYYY-MM`, `?day=YYYY-MM-DD`, `?type=event|officeHour|session`.

#### 3.3 Create `ScheduleView.tsx` (client component)

`src/app/(dashboard)/schedule/ScheduleView.tsx`:

Layout:
- Desktop: `grid grid-cols-1 lg:grid-cols-3 gap-4` (calendar 2/3, panel 1/3)
- Mobile: stack vertically

Contains:
- **Calendar** (upgraded Calendar.tsx)
- **Type filter buttons**: [All] [Events] [Office Hours] [Sessions] — updates URL param `?type=`
- **Day Panel** (see 3.4)
- Month ◄ ► navigation with fade transition (see below)

**Month Navigation (Option A — fade transition):**

How it works step by step:
1. User clicks ◄ or ► arrow
2. Calendar **immediately fades to 50% opacity** (tells user "loading")
3. URL updates to `?month=2026-03` → server fetches new month's data (~0.3s)
4. New data arrives → calendar **fades back to 100%** with new month

Implementation:
```typescript
const router = useRouter();
const [isPending, startTransition] = useTransition();

const handleMonthChange = (newMonth: string) => {
  startTransition(() => {
    router.push(`/schedule?month=${newMonth}`, { scroll: false });
  });
};

// In the JSX:
<div style={{ 
  opacity: isPending ? 0.5 : 1, 
  transition: "opacity 150ms ease",
  pointerEvents: isPending ? "none" : "auto"  // prevent double-clicks while loading
}}>
  <Calendar ... />
</div>
```

Why this approach:
- `useTransition` keeps the current calendar visible while loading (no blank page flash)
- `scroll: false` prevents page jumping
- `pointerEvents: none` prevents clicking during load
- URL-based means browser back/forward works, and the page is bookmarkable
- 60s cache means revisiting the same month is instant
- If this ever feels too slow: easy to upgrade to client-side fetching later without changing the data layer

#### 3.4 Day Panel component

`src/app/(dashboard)/schedule/DayPanel.tsx`:

When a day is selected:
- Header: formatted date (e.g., "Tuesday, February 11, 2026")
- Items sorted chronologically (all-day items first)
- Each item card:
  - Left: colored circle (blue/green/purple by kind)
  - Title (bold)
  - Time range or "All day"
  - Status badge (for OH: "Available", "Confirmed", etc.)
  - Host/Group (for OH)
  - "View →" link to `deepLink`
- **Admin quick-create**: "+ Create" button at bottom with dropdown:
  - "Event" → navigates to `/events?date=YYYY-MM-DD`
  - "Office Hour" → navigates to `/office-hours?date=YYYY-MM-DD`
  - "Session" → navigates to `/sessions?date=YYYY-MM-DD`
- **Empty day**: "No items scheduled" message + quick-create (admin only)

When no day is selected:
- Show "Select a day to view details"
- OR show "Upcoming" list (next 5 items from today forward)

#### 3.5 Update existing pages to accept `?date=` param

Add pre-filling support for the create forms:
- `EventsList.tsx`: if `?date=` present, auto-open create modal with startTime pre-filled
- `OfficeHoursList.tsx`: if `?date=` present, auto-open create modal with date pre-filled
- `SessionsList.tsx`: if `?date=` present, auto-open create modal with sessionDate pre-filled

#### 3.6 Update navigation

In `DashboardSidebar.tsx`:
- Add `{ id: "schedule", label: "Schedule", href: "/schedule", icon: CalendarIcon }` to `NAV_ITEMS` array
- Position: after Home, before existing items
- Keep Events, Office Hours, Sessions items as-is (no submenu, no removal)

#### 3.7 Session create/edit form update

Update `SessionsList.tsx` create and edit modals:
- Add optional "Start Time" (`type="datetime-local"`) and "End Time" fields
- Add "Timezone" select (PST/KST/UTC)
- Validation: if start time provided, end time required
- If times provided → timed event + calendar sync
- If only date → all-day event + calendar sync

---

### Phase 4: Polish & Testing
*~0.5 day*

#### 4.1 Responsive behavior

- Desktop (lg+): 2-column layout
- Tablet/Mobile (<lg): stack vertically, day panel below calendar
- Day panel scrolls independently on desktop

#### 4.2 Empty states

- No items this month: "No items scheduled in [Month]. Use the + button to create one."
- No items on selected day: "Nothing scheduled on [Date]."
- Calendar looks sparse: Consider adding an "Upcoming" section below the calendar (list of next 5 items regardless of month view) — only if time permits.

#### 4.3 Testing checklist

| Test | Verify |
|------|--------|
| Admin sees all 3 types on calendar | Events, OH, Sessions all appear with correct colors |
| Mentor sees their OH + batch events/sessions | OH from other mentors visible, own slots editable via deep link |
| Founder sees only their group's OH | OH for other groups NOT visible |
| Founder cannot see other batch's items | Cross-batch isolation works |
| Timezone: create event in PST, view in calendar | Shows on correct day |
| Timezone: create OH in KST, view in calendar | Shows on correct day |
| Session with times → Google Calendar invite | All batch members receive invite with correct time |
| Session without times → all-day event | All batch members receive all-day invite |
| Create event on /events → appears on /schedule | Cache invalidation works |
| Approve OH on /office-hours → status updates on /schedule | Cache invalidation works |
| Delete session on /sessions → disappears from /schedule | Cache invalidation works |
| Month navigation → URL updates, data refreshes | ?month param works |
| Day click → panel shows correct items | Filtering by date works |
| Type filter → calendar + panel update | Only selected type visible |
| Quick-create → navigates with ?date= → form pre-filled | Pre-filling works |
| Mobile layout → stacks vertically | No horizontal overflow |
| Batch scoping: admin cannot access other batch event via URL | Returns "Not found" |

---

## What This Does NOT Include (Explicit Scope Exclusions)

- Week view / time-grid view
- Drag-and-drop scheduling
- Reading FROM users' personal Google Calendars (availability)
- Two-way sync with Google Calendar
- Real-time updates (WebSocket/SSE) — uses 60s cache revalidation
- Inline OH request/approve flows on /schedule (deep-link only for MVP)
- Create modals on /schedule page (navigates to existing pages)
- Recurring events / repeating schedules
- Mobile-optimized agenda view

---

## File Changes Summary

| File | Change | Phase |
|------|--------|-------|
| `src/lib/timezone.ts` | **NEW** — shared timezone helper | 0.1 |
| `src/lib/cache-helpers.ts` | **NEW** — `revalidateSchedule()` helper | 0.2 |
| `src/actions/event.ts` | Batch scoping on reads+mutations, timezone fix, schedule invalidation | 0.3, 0.5 |
| `src/actions/session.ts` | Batch scoping, Google Calendar sync, schedule invalidation | 0.3, 1.3 |
| `src/actions/office-hour.ts` | Batch scoping on deleteSlot, extract side-effect, schedule invalidation (8 functions) | 0.3, 1.4 |
| `src/lib/google-calendar.ts` | Add all-day event support | 1.2 |
| `prisma/schema.prisma` | Add startTime/endTime/timezone/googleEventId to Session | 1.1 |
| `src/types/schedule.ts` | **NEW** — ScheduleItem types | 2.2 |
| `src/actions/schedule.ts` | **NEW** — unified schedule query | 2.1 |
| `src/components/ui/Calendar.tsx` | Multi-type indicators, controlled state, a11y | 3.1 |
| `src/app/(dashboard)/schedule/page.tsx` | **NEW** — server component | 3.2 |
| `src/app/(dashboard)/schedule/ScheduleView.tsx` | **NEW** — client component | 3.3 |
| `src/app/(dashboard)/schedule/DayPanel.tsx` | **NEW** — day detail panel | 3.4 |
| `src/app/(dashboard)/events/EventsList.tsx` | Accept ?date= for pre-fill | 3.5 |
| `src/app/(dashboard)/office-hours/OfficeHoursList.tsx` | Accept ?date= for pre-fill | 3.5 |
| `src/app/(dashboard)/sessions/SessionsList.tsx` | Accept ?date= for pre-fill, add time fields to forms | 3.5, 3.7 |
| `src/components/layout/DashboardSidebar.tsx` | Add "Schedule" nav item | 3.6 |
| `src/app/(dashboard)/events/[id]/page.tsx` | Fix batch scoping + redirect path | 0.3, 0.4 |
| `src/app/(dashboard)/sessions/[id]/page.tsx` | Fix batch scoping + redirect path | 0.3, 0.4 |
| `src/app/(dashboard)/office-hours/page.tsx` | Call completeExpiredSlots() before fetch | 1.4 |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Calendar looks sparse (few items) | Medium | Good empty states, "Upcoming" section if time permits |
| Timezone bugs show items on wrong day | **Eliminated** | Contract 1 standardizes all timezone handling |
| Session migration breaks existing data | Low | New fields nullable, sessionDate kept |
| Users confused by /schedule vs existing pages | Low | Schedule is primary nav, existing pages still accessible |
| Google Calendar invite spam on session edits | Medium | Use `sendUpdates: "externalOnly"` for updates |
| Calendar grid edge-day mismatch | **Eliminated** | Contract 3 defines grid range fetch |
| Cross-batch data exposure | **Eliminated** | Contract 2 applies batch scoping everywhere |
| Cache staleness after mutations | **Eliminated** | `revalidateSchedule()` helper called from all mutations |
| Missing ?date= param handling in existing pages | Low | Gracefully ignore if param absent |
