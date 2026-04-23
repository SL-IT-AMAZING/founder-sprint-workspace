# Template UX + Batch-Independent Event Option Plan

> Improve the assignment template UX so operators understand and trust it, and add a safe event option that behaves like “not tied to one batch” without breaking the current batch-centric architecture.

## Part 1. Assignment Template UX

### Current reality
The current assignment template flow already exists:
- templates are stored in `AssignmentTemplate`
- operators can save an assignment as a template
- templates can be selected in `Create Assignment`
- selected templates can now be deleted

The issue is not missing core functionality.
The issue is **clarity**.

### Problem
Right now the feature feels like a hidden power-user feature:
- operators cannot immediately tell what a template does
- selecting a template gives little explanatory feedback
- delete exists, but it feels attached rather than intentionally managed
- when there are no templates, the interface does not teach the workflow

### Goal
Keep the feature lightweight, but make it obvious:
1. what a template is
2. what fields it fills in
3. how templates are created
4. what happens when deleting one

### Recommended UX
#### A. Helper copy under template label
Add a short explanation:

> Choose a template to automatically fill in the title, description, template link, and review criteria.

#### B. Empty-state guidance
If there are no templates, show:

> No saved templates yet. Create an assignment first, then use “Save as template” to reuse it later.

#### C. Selected template preview
When a template is selected, show a small preview card with:
- template name
- title
- short description
- template link presence
- review criteria badges

Optional if easy:
- created by
- last updated

#### D. Safer delete confirmation
Use explicit language:

> Delete this template? This removes only the saved template. Existing assignments will not be deleted.

### Scope
#### In scope
- helper text
- empty-state guidance
- selected template preview block
- clearer delete confirmation

#### Out of scope
- dedicated template management page
- template editing
- template renaming
- template direct creation screen

### Why this is the right level
This gives operators clarity without turning templates into a separate product area.

---

## Part 2. “Batch-Independent” Events

### Important architectural finding
A truly batchless event is **not** a simple UI option in the current system.

Current event architecture assumes batch scope everywhere:
- `Event.batchId` is required in Prisma schema
- `EventBatch` join records are used for multi-batch support
- `createEvent()` requires at least one active batch
- `getEvents(batchId)` is batch-filtered
- schedule/event cache invalidation is batch-tagged
- company targeting only works when exactly one batch is selected

So the safe approach is **not**:
- make `batchId` nullable
- let events exist without any batch

That would ripple through access control, caching, query shape, and UI assumptions.

### Recommended product interpretation
Instead of “no batch,” add an option that behaves like:

> **All active batches**

Meaning:
- user can create an event that is visible across all selected active batches
- internally it still uses the existing `EventBatch` relation
- the event is still batch-attached in a safe, compatible way

### Best product shape
#### Option label in UI
Do not call it “No batch.”
Call it something like:
- `All active batches`
- `Across all batches`

#### Internal behavior
When chosen:
- resolve all active batch IDs the admin is allowed to target
- create one `Event`
- create `EventBatch` rows for every selected batch
- keep the primary `event.batchId` set to the first batch ID as today

This keeps compatibility with the current model.

### Why this is safer
It works with the current architecture:
- no nullable `batchId`
- no special-case event reads everywhere
- no new access-control model
- no cache model rewrite
- no schedule query redesign

### Important limitation
**Company targeting cannot work with “all active batches.”**
That limitation already exists in the code shape today: company targeting is only valid when exactly one batch is selected.

So the product rule should be:
- if `All active batches` is selected → disable `Specific Companies`
- if exactly one batch is selected → allow company targeting

### Recommended UX copy
If user selects all batches:

> Company targeting is only available when exactly one batch is selected.

### Scope
#### In scope
- add “All active batches” option to event creation flow
- reuse current multi-batch event model
- disable company targeting for multi-batch scope
- make the UX explicit

#### Out of scope
- true batchless events
- cross-batch company targeting
- global event feed independent of batch model
- schema refactor making `batchId` optional

---

## Implementation Order

### Step 1. Assignment template UX clarity
- helper text
- empty-state guidance
- selected-template preview
- safer delete copy

### Step 2. Event scope UX clarification
- add “All active batches” wording
- make scope meaning explicit in the event form
- clearly disable company targeting for multi-batch scope

### Step 3. Batch-wide event option
- wire the “All active batches” selection to existing multi-batch creation logic
- verify event appears in each batch’s event list/schedule
- verify cache invalidation per batch still works

---

## Validation Plan

### Assignment template UX
1. No templates exist
   - helper text visible
   - empty guidance visible
2. Template selected
   - preview card visible
   - filled fields match preview
3. Delete template
   - confirm copy is explicit
   - dropdown updates
   - existing assignments unaffected

### Event scope UX
1. Single batch selected
   - company targeting enabled
2. Multiple batches / all active batches selected
   - company targeting disabled
   - explanatory text visible
3. Event created across multiple batches
   - visible in each selected batch
   - schedule invalidation works for each batch

---

## Final Recommendation

### Assignment templates
Yes — improve them now.
This is low risk and high clarity.

### Batch-independent events
Yes — but do it as **“All active batches”**, not true batchless events.
That gives you the product behavior you want while staying inside the current architecture.
