# FounderSprint Operator Manual

## 1. Overview

FounderSprint is a batch-based operating system for running founder programs. The core objects are:
- **Batch**: the program container
- **Users**: founders, co-founders, mentors, admins, super admins
- **Assignments**: batch work with due dates and reminders
- **Sessions**: program sessions, optionally synced to Google Calendar
- **Events**: one-off, in-person, virtual, general session, and office-hour type events
- **Office Hours**: mentor/founder scheduling system

The system is batch-scoped. Most pages and actions depend on the currently selected batch.

---

## 2. Role Guide

### Super Admin
- Highest authority
- Can do everything an admin can do
- Can assign the `super_admin` role
- Can access and operate across batches

### Admin
- Batch/program operator
- Can manage batches, users, groups, events, sessions, and settings
- Can invite users
- Can clone batch structure
- Can operate even when a batch is ended/archived where the system allows admin bypass

### Mentor
- Staff role, but not a batch manager
- Can create assignments
- Can answer founder questions
- Can create office hour slots
- Cannot manage batches or users

### Founder
- Main program participant
- Can ask questions
- Can submit assignments
- Can request office hours

### Co-founder
- Founder-equivalent participant
- Same practical participation permissions as founder
- Must be tied to a primary founder during invite/setup

---

## 3. Batch Lifecycle (Admin)

### Create a batch
1. Open **Admin → Batches**
2. Click **Create Batch**
3. Enter batch name, start date, and end date
4. Save

### Clone a batch
1. Open **Admin → Batches**
2. Find the source batch
3. Click **Clone Structure**
4. Enter the new batch name and dates
5. Click **Clone Batch**

### What cloning copies
- Batch shell
- Assignments
- Sessions

### What cloning does not copy
- Members
- Events
- Office hours
- Existing Google Calendar / Meet links
- Assignment/session targeting scope (these are intentionally stripped on cloned copies)

### After clone
A success modal appears with three actions:
- **Invite Members Now**
- **Review Batch First**
- **Close**

---

## 4. Inviting Users (Admin)

### Single invite
1. Open **Admin → Users**
2. Select the target batch
3. Click **Invite User**
4. Enter email, optional name, and role
5. If role is `co_founder`, choose the primary founder
6. If role is founder/co-founder, optional company assignment may be available
7. Submit

### Bulk invite
1. Open **Admin → Users**
2. Select the target batch
3. Open invite modal
4. Switch to **Bulk**
5. Paste email list
6. Select the role
7. Submit

### Clone handoff invite
After batch clone, choose **Invite Members Now**.
The system opens **Admin → Users** with:
- target batch already selected
- invite modal already open
- source-batch active members preloaded

### Preloading from source batch
When source preload is available:
1. Review the preloaded active users
2. Use checkboxes to include/exclude users
3. Click **Invite Selected Members**

### Result summary behavior
The UI intentionally stays simple:
- **Invited** count
- **Skipped** count

Skipped cases may include:
- already in target batch
- company membership conflict
- other role/business-rule failures

### Existing-user behavior
Not every invite sends an email.
- A **brand-new user** usually goes through invite token + email flow
- An **existing active user** may be added directly to the batch without a new invite email, depending on current invite logic

---

## 5. Invite Acceptance & Onboarding

### Acceptance flow
1. User receives invitation email
2. User opens the invite link
3. User authenticates / logs in
4. Invitation is activated
5. Membership becomes active

### Onboarding digest
After invite acceptance, the system can send a **Welcome / Onboarding Digest**.
It currently includes links to:
- **Assignments**
- **Sessions**
- **Events**

It does **not** currently include Office Hours.

### Batch-aware links
Onboarding links use a batch-selection redirect first, so the user lands inside the intended batch context before opening the page.

---

## 6. Assignments

### Admin / Mentor
- Create assignments
- Review submissions
- Provide feedback
- Use reminder tools for non-submitters

### Founder / Co-founder
- View assignments in the current batch
- Submit work
- View feedback

### 24-hour reminder
The system includes an automatic reminder path for assignments due in about 24 hours.
Current behavior:
- cron runs hourly
- route selects assignments due in the next `23h–24h` window
- only non-submitters are targeted
- dedupe is tracked via notifications

---

## 7. Sessions and Events

### Sessions
Sessions are recurring or planned program sessions.
They can:
- belong to a batch
- be targeted by company scope
- sync to Google Calendar

### Events
Events support multiple types:
- one-off
- in_person
- virtual
- general_session
- office_hour

They can:
- sync to Google Calendar
- create Google Meet links where applicable
- target companies in a batch

### Important limitation after clone
Cloned sessions do **not** carry over existing Google Calendar / Meet links.
They are copied as structure only.

---

## 8. Settings and Batch Context

### Settings page
Users can manage profile and related settings in **Settings**.
The settings sidebar also reflects batch context and timezone information.

### Batch switcher
If a user belongs to multiple active batches, they can switch batch context using the batch switcher.
This matters because most content pages are batch-scoped.

---

## 9. Office Hours

Office Hours are a separate workflow from clone/invite onboarding.
They support scheduling and request flows, but they are **not** currently part of the clone follow-up communication scope.

---

## 10. What Is Verified vs. Not Verified

### Verified in this round
- Build passes
- Reminder runtime path works
- Reminder 23–24h window selection works
- Clone success modal / invite handoff browser flow is covered by new E2E
- Strengthened admin batch smoke test is covered

### Still limited or externally unproven
- Full **browser** proof of invite acceptance → onboarding digest is still not covered end-to-end in Playwright; current proof is server-path and dedupe logic based.
- Real Google Calendar / Meet end-to-end proof under live external conditions is still separate from code-level proof.
- Direct-active existing-user onboarding behavior remains a product-rule decision point.

---

## 11. Operational Cautions

1. **Clone is structure-only**
   - do not assume members/events/calendar links are copied

2. **External success differs from app success**
   - Gmail SMTP acceptance is not the same as inbox delivery
   - Google Calendar API success is not the same as attendee calendar visibility

3. **Reminder timing is hourly-window based**
   - it is designed to behave like a true ~24-hour reminder
   - but missed cron execution is still an operational risk

4. **Direct-active users**
   - some existing users may be added directly without a new invite email
   - treat this differently from brand-new invite-token users when operating manually

---

## 12. Recommended Admin Operating Sequence

### For a new batch from scratch
1. Create batch
2. Invite members
3. Verify assignments/sessions/events
4. Publish or configure communications as needed

### For a cloned batch
1. Clone structure
2. Review cloned assignments and sessions
3. Invite members immediately or review first
4. Validate company / targeting scope if needed
5. Check sessions/events/calendar setup before relying on live notifications

---

## 13. Quick Troubleshooting

### “User sees no batch”
- Check active batch membership
- Check selected batch context
- Check user status is active

### “Invite did not email”
- Check if the user was directly activated instead of invited
- Check SMTP env configuration
- Check whether the system returned an invite link

### “Session/Event exists but no Meet link”
- Check Google Calendar config
- Check event type / calendar sync path
- Check whether the item was cloned instead of newly created

### “Reminder did not send”
- Check if the assignment was actually inside the 23–24h window
- Check whether the founder had already submitted
- Check dedupe notification state
- Check cron execution and SMTP success
