# Draft: Founder Sprint Performance Diagnosis

## Requirements (confirmed)
- Fix ~1 second navigation latency on deployed Vercel site
- Site URL: https://founder-sprint.vercel.app
- Stack: Next.js 16, React 19, Supabase (Seoul), Prisma

## Research Findings

### Root Cause Analysis

**PRIMARY CAUSE: Cross-Pacific Serverless Function Region Mismatch**

| Current Setup | Impact |
|---------------|--------|
| Supabase DB: Seoul (ap-northeast-2) | ✅ Correct for Korean users |
| Vercel Functions: US East (default) | ❌ ~300-400ms round-trip per DB call |
| No `vercel.json` exists | Confirms US East default |

**Evidence Found:**
1. No `vercel.json` file exists → defaults to US East (iad1)
2. No region config in any Server Action
3. No Edge runtime directives anywhere
4. Prisma uses direct PostgreSQL connection (no pooling)

### Code Pattern Analysis

**Good Patterns Found:**
- `Promise.all()` used in Dashboard and Feed pages for parallel queries
- `cache()` from React used in `getCurrentUser()` to deduplicate

**Concerning Patterns:**
- Dashboard layout calls `supabase.auth.getUser()` + `getCurrentUser()` sequentially (2 round trips)
- Every page calls `getCurrentUser()` which does: Supabase auth → Prisma query (2 DB calls)
- Multiple `revalidatePath()` calls after mutations

**Latency Breakdown (Estimated per Page):**
```
Dashboard Layout:
  └── supabase.auth.getUser()      → 300ms (US→Seoul→US)
  └── getCurrentUser() [cached]     → 300ms (US→Seoul→US)
  
Dashboard Page:
  └── getCurrentUser()              → 0ms (cached)
  └── 9x Promise.all queries        → 300ms (parallel, but US→Seoul→US)

Total: ~600-900ms for Dashboard
```

### Available Solutions

**Solution 1: vercel.json Region Configuration (HIGHEST IMPACT)**
- Set `"regions": ["icn1"]` for Seoul
- Reduces each DB call from ~300ms to ~10ms
- Expected improvement: 80-90% latency reduction

**Solution 2: Edge Runtime for Auth**
- Add `export const runtime = 'edge'` to middleware
- But: Prisma doesn't support Edge runtime (needs Node.js)
- Partial solution only

**Solution 3: Connection Pooling with Supabase**
- Use Supabase pooler endpoint instead of direct connection
- Reduces connection establishment overhead

## Open Questions
- Does the team want to migrate ALL functions to Seoul, or just critical paths?
- Any reason NOT to use Seoul region? (cost, other user locations?)
- Is Vercel Pro/Enterprise available? (needed for custom regions)

## Scope Boundaries
- INCLUDE: Region configuration, connection optimization
- EXCLUDE: Frontend performance (React rendering, bundle size)
- EXCLUDE: Database schema optimization

## Test Strategy Decision
- **Infrastructure exists**: NO automated tests found
- **Verification approach**: Manual verification with network timing
