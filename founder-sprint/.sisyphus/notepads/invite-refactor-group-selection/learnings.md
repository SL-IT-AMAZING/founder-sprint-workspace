## What worked well
- Extracting shared invite logic into `inviteUserCore` reduced duplication and kept single/bulk flows aligned.
- Keeping cache revalidation in callers made the core invite function reusable and side-effect scoped.
- Founder-capacity pre-check in bulk invites prevents avoidable partial failures for full-batch founder imports.

## What didn't work as expected
- Repository-level lint currently fails on many unrelated existing files, so full lint cannot be used as a clean signal for just this task.

## What I would do differently
- Add focused action-level tests for invite/group permissions so future refactors can be validated without relying on full-repo lint status.

## Gotchas for future reference
- `sendInvitationEmail` should accept optional invitee name because bulk invite and optional-name single invite can omit it.
- For user upserts in invite flows, update payload should be conditional (`name ? { name } : {}`) to avoid overwriting existing names with empty/undefined values.
- Founder self-selection requires batch-scoped group validation before switching group membership.
