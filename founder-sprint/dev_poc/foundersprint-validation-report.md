# FounderSprint Validation Report

## Scope Covered
This report covers the modified FounderSprint flows for:
- batch clone
- post-clone invite handoff
- source-batch member preload
- onboarding digest trigger path
- assignment 24-hour reminder path
- strengthened admin batch browser access check

---

## Evidence Summary

### Static / build verification
- `npm run build` → PASS
- Diagnostics clean on changed files:
  - `src/actions/batch.ts`
  - `src/actions/user-management.ts`
  - `src/app/(auth)/auth/callback/route.ts`
  - `src/app/(dashboard)/admin/batches/BatchList.tsx`
  - `src/app/(dashboard)/admin/users/UserManagement.tsx`
  - `src/lib/email.ts`
  - `src/app/api/batch/select/route.ts`
  - `src/app/api/cron/deadline-reminders/route.ts`
  - `e2e/global-setup.ts`
  - `e2e/batch.spec.ts`
  - `e2e/batch-clone-flow.spec.ts`

### Runtime verification
- Reminder route sent a controlled test email successfully (`sent: 1`) to `slit.amazing@gmail.com`
- Reminder 23–24h window was verified with temporary assignments:
  - 23.5h due → selected
  - 22h due → not selected
  - 25.5h due → not selected
- Temporary assignments were deleted after verification
- Live company-targeted **virtual event** proof succeeded under KST 2026-04-10 04:00–04:30:
  - `googleEventId` stored
  - `googleMeetLink` stored
  - organizer calendar event existed with `conferenceStatus=success`
  - attendees were limited to `test-admin@example.com` + `slit.amazing@gmail.com`
  - organizer calendar preserved `Asia/Seoul` and `2026-04-10T04:00:00+09:00`
- Live company-targeted **session** proof succeeded under KST 2026-04-10 05:00–05:30:
  - `googleEventId` stored
  - organizer calendar event existed
  - attendees were limited to `test-admin@example.com` + `slit.amazing@gmail.com`
  - organizer calendar preserved `Asia/Seoul` and `2026-04-10T05:00:00+09:00`

### Browser / E2E verification
- `e2e/batch.spec.ts` strengthened so it now fails on the `Not Part of Any Batch` false-positive screen
- `e2e/batch.spec.ts -g "admin can view batches page"` → PASS
- `e2e/batch-clone-flow.spec.ts` → PASS

What `e2e/batch-clone-flow.spec.ts` now proves:
1. Admin can create a source batch from the UI
2. Source batch can be enriched with founder + mentor + assignment + session state for clone testing
3. Clone success modal appears and shows clone metadata
4. `Close` dismisses the success modal and leaves the cloned batch visible
5. `Invite Members Now` routes into `/admin/users?...&openInvite=1`
6. Invite modal auto-opens
7. Source-batch preload is visible with the expected seeded members
8. `Invite Selected Members` actually executes
9. Result summary follows the simplified UI model
10. Actual target-batch memberships are verified in the database
11. Current business rule is respected: cloning user is already in the cloned batch, so preload invite results in `2 invited / 1 skipped`
12. `Review Batch First` routes to `/admin/users?batchId=...` without reopening the modal
13. Safe fallback route `/admin/users?openInvite=1` shows the generic invite UI without source preload

---

## Important Findings

### Real bugs caught and fixed during validation
1. **False-positive batch smoke test**
   - The old smoke test passed even on the `Not Part of Any Batch` screen because the page heading still contained the word `Batch`.
   - Fixed by asserting the no-batch screen is absent and a real batch card is visible.

2. **Playwright bootstrap role mismatch**
   - Seeded admin/mentor users had active batch memberships but were effectively still founders because `getCurrentUser()` prioritizes `user.global_role`.
   - Fixed by updating `e2e/global-setup.ts` so seeded users are set to the correct global roles and active status.

3. **Clone preload invite expectation mismatch**
   - The first test expected `3 invited / 0 skipped`, but real behavior is `2 invited / 1 skipped` because the cloning admin is already auto-added to the cloned batch.
   - Test was corrected to match the intended business rule.

### Intended limitations still present
- Direct-active existing users are handled differently from invite-token acceptance users.
- Recipient-side inbox / recipient-side calendar visibility is still separate from organizer/API proof.
- Cloned sessions do not carry `googleEventId` or existing Meet links.

---

## External Integration Status

### Gmail / SMTP
- Controlled live reminder email path was proven to send successfully after env cleanup.
- This is code-path + SMTP acceptance proof.
- Inbox delivery should still be treated as external-system proof, not assumed from API success alone.

### Google Calendar / Meet
- Code paths were reviewed.
- Create/update logic exists.
- Organizer-side live proof was captured for both a company-targeted virtual event and a company-targeted session.
- Recipient-side inbox/calendar visibility is still not claimed without direct access to the recipient account.

---

## Completion Status

### Considered complete in this validation round
- FounderSprint validation for the changed clone/invite/onboarding/reminder code
- E2E coverage for the changed clone/invite flows
- Operator manual authored and aligned to the current validated state

### Still not claimed as fully proven externally
- Recipient-side Google Calendar visibility on the attendee account
- Recipient inbox delivery guarantees beyond the tested SMTP/API-send path


### Additional recipient-check-ready live proof
- A second **non-destructive** company-targeted virtual event proof was executed so the recipient can inspect the invite without immediate cancellation.
- Artifact: `dev_poc/foundersprint-live-event-proof-result.json`
- Event remains alive intentionally for recipient-side verification.
- Verified organizer-side facts from that run:
  - `googleEventId` = `4r3c36e857usihfb8nev4bbvc0`
  - `googleMeetLink` / `hangoutLink` = `https://meet.google.com/pdg-nhpo-oew`
  - attendees limited to `test-admin@example.com` + `slit.amazing@gmail.com`
  - start/end preserved as `2026-04-10T04:00:00+09:00` ~ `2026-04-10T04:30:00+09:00`
  - cleanup intentionally deferred until recipient-side confirmation


### Additional two-recipient organizer-side live proof
- A two-recipient non-destructive company-targeted virtual event proof was executed.
- Artifact: `dev_poc/foundersprint-live-two-recipient-event-proof-result.json`
- Verified organizer-side facts:
  - recipients: `slit.amazing@gmail.com`, `jgamer0914@gmail.com`
  - `googleEventId` = `00aat8goh98bpohq96hf1pndnc`
  - `googleMeetLink` / `hangoutLink` = `https://meet.google.com/bem-xwut-smv`
  - attendees limited to `test-admin@example.com` + the two recipient emails
  - start/end preserved as `2026-04-10T04:00:00+09:00` ~ `2026-04-10T04:30:00+09:00`
  - cleanup intentionally deferred until recipient-side confirmation
