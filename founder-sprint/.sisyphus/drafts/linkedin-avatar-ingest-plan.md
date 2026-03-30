# Draft: LinkedIn Avatar Ingest Plan

## Requirements (confirmed)
- Stop relying on raw LinkedIn CDN profile image URLs for long-term rendering.
- Keep architecture stable and avoid broad refactors.
- Import/copy LinkedIn avatar into Supabase Storage so app renders an internal stable URL.
- Preserve custom uploaded images and never overwrite them with provider data.
- Minimize user-facing latency; prefer non-blocking or low-impact ingest behavior.

## Technical Decisions
- Treat provider avatar URLs as transient inputs, not canonical display assets.
- Keep uploaded avatars as the highest-priority source of truth.
- Favor a targeted ingest pipeline over changing all rendering surfaces.

## Research Findings
- LinkedIn-hosted avatar URLs can expire or become stale.
- Current app still has multiple profileImage write/read paths, making external hotlinks brittle.
- Best-practice direction is provider URL → local storage copy → render local copy.

## Open Questions
- None blocking for plan generation.

## Scope Boundaries
- INCLUDE: LinkedIn avatar ingestion architecture, source-of-truth policy, migration/refresh strategy, verification.
- EXCLUDE: unrelated nav/menu work, unrelated upload buckets, broad avatar-system redesign beyond what the ingest path needs.
