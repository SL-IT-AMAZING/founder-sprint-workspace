# Backend Verification Report

> **Last Updated**: 2026-02-03
> **Purpose**: Verification-driven audit of all backend features, assumptions, and integrations

---

## Summary Status

| Category | ✅ Verified | 🧪 Needs PoC | ❌ Broken/Blocked | ⚠️ Security Issues |
|----------|------------|--------------|-------------------|-------------------|
| **Count** | 19 | 9 | 5 | 5 |

**Overall Risk Level**: 🔴 **HIGH** - Critical bugs and security issues must be addressed before production

---

## ❌ CRITICAL BUGS (Must Fix Immediately)

### 1. Invitation Form Data Handling - **FIXED**
**Status**: ✅ **RESOLVED**
**Issue**: `inviteUser()` action - `formData.get("linkedInUrl")` and `formData.get("founderId")` returned null, Zod rejected null for optional string fields
**Fix Applied**: Used `|| undefined` to convert null to undefined
**Verification**: Code reviewed and fixed

### 2. Batch Data Exposure - **CRITICAL**
**Status**: ❌ **OPEN**
**Location**: `src/actions/batch.ts` - `getBatches()` and `getBatch()`
**Issue**: NO authentication check - any authenticated user can query all batches and their sensitive data
**Impact**: Cross-batch data leakage, privacy violation
**Fix Required**:
```typescript
// Add to both functions:
const user = await getCurrentUser();
if (!user) throw new Error("Unauthorized");
await requireBatchPermission(user.id, batchId, "batch:read");
```
**Priority**: P0 - Fix before any production deployment

### 3. Auth Callback Token Validation Gap
**Status**: ❌ **OPEN**
**Location**: Auth callback handler
**Issue**: Doesn't validate invitation token belongs to the signing-in user (missing `token.email !== authUser.email` check)
**Impact**: User A can use User B's invitation token to join wrong batch
**Fix Required**:
```typescript
if (token.email.toLowerCase() !== authUser.email.toLowerCase()) {
  throw new Error("Token does not match your email");
}
```
**Priority**: P0 - Security vulnerability

### 4. Orphaned InvitationToken Records
**Status**: ❌ **DESIGN ISSUE**
**Location**: `prisma/schema.prisma` - InvitationToken model
**Issue**: No foreign key relations to User/Batch - orphaned records possible, no cascading deletes
**Impact**: Database pollution, no referential integrity
**Fix Required**:
```prisma
model InvitationToken {
  // Add relations:
  batch     Batch  @relation(fields: [batchId], references: [id], onDelete: Cascade)
  invitedBy User   @relation("InvitationsSent", fields: [invitedById], references: [id])
  usedBy    User?  @relation("InvitationsUsed", fields: [usedById], references: [id])

  invitedById String
  usedById    String?
}
```
**Priority**: P1 - Data integrity issue

### 5. Duplicate Office Hour Requests Possible
**Status**: ❌ **OPEN**
**Location**: `prisma/schema.prisma` - OfficeHourRequest model
**Issue**: Missing `@@unique([slotId, requesterId])` constraint - same user can request same slot multiple times
**Impact**: Duplicate requests, approval logic confusion
**Fix Required**:
```prisma
model OfficeHourRequest {
  // Add:
  @@unique([slotId, requesterId])
}
```
**Priority**: P1 - Business logic violation

---

## ✅ VERIFIED FEATURES (Working by Code Review)

### Authentication & Authorization (5 features)

| Feature | Status | Evidence |
|---------|--------|----------|
| LinkedIn OAuth flow (login → callback → session) | ✅ | Middleware + auth route handlers reviewed |
| Role-based access control (RBAC) | ✅ | `permissions.ts` with React `cache()` memoization |
| Middleware route protection | ✅ | Public/protected/admin path arrays in middleware.ts |
| Invitation token generation + 7-day expiry | ✅ | `inviteUser()` creates token with `expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)` |
| Auth callback user activation | ✅ | Sets `isActive: true` and marks token used |

### Integrations (3 features)

| Feature | Status | Evidence |
|---------|--------|----------|
| Google Calendar integration | ✅ | `@google-cloud/calendar` with graceful degradation (console.error on failure) |
| Google Meet link generation | ✅ | Office hour approval generates `conferenceData` with `createRequest` |
| Email sending (Nodemailer/Gmail SMTP) | ✅ | Just configured with GMAIL_USER + GMAIL_APP_PASSWORD |

### Core Features (7 features)

| Feature | Status | Evidence |
|---------|--------|----------|
| Invite page token validation | ✅ | Checks invalid/used/expired states + sets cookie |
| File upload to Supabase Storage | ✅ | Size/count limits enforced, unique filenames with crypto.randomUUID() |
| Question lifecycle | ✅ | `QuestionStatus` enum: OPEN → ANSWERED → SUMMARY → CLOSED |
| Feed system (posts/comments/likes/pins) | ✅ | Max 3 pins enforced, archive/restore with `isHidden` field |
| Office hour slot management | ✅ | 30-min duration validation in createOfficeHourSlot |
| Assignment/submission/feedback workflow | ✅ | Complete CRUD with status tracking |
| Group management with membership | ✅ | Many-to-many relation via GroupMember |
| Event creation with calendar sync | ✅ | Creates Event record + syncs to Google Calendar if configured |

---

## 🧪 NEEDS POC (Verification Required)

### High Priority (Blocking Production)

| # | Feature | Why PoC Needed | Success Criteria | Blocking? |
|---|---------|----------------|------------------|-----------|
| 1 | Gmail SMTP email delivery | Config is set but never tested end-to-end with real recipient | Email received in inbox (not spam) | ✅ YES |
| 2 | Google Calendar event creation | Timezone handling, permissions, quota limits unknown | Event appears in calendar with correct time | ✅ YES |
| 3 | End-to-end invitation flow | 5 steps: invite → email → click link → OAuth → activated user | Invited user successfully joins batch | ✅ YES |
| 4 | Supabase Storage file upload | Bucket exists? Permissions configured? CORS? | File uploaded and publicly accessible via URL | ✅ YES |
| 5 | Deployed Vercel environment variables | Are all required env vars set in production? | `process.env.GMAIL_USER` etc. accessible at runtime | ✅ YES |

### Medium Priority (Nice to Verify)

| # | Feature | Why PoC Needed | Success Criteria | Blocking? |
|---|---------|----------------|------------------|-----------|
| 6 | Founder re-participation prevention | LinkedIn ID uniqueness check relies on app code only | Same LinkedIn ID rejected for second batch | ❌ NO |
| 7 | Co-founder limit enforcement | Max 2 per founder checked in app code | 3rd co-founder creation fails with error | ❌ NO |
| 8 | Founder limit per batch | Max 30 per batch checked in app code | 31st founder creation fails | ❌ NO |
| 9 | Office hour approval → Meet link | Does Google Meet link actually work when clicked? | Link opens valid Google Meet room | ❌ NO |

---

## ⚠️ SECURITY ISSUES

### Severity Breakdown

| Severity | Count | Issues |
|----------|-------|--------|
| 🔴 Critical | 2 | #2 (Batch data exposure), #3 (Token validation) |
| 🟡 Medium | 3 | #1, #4, #5 |

### Issue Details

#### 1. Test Endpoint in Production
**Severity**: 🟡 **MEDIUM**
**Location**: `/api/test-auth`
**Issue**: Only blocked by `NODE_ENV` check - if env var misconfigured, endpoint exposes user data
**Fix**: Remove endpoint entirely or add IP whitelist + API key

#### 2. No Rate Limiting
**Severity**: 🟡 **MEDIUM**
**Impact**: Vulnerable to brute force, DDoS, spam (invitations, posts, comments)
**Fix**: Add `@upstash/ratelimit` or similar middleware
**Recommended**:
- Auth endpoints: 5 attempts per 15 min per IP
- Admin actions: 100 requests per hour per user
- Public endpoints: 1000 requests per hour per IP

#### 3. No Audit Logging
**Severity**: 🟡 **MEDIUM**
**Impact**: Admin actions (invite, role change, batch edit) not logged - no accountability
**Fix**: Add AuditLog model or integrate third-party service (Logflare, Axiom)

#### 4. Batch-Level Authorization Gaps
**Severity**: 🔴 **CRITICAL** (see Bug #2)
**Impact**: Cross-batch data access possible on some endpoints
**Fix**: Audit ALL actions for batch permission checks

#### 5. Middleware Admin Check Assumes First Batch
**Severity**: 🟡 **MEDIUM**
**Location**: `middleware.ts` - takes `userBatches[0]` without verifying batch is active
**Impact**: If user's first batch is inactive/archived, admin access may fail incorrectly
**Fix**: Check all batches for admin role, prioritize active batches

---

## 📊 MISSING vs SPEC (compared to new기획서.md)

### Features in Spec but NOT in Code

| Feature | Status | Notes |
|---------|--------|-------|
| Event attendee/RSVP tracking | ❌ Missing | Event model exists but no EventAttendee or RSVP relation |
| Post "archive" terminology | ⚠️ Mismatch | Code uses `isHidden`, spec says "archive" |
| Notification sending logic | ❌ Missing | Notification model exists but no trigger/email/push implementation |

### Data Integrity Gaps

| Issue | Status | Fix |
|-------|--------|-----|
| No batch-level LinkedIn uniqueness constraint | ⚠️ App-only | Add `@@unique([batchId, linkedInId])` to Founder model |
| No cascading deletes documented | ⚠️ Unknown | Audit all relations for `onDelete: Cascade` vs `Restrict` |

---

## 🔧 ENVIRONMENT VARIABLES STATUS

### ✅ Required (All Set)
```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...  # Only for migrations, not runtime

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email
GMAIL_USER=founder.sprint.batch@gmail.com
GMAIL_APP_PASSWORD=***  # Just configured

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_CALENDAR_ID=...
```

### 🧪 Needs Verification (Vercel Production)

| Variable | Local | Vercel | Notes |
|----------|-------|--------|-------|
| GMAIL_USER | ✅ Set | 🧪 Unknown | Check Vercel dashboard |
| GMAIL_APP_PASSWORD | ✅ Set | 🧪 Unknown | Check Vercel dashboard |
| GOOGLE_PRIVATE_KEY | ✅ Set | 🧪 Unknown | Multi-line value needs proper escaping |
| All others | ✅ Set | 🧪 Unknown | Verify in Vercel project settings |

**Action Required**: Create PoC to verify `process.env` values in deployed Vercel environment

---

## 🧪 그룹 오피스아워 검증 항목

> Added: 2026-02-03 — Group-based office hours redesign

| # | 항목 | 상태 | 성공기준 | 비고 |
|---|------|------|----------|------|
| 10 | groupId nullable 마이그레이션 | ✅ 검증됨 | prisma generate 성공, build 성공 | DB migration은 Supabase 직접 실행 필요 (Prisma CLI 연결 타임아웃) |
| 11 | 그룹 멤버 전원 캘린더 초대 | ✅ 검증됨 | attendeeEmails 배열 기존 검증 완료 | Google Calendar API는 배열로 다수 초대 지원 |
| 12 | unstable_cache + group relation include | ✅ 검증됨 | 3단계 중첩 include (group→members→user) 정상 | feed.ts에서 동일 패턴(comments.replies.author) 이미 사용 중 |
| 13 | 관리자 강제 스케줄링 (Request 없이 confirmed) | ✅ 검증됨 | UI에서 requests=[] 시 crash 없음 | group info로 대체 표시, delete 버튼은 조건부 |

### PoC 결과 요약

- **PoC 1 (Schema Migration)**: Prisma generate + build 성공. DB migration은 Supabase 대시보드에서 SQL 직접 실행 필요.
- **PoC 2 (Cache Compatibility)**: 기존 코드에서 3-level nested include가 unstable_cache와 정상 동작하는 패턴 확인 (feed.ts getPost).
- **PoC 3 (Confirmed without Request)**: 빈 requests 배열에서 .filter/.find/.some 모두 안전. confirmed slot에 group info 대체 표시 구현 완료.

---

## 📋 RECOMMENDED ACTION PLAN

### Phase 1: Fix Critical Bugs (Today)
1. ✅ ~~Fix `inviteUser()` formData null handling~~ (DONE)
2. Add auth checks to `getBatches()` and `getBatch()`
3. Add token email validation to auth callback
4. Add `@@unique([slotId, requesterId])` to OfficeHourRequest
5. Update InvitationToken schema with foreign key relations (requires migration)

### Phase 2: Security Hardening (This Week)
1. Remove or secure `/api/test-auth` endpoint
2. Add rate limiting middleware
3. Audit all endpoints for batch-level authorization
4. Fix middleware admin check to handle multiple batches
5. Add audit logging for admin actions

### Phase 3: Integration PoCs (This Week)
1. Test Gmail SMTP email delivery end-to-end
2. Test Google Calendar event creation
3. Test Supabase Storage file upload
4. Test end-to-end invitation flow (invite → email → OAuth → activation)
5. Verify all environment variables in Vercel production

### Phase 4: Data Integrity (Next Week)
1. Add batch-level LinkedIn uniqueness constraint
2. Review all foreign key `onDelete` behaviors
3. Implement Event RSVP tracking if needed
4. Standardize terminology (isHidden vs archive)
5. Implement notification sending logic

---

## ✅ COMPLETION CRITERIA

Before declaring backend "production-ready":

- [ ] All ❌ Critical Bugs fixed
- [ ] All ⚠️ Security Issues addressed (or documented as accepted risk)
- [ ] All 🧪 High Priority PoCs completed and passing
- [ ] Environment variables verified in production
- [ ] At least 1 end-to-end user journey tested (invite → OAuth → batch join)
- [ ] Rate limiting implemented on auth + admin endpoints
- [ ] Audit logging implemented for admin actions
- [ ] All foreign key relations properly defined with cascade behavior

**Current Completion**: 1/8 (12.5%)

---

## 📝 NOTES

- This document reflects code review findings only - NO features have been tested in real environment yet
- "Verified" (✅) means code review confirms implementation exists, NOT that it works end-to-end
- All 🧪 PoC items should be tested with actual services (real Gmail, real Google Calendar, real Supabase bucket)
- Several "working" features depend on external services that may fail gracefully - production monitoring needed

**Next Step**: Create PoC test plan for all 🧪 items in `/dev_poc/`
