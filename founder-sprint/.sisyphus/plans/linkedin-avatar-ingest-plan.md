# LinkedIn Avatar Ingest Plan

## TL;DR

> **Quick Summary**: Stop treating LinkedIn CDN avatar URLs as canonical profile images. Instead, ingest/copy eligible LinkedIn avatars into Supabase Storage, store the internal URL as the display source, and preserve custom uploaded images as the highest-priority source of truth.
>
> **Deliverables**:
> - Stable LinkedIn-avatar ingest pipeline into Supabase Storage
> - Explicit source-of-truth policy for uploaded vs provider-derived avatars
> - Safe migration path for existing LinkedIn-hosted `profileImage` values
> - Verification for login, reload, refresh, and fallback behavior
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves + final verification
> **Critical Path**: source classification → ingest service → auth/current-user integration → migration/verification

---

## Context

### Original Request
Build a plan to stabilize LinkedIn-derived profile images without damaging the architecture, by copying LinkedIn avatar images into Supabase Storage so the app renders internal URLs instead of raw LinkedIn CDN URLs.

### Interview Summary
**Key Discussions**:
- LinkedIn avatar URLs are going stale/dead and failing to render when users have no custom uploaded image.
- The app should not depend on external CDN avatar URLs as long-term display assets.
- User-uploaded profile images must never be overwritten by provider sync.
- Architecture should remain focused and not turn into a broad avatar-system rewrite.
- Login-time avatar handling should avoid noticeable latency where possible.

**Research Findings**:
- Current avatar rendering mostly trusts `profileImage` from DB directly.
- The right place to fix this is the data/source layer, not scattered UI fallbacks.
- Best-practice direction is provider URL → local storage copy → render local copy.

### Planning Notes (GPT direct)
**Main design decision**:
- Keep `profileImage` as the actual rendered image URL, but make its provider-derived value become a Supabase-hosted copy instead of a raw LinkedIn URL.

**Guardrail decisions**:
- Custom uploaded avatars always win.
- LinkedIn-derived avatars can be refreshed only when the current image is still provider-managed.
- No deletion attempts for non-Supabase URLs.
- Avoid broad schema redesign unless absolutely necessary.

---

## Work Objectives

### Core Objective
Replace fragile LinkedIn CDN hotlinks with an internal Supabase-hosted avatar pipeline while preserving current uploaded-avatar behavior and minimizing architectural churn.

### Concrete Deliverables
- A server-side LinkedIn-avatar ingest helper/service
- Deterministic source policy: uploaded avatar > ingested provider avatar > initials fallback
- Auth/current-user integration that seeds or refreshes LinkedIn avatars by ingesting them into Supabase Storage
- A safe migration strategy for existing LinkedIn-origin `profileImage` values
- Verified behavior across settings, nav, feed, messages, and profile pages

### Definition of Done
- [ ] Users with no custom upload no longer render raw LinkedIn CDN URLs as their long-term profile image
- [ ] LinkedIn avatar ingest stores a Supabase-hosted URL in `users.profileImage`
- [ ] Custom uploaded images are never overwritten by LinkedIn ingest/refresh
- [ ] Existing LinkedIn-origin users can be refreshed onto internal Supabase URLs
- [ ] Reloads and later logins keep profile images stable
- [ ] Broken/dead LinkedIn images no longer persist as canonical display state

### Must Have
- One clear ingest path for LinkedIn avatars
- A reliable way to distinguish provider-managed vs user-uploaded images
- Safe cleanup behavior for replaced internal provider copies if applicable
- Low-latency or low-impact login behavior

### Must NOT Have (Guardrails)
- No broad avatar-system rewrite across unrelated domains
- No overwriting of custom uploaded avatars
- No hard dependency on LinkedIn URL stability after ingest
- No deletion attempt for LinkedIn/external URLs
- No unrelated nav/menu/upload refactors bundled into this work

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — all verification is agent-executed after implementation.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after
- **Framework**: Playwright + direct DB/storage verification

### QA Policy
- **Server/DB**: verify `users.profileImage` transitions from LinkedIn URL → Supabase URL
- **Storage**: verify ingested objects land in the expected bucket/path
- **Auth/Login**: verify first-login seed and later refresh behavior
- **UI**: verify settings/nav/feed/profile render internal URLs consistently

---

## Execution Strategy

### Parallel Execution Waves

```text
Wave 1 (Source and ingest primitives)
├── Task 1: Avatar source classification helper
├── Task 2: LinkedIn avatar ingest service
├── Task 3: Internal URL cleanup/delete helper alignment

Wave 2 (Integration + migration)
├── Task 4: Auth callback ingest integration
├── Task 5: Current-user hydration ingest integration
├── Task 6: Existing LinkedIn-origin migration strategy
├── Task 7: UI/render consistency verification points

Wave FINAL
├── F1: Plan compliance audit
├── F2: Code quality review
├── F3: Real QA execution
└── F4: Scope fidelity check
```

### Dependency Matrix

- **1**: — → 2, 4, 5, 6
- **2**: 1 → 4, 5, 6, 7
- **3**: 1 → 2, 6
- **4**: 1, 2 → 7
- **5**: 1, 2 → 7
- **6**: 1, 2, 3 → FINAL
- **7**: 4, 5 → FINAL

### Agent Dispatch Summary

- **Wave 1**: T1 → `quick`, T2 → `deep`, T3 → `quick`
- **Wave 2**: T4 → `deep`, T5 → `deep`, T6 → `unspecified-high`, T7 → `visual-engineering`
- **FINAL**: F1 → `unspecified-high`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Avatar source classification helper

  **What to do**:
  - Introduce a focused helper that classifies `profileImage` values into at least these logical buckets:
    - empty
    - LinkedIn-origin external URL
    - Supabase-hosted uploaded/provider-ingested internal URL
    - other external URL
  - Keep this helper as the single source of truth for provider-vs-uploaded decisions.

  **Must NOT do**:
  - Do not add a DB enum/source column unless implementation proves it is necessary.
  - Do not duplicate hostname/path classification logic in multiple files.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 2, 4, 5, 6
  - **Blocked By**: None

  **References**:
  - `src/lib/linkedin-profile-image.ts`
  - `src/lib/storage-utils.ts`
  - `src/actions/profile.ts`

  **Acceptance Criteria**:
  - [ ] Helper identifies LinkedIn-origin URLs reliably
  - [ ] Helper distinguishes internal Supabase `profile-images` URLs from external URLs
  - [ ] Classification can be reused by ingest and cleanup logic

  **QA Scenarios**:
  ```
  Scenario: LinkedIn URL classification
    Tool: Bash/node
    Preconditions: Sample LinkedIn media URL and Supabase URL
    Steps:
      1. Pass each URL through the classifier.
      2. Assert classification output matches expected source type.
    Expected Result: LinkedIn vs internal vs external detection is correct.
    Evidence: .sisyphus/evidence/task-1-source-classification.txt
  ```

- [ ] 2. LinkedIn avatar ingest service

  **What to do**:
  - Build a server-side helper/service that:
    1. accepts an eligible LinkedIn avatar URL
    2. fetches the image server-side
    3. uploads it into Supabase `profile-images`
    4. returns the internal public URL/path
  - Ensure the helper is reusable by auth callback and current-user hydration logic.

  **Must NOT do**:
  - Do not block on unrelated profile form validation.
  - Do not directly expose raw LinkedIn URLs as the final stored profile image after ingest succeeds.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 4, 5, 6, 7
  - **Blocked By**: 1

  **References**:
  - `src/app/api/upload/route.ts`
  - `src/actions/profile.ts:updateProfileImage`
  - Supabase `profile-images` bucket conventions

  **Acceptance Criteria**:
  - [ ] Service stores a provider avatar copy in Supabase Storage
  - [ ] Service returns an internal URL/path suitable for DB persistence
  - [ ] Service handles fetch/upload failure explicitly

  **QA Scenarios**:
  ```
  Scenario: Provider avatar ingest succeeds
    Tool: Bash/Playwright
    Preconditions: Valid LinkedIn avatar URL available in auth metadata.
    Steps:
      1. Invoke ingest path for eligible user.
      2. Verify storage object exists in profile-images.
      3. Verify returned URL is internal Supabase-hosted URL.
    Expected Result: provider image is copied into internal storage.
    Evidence: .sisyphus/evidence/task-2-ingest-success.txt
  ```

- [ ] 3. Internal URL cleanup/delete helper alignment

  **What to do**:
  - Ensure cleanup logic understands provider-ingested internal images the same way it understands user-uploaded internal images.
  - Reuse or extend existing internal-path extraction helpers without creating duplicated storage delete logic.

  **Must NOT do**:
  - Do not delete any external LinkedIn URL.
  - Do not add cleanup behavior that can delete unrelated storage objects.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 6
  - **Blocked By**: 1

  **References**:
  - `src/lib/storage-utils.ts`
  - `src/actions/profile.ts:updateProfileImage`

  **Acceptance Criteria**:
  - [ ] Internal provider-copied avatars are eligible for safe cleanup on replace/remove
  - [ ] External URLs are never passed to delete logic

  **QA Scenarios**:
  ```
  Scenario: Old internal provider copy is cleanup-eligible
    Tool: Bash/node
    Preconditions: Existing internal profile-images URL from provider ingest.
    Steps:
      1. Pass URL through cleanup extraction helper.
      2. Assert storage path is returned.
    Expected Result: internal copies can be cleaned up safely.
    Evidence: .sisyphus/evidence/task-3-cleanup-path.txt
  ```

- [ ] 4. Auth callback ingest integration

  **What to do**:
  - Update the auth callback flow so eligible users do not store raw LinkedIn URLs as canonical display state.
  - For eligible cases, ingest the LinkedIn avatar and persist the internal Supabase URL to `users.profileImage`.

  **Must NOT do**:
  - Do not overwrite custom uploaded images.
  - Do not make login depend on a large synchronous delay if ingest can degrade gracefully.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 7
  - **Blocked By**: 1, 2

  **References**:
  - `src/app/(auth)/auth/callback/route.ts`
  - linked source classification + ingest service

  **Acceptance Criteria**:
  - [ ] First eligible login stores an internal Supabase avatar URL rather than a raw LinkedIn URL
  - [ ] Custom uploaded images remain unchanged

  **QA Scenarios**:
  ```
  Scenario: First login seeds internal avatar copy
    Tool: Bash/Playwright
    Preconditions: User has no custom uploaded image and auth metadata includes LinkedIn avatar URL.
    Steps:
      1. Complete login flow.
      2. Query DB `profileImage` value.
      3. Assert it is a Supabase-hosted profile-images URL.
    Expected Result: DB stores internal URL, not raw LinkedIn URL.
    Evidence: .sisyphus/evidence/task-4-auth-ingest.txt
  ```

- [ ] 5. Current-user hydration ingest integration

  **What to do**:
  - Update `getCurrentUser()` hydration behavior so LinkedIn-origin refresh, when needed, produces/uses an internal Supabase-hosted image rather than a raw external URL.
  - Keep this path safe and low-latency.

  **Must NOT do**:
  - Do not mutate custom uploaded images.
  - Do not create repeated redundant ingests on every request without gating.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 7
  - **Blocked By**: 1, 2

  **References**:
  - `src/lib/permissions.ts`
  - auth metadata access path

  **Acceptance Criteria**:
  - [ ] LinkedIn-origin refresh writes/uses internal URL
  - [ ] Non-LinkedIn uploaded images are preserved
  - [ ] Refresh path is gated to avoid unnecessary repeated work

  **QA Scenarios**:
  ```
  Scenario: Existing LinkedIn-origin avatar refreshes to internal copy
    Tool: Bash/Playwright
    Preconditions: User currently has provider-managed avatar state.
    Steps:
      1. Trigger current-user hydration flow.
      2. Query DB for updated profileImage.
      3. Assert result is internal Supabase URL.
    Expected Result: refresh lands on internal copy.
    Evidence: .sisyphus/evidence/task-5-hydration-refresh.txt
  ```

- [ ] 6. Existing LinkedIn-origin migration strategy

  **What to do**:
  - Define and implement the least risky path for users who already have LinkedIn-origin `profileImage` values in DB.
  - This can be login-time lazy migration, a one-time repair script, or a hybrid approach.

  **Must NOT do**:
  - Do not force a risky full-database migration without verification.
  - Do not block users with stale LinkedIn images from fallback rendering.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: FINAL
  - **Blocked By**: 1, 2, 3

  **References**:
  - existing `profileImage` DB values
  - current LinkedIn classification helper

  **Acceptance Criteria**:
  - [ ] Existing LinkedIn-origin users have a defined path to internal avatar stability
  - [ ] Migration strategy does not threaten custom uploaded avatars

  **QA Scenarios**:
  ```
  Scenario: Existing LinkedIn-origin user is repaired
    Tool: Bash/Playwright
    Preconditions: User row contains old LinkedIn-origin profileImage.
    Steps:
      1. Trigger the chosen migration path.
      2. Query DB after migration.
      3. Assert profileImage becomes an internal Supabase URL or safe null fallback.
    Expected Result: stale provider URL no longer remains canonical state.
    Evidence: .sisyphus/evidence/task-6-existing-user-repair.txt
  ```

- [ ] 7. UI/render consistency verification points

  **What to do**:
  - Verify key surfaces now render internal URLs consistently and do not depend on raw LinkedIn URLs.
  - Focus on settings, nav, feed, messages, and profile page.

  **Must NOT do**:
  - Do not broad-refactor every avatar component unless verification proves it is required.
  - Do not change unrelated visual behavior.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: ["frontend-design"]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: FINAL
  - **Blocked By**: 4, 5

  **References**:
  - `src/components/ui/Avatar.tsx`
  - `src/components/layout/Navbar.tsx`
  - `src/components/layout/BookfaceTopNav.tsx`
  - `src/components/bookface/PostCard.tsx`
  - `src/app/(dashboard)/settings/page.tsx`

  **Acceptance Criteria**:
  - [ ] Key surfaces render the internal profile image consistently
  - [ ] No key surface still depends on raw LinkedIn URL after ingest path succeeds

  **QA Scenarios**:
  ```
  Scenario: Internal avatar renders across key surfaces
    Tool: Playwright
    Preconditions: User has provider-derived internal Supabase avatar URL.
    Steps:
      1. Visit settings, feed, nav, messages, and profile page.
      2. Assert avatar image source is internal and renders consistently.
    Expected Result: no raw LinkedIn dependency remains on key surfaces.
    Evidence: .sisyphus/evidence/task-7-surface-consistency.png
  ```

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — verify internal-copy architecture is the implemented source-of-truth model.
- [ ] F2. **Code Quality Review** — verify no custom-upload overwrite regressions, no unsafe delete behavior, and no accidental broad refactors.
- [ ] F3. **Real QA** — verify first login seed, existing LinkedIn-origin repair, custom upload protection, reload stability, and fallback behavior.
- [ ] F4. **Scope Fidelity Check** — ensure only LinkedIn-avatar-ingest concerns were changed.

---

## Commit Strategy

- Prefer one commit for ingest/classification/server logic and one commit for integration/verification adjustments if separation remains clean.

## Success Criteria

### Verification Commands
```bash
# Expected: eligible LinkedIn-derived users end up with internal Supabase-hosted profileImage URLs
# Expected: uploaded avatars are never overwritten
# Expected: stale LinkedIn CDN URLs are no longer canonical display state
```

### Final Checklist
- [ ] Internal Supabase copy becomes canonical display avatar for LinkedIn-derived users
- [ ] Uploaded avatars remain the highest-priority source of truth
- [ ] Existing stale LinkedIn URLs have a repair path
- [ ] No unrelated architecture was disturbed
