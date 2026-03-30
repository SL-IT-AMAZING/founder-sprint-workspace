# Profile Image Lifecycle Fix

## TL;DR

> **Quick Summary**: Stabilize profile-image behavior so LinkedIn only seeds the initial image, uploaded images persist reliably, and old Supabase-hosted images are safely cleaned up on replace/remove.
>
> **Deliverables**:
> - Reliable profile-image upload and persistence flow
> - Auth/current-user guard that stops overwriting custom images while allowing LinkedIn-only refresh
> - Safe cleanup logic for old Supabase-hosted profile images
> - Verification coverage for upload, replace, remove, reload, and login behavior
>
> **Estimated Effort**: Short
> **Parallel Execution**: YES - 2 main waves + final verification
> **Critical Path**: Auth seeding guard → image persistence path → cleanup logic → verification

---

## Context

### Original Request
Fix the profile-image behavior so LinkedIn only provides the initial profile picture, and after users upload/change/remove a profile image it behaves like a normal uploaded asset that persists across reloads.

### Interview Summary
**Key Discussions**:
- The current upload flow appears to succeed, but reload still shows the old/broken LinkedIn image.
- The desired behavior is standard product behavior: initial LinkedIn seed, then user-managed uploads thereafter.
- Cleanup of abandoned Supabase-hosted files should be considered when replacing/removing images.

**Research Findings**:
- Storage upload works, but DB state remains on the old LinkedIn URL.
- Auth callback currently risks overwriting custom images on later logins.
- Current profile-image save path is fragile because upload and DB persistence are separated.
- Current-user hydration logic can also overwrite custom images with stale LinkedIn avatar URLs.

### Metis Review
**Identified Gaps** (addressed):
- Explicitly guard LinkedIn seeding to first-time/empty-image cases only.
- Lock cleanup logic to Supabase-hosted `profile-images` URLs only.
- Add acceptance criteria for reload persistence, replace/remove behavior, and login behavior.
- Avoid scope creep into unrelated menu/layout/upload systems.

---

## Work Objectives

### Core Objective
Make profile images deterministic and trustworthy: a user-uploaded image must persist across reloads and future logins, while LinkedIn only seeds the first image when no custom image exists.

### Concrete Deliverables
- A reliable server-controlled profile-image persistence path
- Auth/current-user logic that refreshes LinkedIn-sourced images safely while never overwriting custom uploaded images
- Replace/remove logic that safely cleans up old Supabase-hosted profile image files
- Verified behavior across settings, feed/avatar render points, and subsequent logins

### Definition of Done
- [ ] Uploading a profile image changes `users.profileImage` to a Supabase-hosted URL
- [ ] Reloading `/settings` keeps the uploaded image visible
- [ ] Re-login does not overwrite the uploaded image with LinkedIn data
- [ ] Re-login may refresh LinkedIn-sourced images only when the current image is still LinkedIn-based
- [ ] Removing the image clears DB state and returns to default avatar behavior
- [ ] Replacing/removing a Supabase-hosted profile image attempts safe cleanup of the old file

### Must Have
- One authoritative persistence path for profile-image updates
- Safe distinction between external URLs and Supabase-hosted image URLs
- No silent overwrite of custom images from OAuth callback or current-user hydration

### Must NOT Have (Guardrails)
- No deletion attempt for LinkedIn/external URLs
- No changes to unrelated desktop/mobile nav behavior
- No refactor of unrelated upload buckets or unrelated settings sections
- No historical orphan-file migration in this plan

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — all verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after
- **Framework**: Playwright + existing app verification

### QA Policy
Every task includes agent-executed QA scenarios. Evidence should be captured under `.sisyphus/evidence/`.

- **Frontend/UI**: Browser-based verification of upload, preview, reload, remove, and avatar display
- **Server/DB**: Direct verification of `users.profileImage` transitions and cleanup-safe logic
- **Auth/Login**: Verification that later logins do not overwrite custom images

---

## Execution Strategy

### Parallel Execution Waves

```text
Wave 1 (Start Immediately — source-of-truth fixes)
├── Task 1: Auth callback seeding guard
├── Task 2: Profile-image persistence path hardening
├── Task 3: Supabase URL classification + path extraction helper

Wave 2 (After Wave 1 — lifecycle behavior)
├── Task 4: Replace/remove cleanup logic
├── Task 5: Settings UI integration and state consistency
├── Task 6: Cross-surface avatar verification points

Wave FINAL
├── F1: Plan compliance audit
├── F2: Code quality review
├── F3: Real QA execution
└── F4: Scope fidelity check
```

### Dependency Matrix

- **1**: — → 5, 6
- **2**: — → 4, 5, 6
- **3**: — → 4
- **4**: 2, 3 → 6
- **5**: 1, 2 → 6
- **6**: 1, 2, 4, 5 → FINAL

### Agent Dispatch Summary

- **Wave 1**: T1 → `quick`, T2 → `deep`, T3 → `quick`
- **Wave 2**: T4 → `deep`, T5 → `visual-engineering`, T6 → `unspecified-high`
- **FINAL**: F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Auth/cached-user LinkedIn seeding and refresh guard

  **What to do**:
  - Change the OAuth callback and current-user hydration profile-image logic so LinkedIn avatar seeding/refresh happens only when the user has no current profile image or the current image is still LinkedIn-sourced.
  - Preserve existing LinkedIn-first-login behavior, allow login-time refresh for LinkedIn-based images, and stop all later overwrites of custom uploaded images.

  **Must NOT do**:
  - Do not overwrite any non-empty `profileImage` with LinkedIn data.
  - Do not add a new DB column just to track image source.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: tightly scoped auth guard logic in one flow.
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `git-master`: not needed for implementation planning details.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 5, 6
  - **Blocked By**: None

  **References**:
  - `src/app/(auth)/auth/callback/route.ts` - current LinkedIn avatar seeding logic that must stop overwriting custom images.
  - `src/lib/permissions.ts` - current-user hydration path that can also overwrite profile images.
  - `src/actions/profile.ts:updateProfileImage` - target state this callback must respect.

  **Acceptance Criteria**:
  - [ ] First login with empty `profileImage` seeds from LinkedIn metadata.
  - [ ] Subsequent login with a custom uploaded image leaves `profileImage` unchanged.
  - [ ] Subsequent login with a LinkedIn-sourced image may refresh it to the latest LinkedIn URL.

  **QA Scenarios**:
  ```
  Scenario: First-time seed only
    Tool: Bash (app verification + DB check)
    Preconditions: Test user with null profileImage and LinkedIn avatar metadata available
    Steps:
      1. Complete auth callback flow for the test user.
      2. Query resulting user row.
      3. Assert profileImage is populated.
    Expected Result: profileImage is set from LinkedIn only when previously empty.
    Evidence: .sisyphus/evidence/task-1-first-seed.txt

  Scenario: Existing custom image preserved
    Tool: Bash (app verification + DB check)
    Preconditions: Test user has Supabase-hosted custom profileImage.
    Steps:
      1. Complete auth callback flow again.
      2. Query resulting user row.
      3. Assert profileImage remains the existing Supabase URL.
    Expected Result: no overwrite occurs.
    Evidence: .sisyphus/evidence/task-1-preserve-custom.txt

  Scenario: LinkedIn image auto-refreshes on login
    Tool: Bash (app verification + DB check)
    Preconditions: Test user has LinkedIn-sourced profileImage and a newer LinkedIn avatar URL is available.
    Steps:
      1. Complete login/current-user hydration flow.
      2. Query resulting user row.
      3. Assert profileImage updates to the newer LinkedIn URL.
    Expected Result: LinkedIn-origin images refresh, custom images do not.
    Evidence: .sisyphus/evidence/task-1-linkedin-refresh.txt
  ```

- [x] 2. Profile-image persistence path hardening

  **What to do**:
  - Replace the fragile multi-step client persistence behavior with one authoritative server-side persistence path for profile-image updates.
  - Ensure upload success and DB update are coordinated, with explicit success/failure handling.

  **Must NOT do**:
  - Do not leave fire-and-forget profile-image saves.
  - Do not require unrelated form fields to pass just to persist an uploaded image.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: this is the core lifecycle/persistence fix across UI, upload, and DB boundaries.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 4, 5, 6
  - **Blocked By**: None

  **References**:
  - `src/app/(dashboard)/settings/ProfileForm.tsx` - current upload/crop/save interaction.
  - `src/app/api/upload/route.ts` - current storage upload endpoint.
  - `src/actions/profile.ts:updateExtendedProfile` - current broad form update path.
  - `src/actions/profile.ts:updateProfileImage` - narrow profile-image persistence path.

  **Acceptance Criteria**:
  - [ ] Uploading a profile image updates DB state without depending on unrelated form validation.
  - [ ] A hard reload of `/settings` shows the uploaded image from DB state.

  **QA Scenarios**:
  ```
  Scenario: Upload persists across reload
    Tool: Playwright
    Preconditions: Logged-in user on /settings with editable profile.
    Steps:
      1. Open profile image editor.
      2. Upload a valid JPEG/PNG/WebP file and apply crop.
      3. Reload the page with a hard refresh.
      4. Assert the same uploaded image is still rendered in the profile avatar.
    Expected Result: uploaded image remains after reload.
    Evidence: .sisyphus/evidence/task-2-reload-persistence.png

  Scenario: Save path failure is not silent
    Tool: Bash/Playwright
    Preconditions: Simulate server-side failure in persistence path.
    Steps:
      1. Attempt profile image upload.
      2. Observe response and UI state.
      3. Assert no false-success state persists.
    Expected Result: user sees failure and DB state remains unchanged.
    Evidence: .sisyphus/evidence/task-2-save-failure.txt
  ```

- [x] 3. Supabase URL classification and path extraction helper

  **What to do**:
  - Add a dedicated helper that detects whether a profile image belongs to the `profile-images` bucket and extracts the storage path safely.
  - Use this helper as the only gate for cleanup behavior.

  **Must NOT do**:
  - Do not attempt string deletion on arbitrary third-party URLs.
  - Do not duplicate path parsing logic in multiple files.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: focused helper logic with strong guardrails.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 4
  - **Blocked By**: None

  **References**:
  - `src/app/api/upload/route.ts` - current public URL generation format.
  - Supabase public URL structure for storage objects - needed to derive object path safely.

  **Acceptance Criteria**:
  - [ ] Helper returns a valid object path for Supabase-hosted `profile-images` URLs.
  - [ ] Helper returns null/none for LinkedIn or external URLs.

  **QA Scenarios**:
  ```
  Scenario: Internal Supabase URL recognized
    Tool: Bash/node
    Preconditions: Example public URL from profile-images bucket.
    Steps:
      1. Pass URL into helper.
      2. Assert extracted path matches stored object path.
    Expected Result: valid path returned.
    Evidence: .sisyphus/evidence/task-3-internal-url.txt

  Scenario: External URL rejected
    Tool: Bash/node
    Preconditions: LinkedIn CDN avatar URL.
    Steps:
      1. Pass LinkedIn URL into helper.
      2. Assert no deletion path is returned.
    Expected Result: cleanup gate blocks deletion.
    Evidence: .sisyphus/evidence/task-3-external-url.txt
  ```

- [x] 4. Replace/remove cleanup logic

  **What to do**:
  - Implement safe cleanup of the old Supabase-hosted profile image when a new custom image replaces it or when the image is removed.
  - Make storage cleanup soft-fail: log problems, but do not block the user-visible profile-image update once DB state is correct.

  **Must NOT do**:
  - Do not delete LinkedIn/external URLs.
  - Do not fail the whole mutation solely because old-file cleanup failed.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: lifecycle transition logic plus deletion safety needs careful sequencing.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 6
  - **Blocked By**: 2, 3

  **References**:
  - `src/actions/profile.ts:updateProfileImage` - likely home for DB update and cleanup coordination.
  - `src/app/api/upload/route.ts` - source of the persisted public URL format.
  - `profile-images` bucket object naming pattern - required for delete operations.

  **Acceptance Criteria**:
  - [ ] Replacing a Supabase-hosted profile image updates DB and attempts deletion of the old storage object.
  - [ ] Removing a Supabase-hosted profile image sets DB to null and attempts deletion of the old storage object.
  - [ ] External URLs are never passed to storage delete.

  **QA Scenarios**:
  ```
  Scenario: Replace uploaded image cleans up old file
    Tool: Playwright + Bash verification
    Preconditions: User already has a Supabase-hosted profile image.
    Steps:
      1. Upload and apply a second profile image.
      2. Query DB for new profileImage URL.
      3. Verify old object path no longer exists in storage or delete was attempted and logged safely.
    Expected Result: DB points to new image; old internal image is cleaned up safely.
    Evidence: .sisyphus/evidence/task-4-replace-cleanup.txt

  Scenario: Remove image does not try deleting LinkedIn URL
    Tool: Bash/node
    Preconditions: User profileImage is an external LinkedIn URL.
    Steps:
      1. Remove profile image.
      2. Inspect delete gate logic/result.
      3. Assert no storage delete is attempted.
    Expected Result: DB becomes null and no external delete attempt occurs.
    Evidence: .sisyphus/evidence/task-4-remove-external.txt
  ```

- [x] 5. Settings UI integration and state consistency

  **What to do**:
  - Make the settings UI reflect the authoritative server result after upload/remove.
  - Eliminate confusing local-state mismatches after cancel/reload, especially around the profile-image section.

  **Must NOT do**:
  - Do not leave the UI showing a preview that does not match DB state.
  - Do not keep separate shadow states that survive after cancel/save incorrectly.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: user-facing settings UX consistency and edit-state behavior.
  - **Skills**: ["frontend-design"]
    - `frontend-design`: useful for polished, clear settings UX around image change/remove interactions.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 6
  - **Blocked By**: 1, 2

  **References**:
  - `src/app/(dashboard)/settings/ProfileForm.tsx` - current section edit/cancel/save behavior.
  - `src/app/(dashboard)/settings/page.tsx` - header avatar and initial data sourcing.
  - `src/components/ui/Avatar.tsx` - final avatar display behavior and fallback rendering.

  **Acceptance Criteria**:
  - [ ] After upload, the UI and DB state remain aligned across refreshes.
  - [ ] Remove immediately reflects null/default avatar state.
  - [ ] Cancel does not create a misleading preview/DB mismatch.

  **QA Scenarios**:
  ```
  Scenario: UI remains consistent after upload and reload
    Tool: Playwright
    Preconditions: Logged-in user on /settings.
    Steps:
      1. Upload and apply a profile image.
      2. Confirm avatar updates in settings header and profile section.
      3. Reload page.
      4. Confirm same avatar remains visible in both places.
    Expected Result: no reset, no broken LinkedIn fallback, no stale preview.
    Evidence: .sisyphus/evidence/task-5-ui-consistency.png

  Scenario: Cancel does not lie about saved state
    Tool: Playwright
    Preconditions: Profile image editor open with modified image state.
    Steps:
      1. Trigger an image change path.
      2. Cancel out of the section if cancellation is supported in-flow.
      3. Compare rendered avatar with persisted DB-backed state after reload.
    Expected Result: rendered state matches persisted state.
    Evidence: .sisyphus/evidence/task-5-cancel-state.txt
  ```

- [x] 6. Cross-surface avatar verification points

  **What to do**:
  - Verify all key avatar consumers read the updated DB-backed profile image correctly.
  - Focus on settings header, feed/profile surfaces, and any current-user tagged reads.

  **Must NOT do**:
  - Do not expand into a full avatar-system refactor.
  - Do not modify unrelated surfaces unless they are broken by the fix.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: multi-surface verification across cache/read paths.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: FINAL
  - **Blocked By**: 1, 2, 4, 5

  **References**:
  - `src/app/(dashboard)/settings/page.tsx` - current settings header avatar.
  - `src/components/ui/Avatar.tsx` - shared rendering behavior.
  - `src/actions/profile.ts` revalidation paths/tags - cache invalidation coverage.

  **Acceptance Criteria**:
  - [ ] Updated profile image appears consistently wherever current user avatar is rendered.
  - [ ] Revalidation is sufficient to prevent stale current-user avatar data.

  **QA Scenarios**:
  ```
  Scenario: Updated avatar appears across key surfaces
    Tool: Playwright
    Preconditions: User has just uploaded a new profile image.
    Steps:
      1. Verify settings header avatar.
      2. Navigate to another surface using current-user avatar (feed/profile if applicable).
      3. Assert the same image is rendered.
    Expected Result: all key surfaces show the updated image.
    Evidence: .sisyphus/evidence/task-6-cross-surface.png

  Scenario: Stale cache does not restore old LinkedIn image
    Tool: Playwright + Bash
    Preconditions: Custom uploaded image already persisted.
    Steps:
      1. Reload page and revisit settings/feed.
      2. Assert old LinkedIn URL is not rendered.
    Expected Result: stale data does not reappear.
    Evidence: .sisyphus/evidence/task-6-no-stale-linkedin.txt
  ```

---

## Final Verification Wave

> Run after all implementation tasks complete.

- [x] F1. **Plan Compliance Audit** — verify the implementation follows the intended lifecycle: initial LinkedIn seed only, persistent upload, safe cleanup, and no unrelated changes.
- [x] F2. **Code Quality Review** — verify no broken promise handling, no unsafe delete logic for third-party URLs, and no regressions in settings/auth/upload code.
- [x] F3. **Real QA** — upload image, reload, remove image, replace image, and validate subsequent login behavior.
- [x] F4. **Scope Fidelity Check** — ensure only profile-image lifecycle concerns were changed.

---

## Commit Strategy

- Prefer one focused commit for lifecycle logic and one focused commit for UI/integration only if separation remains clean.

## Success Criteria

### Verification Commands
```bash
# Expected: uploaded image persists and DB value changes from LinkedIn URL to Supabase URL
# Expected: removal sets profileImage to null
# Expected: later login does not overwrite custom image
```

### Final Checklist
- [ ] LinkedIn seeding only happens when profile image is empty
- [ ] LinkedIn-origin images can refresh on login without touching custom uploaded images
- [ ] Uploaded profile images persist across hard reload
- [ ] Replace/remove handles old Supabase files safely
- [ ] Third-party URLs are never deleted
- [ ] No unrelated systems were changed
