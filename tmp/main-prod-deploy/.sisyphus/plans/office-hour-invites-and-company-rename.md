# Plan: Company Rename + Office Hour Individual Invites + Session/Event Company Targeting

**Created**: 2026-02-26
**Status**: Draft
**Branch**: `newdesign`
**Risk Level**: Medium (no schema migration, UI + server action changes only)

---

## Overview

Three connected changes:
1. Rename all "Group" → "Company" in user-facing UI/emails/errors
2. Add individual founder invite mode to Office Hours
3. Add company multi-select with "Select All" to Sessions and Events

**No Prisma schema migration needed.** All changes are:
- UI label renames
- New/modified server actions (filtering Calendar attendees)
- New form controls in existing modals

---

## Phase 1: UI Label Rename (Group → Company)

**Goal**: Every user-facing string that says "Group" becomes "Company". URLs stay as-is (`/groups/*`).

### 1A. Office Hours Page — `OfficeHoursList.tsx`

| Line | Current | New |
|------|---------|-----|
| 343 | `"Schedule Group Office Hour"` | `"Schedule Company Office Hour"` |
| 390 | `"Group: {slot.group.name}"` | `"Company: {slot.group.name}"` |
| 408 | `"Join a group to request"` | `"Join a company to request"` |
| 466 | `"Group Members:"` | `"Company Members:"` |
| 608 | `label="Group"` | `label="Company"` |
| 616 | `"Select your group"` | `"Select your company"` |
| 650 | `label="Group"` | `label="Company"` |
| 661 | `"Select group"` | `"Select company"` |
| 721 | `label="Group"` | `label="Company"` |
| 732 | `"Select your group"` | `"Select your company"` |

### 1B. Groups Pages — Rename visible text (keep URL paths)

**`GroupsList.tsx`** (7 strings):
- `"Groups"` → `"Companies"`
- `"Create Group"` → `"Create Company"`
- `"No groups yet"` → `"No companies yet"`
- `"Groups will appear here once created"` → `"Companies will appear here once created"`
- `"Create First Group"` → `"Create First Company"`
- `"Group Name"` label → `"Company Name"`
- `"Brief description of the group"` → `"Brief description of the company"`
- `"Engineering Team"` placeholder → `"Acme Corp"` (more appropriate)
- `"Create Group"` submit button → `"Create Company"`

**`GroupDetail.tsx`** (6 strings):
- `"Leave Group"` / `"Join Group"` → `"Leave Company"` / `"Join Company"`
- `"Share with the group..."` → `"Share with the company..."`
- `"Post to Group"` → `"Post to Company"`
- `"Group Posts"` → `"Company Posts"`
- `"Join the group to post."` → `"Join the company to post."`

**`GroupManage.tsx`** (5 strings):
- `"Manage Group"` → `"Manage Company"`
- `"Group Settings"` → `"Company Settings"`
- `"Group Name"` → `"Company Name"`
- `"Optional description for the group"` → `"Optional description of the company"`
- `"Delete Group"` / `"Yes, Delete Group"` → `"Delete Company"` / `"Yes, Delete Company"`
- Confirmation dialog text: `"this group"` → `"this company"`

### 1C. Server Action Error Messages — `office-hour.ts`

| Line | Current | New |
|------|---------|-----|
| 124 | `"Group, start time, and end time are required"` | `"Company, start time, and end time are required"` |
| 164 | `"Group not found"` | `"Company not found"` |
| 165 | `"Group is not in your batch"` | `"Company is not in your batch"` |
| 166 | `"Cannot schedule for an empty group"` | `"Cannot schedule for a company with no members"` |
| 227 | `"Group is required"` | `"Company is required"` |
| 235 | `"You must be a member of this group to request office hours"` | `"You must be a member of this company to request office hours"` |
| 426 | Same as 235 | Same fix |

### 1D. Email Templates — `email.ts`

| Line | Current | New |
|------|---------|-----|
| 141 | `(${groupName})` in subject | `(${companyName})` — rename param |
| 154 | `from <strong>${groupName}</strong>` | `from <strong>${companyName}</strong>` |
| 209 | `— ${groupName}` in subject | `— ${companyName}` |
| 222 | `for <strong>${groupName}</strong>` | `for <strong>${companyName}</strong>` |

Note: The parameter name `groupName` → `companyName` in the function signatures for `sendOfficeHourRequestEmail` and `sendOfficeHourApprovalEmail`. Update all call sites.

### 1E. Sidebar — `DashboardSidebar.tsx`

| Line | Current | New |
|------|---------|-----|
| 23 | `label: 'Groups'` | `label: 'Companies'` |

### 1F. Calendar Event Summaries — `office-hour.ts`

| Location | Current | New |
|----------|---------|-----|
| `scheduleGroupOfficeHour` | `Office Hour: ${user.name} × ${group.name}` | Keep as-is (group name IS the company name) |
| `scheduleGroupOfficeHour` | `Group office hour session with ${group.name}` | `Office hour session with ${group.name}` |
| `respondToRequest` | `Office Hour: ${host?.name} × ${group.name}` | Keep as-is |

**Verification**: Search entire `src/` for user-facing "group"/"Group" strings. Grep confirm zero remaining (excluding code identifiers like `groupId`, `GroupMember`, etc.)

---

## Phase 2: Data Plumbing

**Goal**: Pass `groups` (companies) and `founders` (batch members) to all components that need them for the new invite controls.

### 2A. Office Hours Page — Add founders data

**`office-hours/page.tsx`**: Already passes `groups` to `OfficeHoursList`. Need to also pass `founders` (batch members with founder/co_founder role).

```ts
// Add to page.tsx data fetching:
const founders = await prisma.userBatch.findMany({
  where: { batchId: user.batchId, status: "active", user: { role: { in: ["founder", "co_founder"] } } },
  include: { user: { select: { id: true, name: true, email: true, profileImage: true } } },
});
```

**`OfficeHoursList.tsx`**: Add `founders` prop to interface.

### 2B. Schedule Page — Add groups + founders to DayPanel

**`schedule/page.tsx`** or **`ScheduleView.tsx`**: Need to fetch and pass `groups` and `founders` down to `DayPanel`.

**`DayPanel.tsx`**: Add `groups` and `founders` props to `DayPanelProps` interface.

### 2C. Create a shared type

```ts
// In src/types/index.ts or similar
interface FounderOption {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
}

interface CompanyOption {
  id: string;
  name: string;
  _count: { members: number };
}
```

**Verification**: TypeScript compiles clean (`tsc --noEmit`).

---

## Phase 3: Office Hours — Individual Founder Mode

**Goal**: Admin can schedule office hour for a single founder (not just companies/groups).

### 3A. New Server Action — `scheduleIndividualOfficeHour()`

**File**: `src/actions/office-hour.ts`

```ts
export async function scheduleIndividualOfficeHour(formData: FormData): Promise<ActionResult<{ id: string }>> {
  // 1. Auth: staff only (isStaff)
  // 2. Parse: founderId, startTime, endTime, timezone
  // 3. Validate: founder exists in batch, time valid, ≤1 hour, not past
  // 4. Create slot: status="confirmed", groupId=null, hostId=currentUser
  // 5. Calendar: createCalendarEventWithMeet with [host.email, founder.email]
  // 6. Store meetLink + eventId
  // 7. Revalidate
}
```

### 3B. UI — Radio Toggle in Schedule Modal

**File**: `OfficeHoursList.tsx` — Modify the "Schedule Company Office Hour" modal

Add radio toggle at top of form:
```
◉ Company    ○ Individual Founder
```

- **Company selected** (default): Show company dropdown (existing behavior)
- **Individual Founder selected**: Show searchable founder dropdown

State:
```tsx
const [inviteMode, setInviteMode] = useState<"company" | "individual">("company");
```

Founder dropdown: simple `<select>` with founder names, or a searchable input if many founders.

Submit handler branches on `inviteMode`:
- Company → calls `scheduleGroupOfficeHour(formData)` (existing)
- Individual → calls `scheduleIndividualOfficeHour(formData)` (new)

### 3C. DayPanel — Mirror Individual Mode

**File**: `DayPanel.tsx` — Office hour create form

Currently only has time fields. Add:
1. Radio toggle: "Company" | "Individual Founder"
2. Company mode: company dropdown
3. Individual mode: founder dropdown
4. Submit routes to appropriate server action

**Verification**: 
- Create office hour for individual founder → slot created with status "confirmed", no groupId
- Google Calendar invite sent to founder + host
- Meet link stored and displayed

---

## Phase 4: Sessions & Events — Company Multi-select with Select All

**Goal**: Admin can optionally target specific companies when creating sessions/events. Default = entire batch.

### 4A. Modify `createSession()` — Accept optional `groupIds[]`

**File**: `src/actions/session.ts`

```ts
// After creating session, before Calendar invite:
const groupIds = formData.getAll("groupIds") as string[];

let attendeeEmails: string[];
if (groupIds.length > 0) {
  // Specific companies selected — get their members
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId: { in: groupIds } },
    include: { user: { select: { email: true } } },
  });
  // Always include the creator + deduplicate
  attendeeEmails = [...new Set([user.email, ...groupMembers.map(m => m.user.email)])];
} else {
  // Entire batch (current behavior)
  const batchUsers = await prisma.userBatch.findMany({
    where: { batchId: user.batchId, status: "active" },
    include: { user: { select: { email: true } } },
  });
  attendeeEmails = batchUsers.map(ub => ub.user.email);
}
```

Same change in `updateSession()` — if Calendar event is updated, use the same groupIds logic.

### 4B. Modify `createEvent()` — Same pattern

**File**: `src/actions/event.ts`

Identical `groupIds` handling as Sessions. Copy the attendee filtering logic.

Same change in `updateEvent()`.

### 4C. UI — Company Checkbox List Component

Create a reusable component used by both Session and Event creation:

**File**: `src/components/ui/CompanySelect.tsx` (new)

```tsx
interface CompanySelectProps {
  companies: CompanyOption[];
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
  inviteMode: "entire_batch" | "specific";
  onModeChange: (mode: "entire_batch" | "specific") => void;
  totalBatchMembers: number;
}
```

UI structure:
```
◉ Entire Batch (N members)
○ Specific Companies

[When "Specific Companies" selected:]
┌──────────────────────────────────┐
│ ☑ Select All                    │
│ ──────────────────────────────  │
│ ☑ Acme Corp (4 members)         │
│ ☑ StartupXYZ (3 members)        │
│ ☐ FooBar Inc (2 members)        │
└──────────────────────────────────┘
```

"Select All" logic:
- Checking "Select All" → checks all companies
- Unchecking "Select All" → unchecks all companies
- Unchecking one company → "Select All" unchecks (individual items stay)
- Checking last remaining company → "Select All" auto-checks

Hidden `<input>` fields for form submission:
```tsx
{Array.from(selectedIds).map(id => (
  <input key={id} type="hidden" name="groupIds" value={id} />
))}
```

### 4D. Session Creation UI

**File**: Sessions page creation modal (if exists) + `DayPanel.tsx`

Add `<CompanySelect>` component after other form fields.

### 4E. Event Creation UI

**File**: Events page creation modal (if exists) + `DayPanel.tsx`

Add `<CompanySelect>` component after other form fields.

**Verification**:
- Create session with "Entire Batch" → all batch members invited (current behavior)
- Create session with 2 specific companies → only those companies' members + creator invited
- Create session with "Select All" → all company members + creator invited
- Same tests for Events
- Calendar invites received by correct attendees

---

## Phase 5: DayPanel Integration

**Goal**: All three inline create modals in DayPanel get the new controls.

### Changes to DayPanel.tsx

| Modal | Current Fields | New Fields |
|-------|---------------|------------|
| **Event** | Title, Description, Type, Start, End, TZ, Location | + `<CompanySelect>` (multi-select, "Entire Batch" default) |
| **Office Hour** | Start, End, TZ | + Radio: Company/Individual + Company dropdown OR Founder dropdown |
| **Session** | Title, Description, Date, Start, End, TZ | + `<CompanySelect>` (multi-select, "Entire Batch" default) |

### Props Changes

```tsx
interface DayPanelProps {
  items: ScheduleItem[];
  selectedDay: Date | null;
  isAdmin: boolean;
  // NEW:
  companies: CompanyOption[];     // for all three modals
  founders: FounderOption[];      // for office hour individual mode
  totalBatchMembers: number;      // for "Entire Batch (N members)" label
}
```

### Submit Handler Changes

`handleCreateSubmit` currently routes to:
- `createEvent(formData)` — formData now includes groupIds[]
- `createOfficeHourSlot(formData)` — needs branching for individual mode
- `createSession(formData)` — formData now includes groupIds[]

For office hours in DayPanel, add `inviteMode` state and branch:
- Company → `scheduleGroupOfficeHour(formData)` (renamed from "Schedule Group Office Hour")
- Individual → `scheduleIndividualOfficeHour(formData)`

**Verification**: All three DayPanel modals work with new controls. Calendar invites sent correctly.

---

## Phase 6: Final Verification

1. **TypeScript**: `tsc --noEmit` clean
2. **Build**: `npm run build` succeeds
3. **UI Audit**: Grep for remaining "group"/"Group" user-facing strings → zero
4. **Functional Tests**:
   - Office Hour: company mode creates slot + Calendar invite to all company members
   - Office Hour: individual mode creates slot + Calendar invite to specific founder
   - Session: "Entire Batch" → all members invited
   - Session: specific companies → only those members invited
   - Session: "Select All" → all company members invited
   - Event: same as Session tests
   - DayPanel: all three modals work
5. **Email**: Office hour emails use "company" not "group"
6. **Sidebar**: Shows "Companies" not "Groups"

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Missing a "Group" string somewhere | Comprehensive grep after Phase 1 |
| DayPanel.tsx growing too large (currently 516 lines) | CompanySelect is a separate component; DayPanel stays manageable |
| Calendar invite failures | Existing graceful degradation (returns null, continues without Calendar) |
| Founders without a company can't be invited via company select | "Entire Batch" mode includes everyone; individual mode covers edge cases |
| "Select All" ≠ "Entire Batch" (mentors/admins not in companies) | Clear radio label: "Entire Batch (N members)" vs "Specific Companies" makes distinction visible |

---

## Execution Order

| # | Phase | Effort | Can Commit Independently? |
|---|-------|--------|--------------------------|
| 1 | UI Label Rename | Low | ✅ Yes |
| 2 | Data Plumbing | Low | ✅ Yes (with Phase 1) |
| 3 | Office Hours Individual Mode | Medium | ✅ Yes |
| 4 | Sessions/Events Company Multi-select | Medium | ✅ Yes |
| 5 | DayPanel Integration | Medium | ✅ Yes |
| 6 | Final Verification | Low | N/A |

**Estimated total**: 4-5 commits, each independently functional.

---

## Files Modified (Complete List)

### Phase 1 (Rename)
- `src/app/(dashboard)/office-hours/OfficeHoursList.tsx` — 10 string changes
- `src/app/(dashboard)/groups/GroupsList.tsx` — 9 string changes
- `src/app/(dashboard)/groups/[id]/GroupDetail.tsx` — 6 string changes
- `src/app/(dashboard)/groups/[id]/manage/GroupManage.tsx` — 7 string changes
- `src/actions/office-hour.ts` — 7 error message changes + 1 calendar description
- `src/lib/email.ts` — 4 string changes + param rename
- `src/components/layout/DashboardSidebar.tsx` — 1 label change

### Phase 2 (Data Plumbing)
- `src/app/(dashboard)/office-hours/page.tsx` — add founders fetch
- `src/app/(dashboard)/schedule/page.tsx` — add groups + founders fetch
- `src/app/(dashboard)/schedule/ScheduleView.tsx` — pass props to DayPanel
- `src/types/index.ts` — add FounderOption, CompanyOption types

### Phase 3 (Office Hours Individual)
- `src/actions/office-hour.ts` — new `scheduleIndividualOfficeHour()` action
- `src/app/(dashboard)/office-hours/OfficeHoursList.tsx` — radio toggle + founder dropdown in modal

### Phase 4 (Sessions/Events Company Select)
- `src/components/ui/CompanySelect.tsx` — NEW reusable component
- `src/actions/session.ts` — accept groupIds[], filter attendees
- `src/actions/event.ts` — accept groupIds[], filter attendees

### Phase 5 (DayPanel)
- `src/app/(dashboard)/schedule/DayPanel.tsx` — all three modals updated with new controls

### Unchanged
- `prisma/schema.prisma` — NO migration
- `src/lib/google-calendar.ts` — NO changes (already supports arbitrary attendee lists)
- URL paths (`/groups/*`) — NO changes
