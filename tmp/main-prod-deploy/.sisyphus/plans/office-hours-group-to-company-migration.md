# Plan: Office Hours — Group → Company Migration

**Created**: 2026-03-04
**Status**: Draft
**Estimated Effort**: Medium-High (4-6 focused work blocks)

---

## Problem Statement

The "Schedule Company Office Hour" feature and all office-hour-related flows use the legacy `Group` model (old "teams" concept) instead of the newer `Company` model. This causes the dropdown to show fake/stale team names ("Riding Club", "Real") instead of the actual companies visible in Admin → Companies.

**Root cause**: `OfficeHourSlot.groupId` FK → `Group` table. The entire office hour system is wired to `Group`/`GroupMember`, not `Company`/`CompanyMember`.

---

## Approach: Full Migration to Company

Add `companyId` FK to `OfficeHourSlot`, update all server actions and UI to use `Company`/`CompanyMember`. Keep `groupId` temporarily (nullable) for backward compatibility with existing records, then deprecate.

---

## Pre-Implementation: Data Audit (BLOCKING)

Before any code changes, verify the data state. This is a **blocking prerequisite**.

### Task 0.1 — Verify CompanyMember Records Exist

Run against the database:

```sql
SELECT c.name, COUNT(cm.id) as member_count
FROM companies c
LEFT JOIN company_members cm ON cm.company_id = c.id
GROUP BY c.id, c.name ORDER BY c.name;
```

**If CompanyMember is empty**: Must populate before proceeding. Options:
- A) Manual: Admin adds members via existing Admin → Companies → Edit UI
- B) Script: Map GroupMember → CompanyMember by matching Group.name ≈ Company.name
- C) Ask user which founders belong to which companies

### Task 0.2 — Audit Existing OfficeHourSlot Records

```sql
SELECT COUNT(*) as total, COUNT(group_id) as with_group FROM office_hour_slots;
```

### Task 0.3 — Verify Company-Batch Relationship

```sql
SELECT c.name, b.name as batch_name
FROM company_batches cb
JOIN companies c ON c.id = cb.company_id
JOIN batches b ON b.id = cb.batch_id WHERE b.status = 'active';
```

**If empty**: Office hour scheduling won't find companies for the active batch.

---

## Phase 1 — Schema Migration

### Task 1.1 — Add `companyId` to OfficeHourSlot

**File**: `prisma/schema.prisma`

- Add `companyId String? @map("company_id") @db.Uuid` to OfficeHourSlot
- Add `company Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)` relation
- Add `officeHourSlots OfficeHourSlot[]` reverse relation to Company model
- Add `@@index([companyId])` index
- Keep existing `groupId` nullable for backward compat
- Run `npx prisma migrate dev --name add-company-to-office-hour-slot`

### Task 1.2 — Data Backfill (if needed per Task 0)

```sql
UPDATE office_hour_slots ohs
SET company_id = c.id
FROM groups g JOIN companies c ON LOWER(TRIM(c.name)) = LOWER(TRIM(g.name))
WHERE ohs.group_id = g.id AND ohs.company_id IS NULL;
```

---

## Phase 2 — Server Actions (6 tasks)

### Task 2.1 — Create `getCompaniesForBatch` Helper

**File**: `src/actions/company.ts` (new export)

Fetch companies linked to batch via CompanyBatch, include member count. Returns `{ id, name, memberCount, members[] }`. Replaces `getGroups()` calls in office-hour context.

### Task 2.2 — Update `scheduleGroupOfficeHour`

**File**: `src/actions/office-hour.ts`

- Accept `companyId` from formData instead of `groupId`
- Query `prisma.company.findUnique` with members (where `isCurrent: true`)
- Write `companyId` to `OfficeHourSlot.create()`
- Google Calendar summary uses `company.name`

### Task 2.3 — Update `proposeOfficeHour`

**File**: `src/actions/office-hour.ts`

- Validate membership via `CompanyMember` instead of `GroupMember`
- Write `companyId` instead of `groupId`
- Email notification: `companyName` from Company model

### Task 2.4 — Update `getOfficeHourSlots`

**File**: `src/actions/office-hour.ts`

- Include `company` relation instead of `group`
- Founder visibility: query `CompanyMember` (where `isCurrent: true`) instead of `GroupMember`

### Task 2.5 — Update `respondToRequest`

**File**: `src/actions/office-hour.ts`

- Calendar invites: attendee emails from `CompanyMember` instead of `GroupMember`
- Calendar summary: `company.name`
- Approval email: `companyName` from Company

### Task 2.6 — Update `requestOfficeHour`

**File**: `src/actions/office-hour.ts`

- Email notification: fetch company name from Company model

### Task 2.7 — Update `getScheduleItems`

**File**: `src/actions/schedule.ts`

- Select `company { name }` instead of `group { name }`
- Title: `Office Hour: ${oh.company.name}`
- Populate `companyName` (rename from `groupName`)
- Founder visibility: `CompanyMember` instead of `GroupMember`

---

## Phase 3 — Types (3 tasks)

### Task 3.1 — Update ScheduleItem

**File**: `src/types/schedule.ts`
- Rename `groupName?: string` → `companyName?: string`

### Task 3.2 — Update FounderOption

**File**: `src/types/invite.ts`
- Rename `groupName: string | null` → `companyName: string | null`

### Task 3.3 — Update OfficeHourSlot Interface

**File**: `src/app/(dashboard)/office-hours/OfficeHoursList.tsx`
- Change `group?` property → `company?` with CompanyMember shape

---

## Phase 4 — Pages & Components (5 tasks)

### Task 4.1 — Update Schedule Page

**File**: `src/app/(dashboard)/schedule/page.tsx`
- Replace `getGroups()` → `getCompaniesForBatch()`
- Build companies from real Company data
- Founder company name from CompanyMember

### Task 4.2 — Update Office Hours Page

**File**: `src/app/(dashboard)/office-hours/page.tsx`
- Replace `getGroups()` → `getCompaniesForBatch()`
- Pass companies instead of groups to OfficeHoursList

### Task 4.3 — Update OfficeHoursList Component

**File**: `src/app/(dashboard)/office-hours/OfficeHoursList.tsx`
- Replace `groups` prop → `companies` prop
- All dropdowns iterate companies
- `slot.company.name` instead of `slot.group.name`
- Form field: `companyId` instead of `groupId`

### Task 4.4 — Update DayPanel Component

**File**: `src/app/(dashboard)/schedule/DayPanel.tsx`
- Form: `companyId` instead of `groupId`
- Founder label: `f.companyName` instead of `f.groupName`

### Task 4.5 — Update ScheduleView and any remaining groupName refs

Grep for remaining `groupName` references in schedule-related components and update.

---

## Phase 5 — Verification (4 tasks)

### Task 5.1 — TypeScript Compilation
`npx tsc --noEmit` — zero errors

### Task 5.2 — LSP Diagnostics on All Changed Files

### Task 5.3 — Build Verification
`npm run build` — exit 0

### Task 5.4 — Manual Smoke Test
- [ ] Admin: "Schedule Company Office Hour" shows real company names
- [ ] Admin: schedule OH for company → slot created with companyId
- [ ] Google Calendar invite sent to CompanyMember emails
- [ ] Founder: sees only their company's office hours
- [ ] Founder: can propose/request OH for their company
- [ ] Schedule calendar shows correct company names
- [ ] Historical office hours still display (graceful null handling)

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| CompanyMember records don't exist | BLOCKER | Task 0.1 — audit first, populate before code |
| CompanyBatch records missing | BLOCKER | Task 0.3 — verify, populate if needed |
| Existing slots lose company association | HIGH | Keep groupId, backfill companyId via name matching |
| Founder visibility during transition | HIGH | OR logic: show where companyId IN userCompanies OR groupId IN userGroups |
| Calendar invites wrong people | HIGH | CompanyMember isCurrent=true filter |
| Race condition during deploy | LOW | Small user base, graceful null handling |

---

## Out of Scope

- Removing Group model entirely (still used by posts, messaging)
- Removing groupId column from OfficeHourSlot (keep nullable, clean up later)
- Migrating community posts from Group to Company

---

## Execution Order

```
Task 0.1-0.3  →  Data Audit (BLOCKING)
     ↓
Task 1.1-1.2  →  Schema Migration
     ↓
Task 2.1      →  getCompaniesForBatch helper
     ↓
Task 2.2-2.7  →  Server Actions (parallelizable)
     ↓
Task 3.1-3.3  →  Type Updates (parallelizable)
     ↓
Task 4.1-4.5  →  Page & Component Updates (parallelizable)
     ↓
Task 5.1-5.4  →  Verification
```

**Critical path**: 0.x → 1.x → 2.1 → 2.2 → 4.x → 5.x

---

## Files Changed (Complete List)

| File | Change Type |
|------|-------------|
| `prisma/schema.prisma` | Schema — add companyId FK |
| `src/actions/company.ts` | New export — getCompaniesForBatch |
| `src/actions/office-hour.ts` | Major — 5 functions updated |
| `src/actions/schedule.ts` | Medium — query + mapping changes |
| `src/types/schedule.ts` | Minor — rename groupName → companyName |
| `src/types/invite.ts` | Minor — rename groupName → companyName |
| `src/app/(dashboard)/schedule/page.tsx` | Medium — data fetching |
| `src/app/(dashboard)/schedule/DayPanel.tsx` | Medium — form + display |
| `src/app/(dashboard)/office-hours/page.tsx` | Medium — data fetching |
| `src/app/(dashboard)/office-hours/OfficeHoursList.tsx` | Major — props, modals, display |
