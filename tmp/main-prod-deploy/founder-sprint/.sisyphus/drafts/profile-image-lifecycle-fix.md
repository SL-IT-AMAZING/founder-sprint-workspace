# Draft: Profile Image Lifecycle Fix

## Requirements (confirmed)
- LinkedIn profile image should only seed the initial profile image.
- After a user uploads a custom profile image, it should behave like a normal uploaded image and persist across reloads.
- Replacing or removing a custom image should support cleanup of old Supabase-hosted files.
- LinkedIn/external URLs must never be deleted from storage cleanup logic.
- Upload + persistence behavior should be reliable and not depend on fragile client-side multi-step flows.
- LinkedIn-based profile images should auto-refresh on login when the stored image is still LinkedIn-sourced.
- Custom uploaded profile images must never be auto-refreshed from LinkedIn.

## Technical Decisions
- Move toward a single server-controlled persistence path for profile-image state.
- Prevent auth callback from overwriting custom images on later logins.
- Treat Supabase-hosted `profile-images` URLs as deletable assets; treat non-Supabase URLs as non-deletable.
- Allow login-time refresh only for LinkedIn-origin profile images; keep custom uploaded images untouched.

## Research Findings
- Current DB still stores LinkedIn URL, proving uploaded image persistence is disconnected from DB state.
- Storage buckets exist and direct storage upload works.
- Current auth callback logic can overwrite profile images repeatedly because it checks inequality instead of emptiness.
- Current client-side save path for profile image has fragile promise handling and can silently fail.

## Open Questions
- None blocking for plan generation.

## Scope Boundaries
- INCLUDE: profile image lifecycle, auth seeding rule, upload persistence, remove/replace cleanup, verification.
- EXCLUDE: desktop hamburger/menu issues, unrelated upload flows, historical orphan migration, broad settings refactor.
