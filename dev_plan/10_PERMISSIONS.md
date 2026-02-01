# 10. Permissions (권한 매트릭스)

> **Zero Context AI Guide**: 이 문서는 역할별 권한을 정의합니다.
> 모든 Server Action과 Route에서 이 권한을 체크해야 합니다.

---

## 1. Role Definitions (역할 정의)

| 역할 | 설명 | 예상 인원 |
|------|------|----------|
| **Super Admin** | 시스템 전체 관리자. 최고 권한 보유. | 1명 |
| **Admin** | 운영 관리자. Batch 및 사용자 관리. | 복수 가능 |
| **Mentor** | Founder의 질문에 답변하고 피드백 제공 | 기수당 약 10명 |
| **Founder** | 프로그램 참가자. 질문, 과제 제출, 오피스아워 요청 | 기수당 30명 이내 |
| **Co-founder** | Founder와 함께 참여하는 공동 창업자 | Founder당 0~3명 |

**역할 간 관계:**
- Super Admin은 모든 Admin 권한을 포함합니다.
- Co-founder는 기본적으로 Founder와 동일한 권한을 가집니다.
- Admin 권한이 필요한 곳에서 Super Admin도 동일하게 허용됩니다.
- Founder 권한이 필요한 곳에서 Co-founder도 동일하게 허용됩니다.

---

## 2. Feature Permission Matrix (기능별 권한)

### 2.1 Batch 관리

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| Batch 생성 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Batch 수정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Batch 종료 (Archive) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Batch 열람 (Active) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Batch 열람 (Archived) | ✅ | ✅ | ✅ (참여자만) | ✅ (참여자만) | ✅ (참여자만) |

### 2.2 사용자 관리

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 사용자 초대 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 초대 취소 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 사용자 목록 조회 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 사용자 프로필 조회 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.3 질문/답변/요약

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 질문 작성 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 질문 수정 | ❌ | ❌ | ❌ | ✅ (본인, 답변 전) | ✅ (본인, 답변 전) |
| 질문 삭제 | ❌ | ❌ | ❌ | ❌ | ❌ |
| 질문 열람 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 답변 작성 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 답변 수정 | ✅ (본인) | ✅ (본인) | ✅ (본인) | ❌ | ❌ |
| 답변 삭제 | ❌ | ❌ | ❌ | ❌ | ❌ |
| 요약 작성 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 요약 수정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 요약 삭제 | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.4 오피스아워

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 슬롯 등록 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 슬롯 수정 | ✅ (전체) | ✅ (전체) | ✅ (본인만) | ❌ | ❌ |
| 슬롯 삭제 | ✅ (전체) | ✅ (전체) | ✅ (본인, 요청없을때) | ❌ | ❌ |
| 슬롯 열람 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 오피스아워 요청 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 요청 취소 (확정 전) | ✅ | ✅ | ❌ | ✅ (본인) | ✅ (본인) |
| 요청 취소 (확정 후) | ✅ | ✅ | ❌ | ❌ | ❌ |
| 요청 승인 | ✅ (전체) | ✅ (전체) | ✅ (본인 슬롯) | ❌ | ❌ |
| 요청 거절 | ✅ (전체) | ✅ (전체) | ✅ (본인 슬롯) | ❌ | ❌ |

### 2.5 세션/슬라이드

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 세션 등록 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 세션 수정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 세션 삭제 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 세션 열람 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.6 과제

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 과제 생성 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 과제 수정 | ✅ (제출물 없을 때) | ✅ (제출물 없을 때) | ❌ | ❌ | ❌ |
| 과제 삭제 | ✅ (제출물 없을 때) | ✅ (제출물 없을 때) | ❌ | ❌ | ❌ |
| 과제 열람 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 과제 제출 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 제출물 수정 (재제출) | ❌ | ❌ | ❌ | ✅ (본인) | ✅ (본인) |
| 제출물 열람 (전체) | ✅ | ✅ | ✅ | ❌ | ❌ |
| 제출물 열람 (본인) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 피드백 작성 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 피드백 수정 | ✅ (본인) | ✅ (본인) | ✅ (본인) | ❌ | ❌ |
| 피드백 삭제 | ❌ | ❌ | ❌ | ❌ | ❌ |
| 제출 현황 대시보드 | ✅ | ✅ | ✅ | ❌ | ❌ |

### 2.7 커뮤니티

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 게시글 작성 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 게시글 수정 | ✅ (본인) | ✅ (본인) | ✅ (본인) | ✅ (본인) | ✅ (본인) |
| 게시글 삭제 | ✅ (전체) | ✅ (전체) | ✅ (본인) | ✅ (본인) | ✅ (본인) |
| 게시글 비공개 처리 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 공지 등록 (상단 고정) | ✅ | ✅ | ❌ | ❌ | ❌ |
| 댓글 작성 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 댓글 수정 | ✅ (본인) | ✅ (본인) | ✅ (본인) | ✅ (본인) | ✅ (본인) |
| 댓글 삭제 | ✅ (전체) | ✅ (전체) | ✅ (본인) | ✅ (본인) | ✅ (본인) |
| 좋아요 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.8 이벤트 (v2.0 신규)

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 이벤트 생성/발송 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 이벤트 수정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 이벤트 삭제 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 이벤트 열람 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.9 그룹/채널 (v2.0 신규)

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 그룹 생성/관리 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 그룹 구성원 초대 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 그룹 구성원 제거 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 그룹 내 피드 작성 | 그룹 구성원만 | 그룹 구성원만 | 그룹 구성원만 | 그룹 구성원만 | 그룹 구성원만 |
| 그룹 내 피드 열람 | 그룹 구성원만 | 그룹 구성원만 | 그룹 구성원만 | 그룹 구성원만 | 그룹 구성원만 |
| 그룹 내 댓글 작성 | 그룹 구성원만 | 그룹 구성원만 | 그룹 구성원만 | 그룹 구성원만 | 그룹 구성원만 |

---

## 3. Route Permissions (라우트별 권한)

### 3.1 Public Routes (인증 불필요)

| Route | 접근 권한 |
|-------|----------|
| `/login` | 모두 |
| `/invite/[token]` | 모두 (초대 토큰 보유자) |
| `/auth/callback` | 모두 (OAuth callback) |

### 3.2 Protected Routes (인증 필요)

| Route | Super Admin | Admin | Mentor | Founder | Co-founder | 비고 |
|-------|:-----------:|:-----:|:------:|:-------:|:----------:|------|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/questions` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/questions/new` | ❌ | ❌ | ❌ | ✅ | ✅ | |
| `/questions/[id]` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/questions/[id]/edit` | ❌ | ❌ | ❌ | ✅ | ✅ | 본인 + 답변 전 |
| `/office-hours` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/office-hours/slots/new` | ✅ | ✅ | ✅ | ❌ | ❌ | |
| `/office-hours/requests` | ✅ | ✅ | ✅ | ❌ | ❌ | 요청 관리 |
| `/office-hours/my-requests` | ❌ | ❌ | ❌ | ✅ | ✅ | 본인 요청 |
| `/sessions` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/sessions/new` | ✅ | ✅ | ❌ | ❌ | ❌ | |
| `/sessions/[id]/edit` | ✅ | ✅ | ❌ | ❌ | ❌ | |
| `/assignments` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/assignments/new` | ✅ | ✅ | ❌ | ❌ | ❌ | |
| `/assignments/[id]` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/assignments/[id]/edit` | ✅ | ✅ | ❌ | ❌ | ❌ | 제출물 없을 때 |
| `/assignments/[id]/submit` | ❌ | ❌ | ❌ | ✅ | ✅ | |
| `/assignments/[id]/submissions` | ✅ | ✅ | ✅ | ❌ | ❌ | 제출 현황 |
| `/community` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/community/new` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/community/[id]` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/community/[id]/edit` | ✅ | ✅ | ✅ | ✅ | ✅ | 본인만 |
| `/events` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/events/new` | ✅ | ✅ | ❌ | ❌ | ❌ | |
| `/events/[id]` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/groups` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/groups/new` | ✅ | ✅ | ❌ | ❌ | ❌ | |
| `/groups/[id]` | 구성원만 | 구성원만 | 구성원만 | 구성원만 | 구성원만 | |
| `/profile` | ✅ | ✅ | ✅ | ✅ | ✅ | |
| `/profile/edit` | ✅ | ✅ | ✅ | ✅ | ✅ | |

### 3.3 Admin Routes

| Route | Super Admin | Admin | Mentor | Founder | Co-founder | 비고 |
|-------|:-----------:|:-----:|:------:|:-------:|:----------:|------|
| `/admin` | ✅ | ✅ | ❌ | ❌ | ❌ | Admin 대시보드 |
| `/admin/batches` | ✅ | ✅ | ❌ | ❌ | ❌ | Batch 관리 |
| `/admin/batches/new` | ✅ | ✅ | ❌ | ❌ | ❌ | Batch 생성 |
| `/admin/batches/[id]` | ✅ | ✅ | ❌ | ❌ | ❌ | Batch 상세 |
| `/admin/users` | ✅ | ✅ | ❌ | ❌ | ❌ | 사용자 관리 |
| `/admin/users/invite` | ✅ | ✅ | ❌ | ❌ | ❌ | 사용자 초대 |
| `/admin/groups` | ✅ | ✅ | ❌ | ❌ | ❌ | 그룹 관리 |

---

## 4. Server Action Permissions (서버 액션별 권한)

### 4.1 Question Actions

```typescript
// questions.ts
export async function createQuestion(data: QuestionInput) {
  // 권한: Founder, Co-founder only
  requireRole('founder', 'co_founder');
  // ...
}

export async function updateQuestion(id: string, data: QuestionInput) {
  // 권한: 본인 Founder/Co-founder + 답변 없을 때만
  const user = requireRole('founder', 'co_founder');
  const question = await getQuestion(id);
  requireOwner(question.authorId, user.id);
  requireNoAnswers(question);
  // ...
}

export async function createAnswer(questionId: string, data: AnswerInput) {
  // 권한: Super Admin, Admin, Mentor only
  requireRole('super_admin', 'admin', 'mentor');
  // ...
}

export async function updateAnswer(id: string, data: AnswerInput) {
  // 권한: 본인만
  const user = requireRole('super_admin', 'admin', 'mentor');
  const answer = await getAnswer(id);
  requireOwner(answer.authorId, user.id);
  // ...
}

export async function createSummary(questionId: string, data: SummaryInput) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}

export async function updateSummary(id: string, data: SummaryInput) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}
```

### 4.2 Office Hour Actions

```typescript
// office-hours.ts
export async function createSlot(data: SlotInput) {
  // 권한: Super Admin, Admin, Mentor only
  requireRole('super_admin', 'admin', 'mentor');
  // ...
}

export async function updateSlot(id: string, data: SlotInput) {
  // 권한: 본인 또는 Admin/Super Admin, 요청 없을 때만
  const user = requireRole('super_admin', 'admin', 'mentor');
  const slot = await getSlot(id);

  if (!['super_admin', 'admin'].includes(user.role)) {
    requireOwner(slot.hostId, user.id);
  }
  requireNoRequests(slot);
  // ...
}

export async function deleteSlot(id: string) {
  // 권한: 본인 또는 Admin/Super Admin, 요청 없을 때만
  const user = requireRole('super_admin', 'admin', 'mentor');
  const slot = await getSlot(id);

  if (!['super_admin', 'admin'].includes(user.role)) {
    requireOwner(slot.hostId, user.id);
  }
  requireNoRequests(slot);
  // ...
}

export async function requestOfficeHour(slotId: string, data: RequestInput) {
  // 권한: Founder, Co-founder only
  requireRole('founder', 'co_founder');
  // ...
}

export async function cancelRequest(requestId: string) {
  // 권한: 본인 Founder/Co-founder (확정 전) 또는 Admin/Super Admin (확정 후)
  const user = requireAuth();
  const request = await getRequest(requestId);

  if (request.status === 'approved') {
    requireRole('super_admin', 'admin');
  } else {
    requireOwner(request.requesterId, user.id);
  }
  // ...
}

export async function approveRequest(requestId: string) {
  // 권한: Admin/Super Admin 또는 해당 슬롯의 Mentor
  const user = requireRole('super_admin', 'admin', 'mentor');
  const request = await getRequest(requestId);
  const slot = await getSlot(request.slotId);

  if (!['super_admin', 'admin'].includes(user.role)) {
    requireOwner(slot.hostId, user.id);
  }
  // ...
}

export async function rejectRequest(requestId: string) {
  // 권한: Admin/Super Admin 또는 해당 슬롯의 Mentor
  const user = requireRole('super_admin', 'admin', 'mentor');
  const request = await getRequest(requestId);
  const slot = await getSlot(request.slotId);

  if (!['super_admin', 'admin'].includes(user.role)) {
    requireOwner(slot.hostId, user.id);
  }
  // ...
}
```

### 4.3 Assignment Actions

```typescript
// assignments.ts
export async function createAssignment(data: AssignmentInput) {
  // 권한: Super Admin, Admin, Mentor
  requireRole('super_admin', 'admin', 'mentor');
  // ...
}

export async function updateAssignment(id: string, data: AssignmentInput) {
  // 권한: Super Admin, Admin only, 제출물 없을 때만
  requireRole('super_admin', 'admin');
  const assignment = await getAssignment(id);
  requireNoSubmissions(assignment);
  // ...
}

export async function deleteAssignment(id: string) {
  // 권한: Super Admin, Admin only, 제출물 없을 때만
  requireRole('super_admin', 'admin');
  const assignment = await getAssignment(id);
  requireNoSubmissions(assignment);
  // ...
}

export async function submitAssignment(assignmentId: string, data: SubmissionInput) {
  // 권한: Founder, Co-founder only
  requireRole('founder', 'co_founder');
  // ...
}

export async function createFeedback(submissionId: string, data: FeedbackInput) {
  // 권한: Super Admin, Admin, Mentor only
  requireRole('super_admin', 'admin', 'mentor');
  // ...
}

export async function updateFeedback(id: string, data: FeedbackInput) {
  // 권한: 본인만
  const user = requireRole('super_admin', 'admin', 'mentor');
  const feedback = await getFeedback(id);
  requireOwner(feedback.authorId, user.id);
  // ...
}
```

### 4.4 Community Actions

```typescript
// community.ts
export async function createPost(data: PostInput) {
  // 권한: 모두
  requireAuth();
  // ...
}

export async function updatePost(id: string, data: PostInput) {
  // 권한: 본인만
  const user = requireAuth();
  const post = await getPost(id);
  requireOwner(post.authorId, user.id);
  // ...
}

export async function deletePost(id: string) {
  // 권한: 본인 또는 Admin/Super Admin
  const user = requireAuth();
  const post = await getPost(id);

  if (!['super_admin', 'admin'].includes(user.role)) {
    requireOwner(post.authorId, user.id);
  }
  // ...
}

export async function hidePost(id: string) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}

export async function pinPost(id: string) {
  // 권한: Super Admin, Admin only, 최대 3개 제한
  requireRole('super_admin', 'admin');
  const pinnedCount = await countPinnedPosts();
  if (pinnedCount >= 3) {
    throw new Error('Maximum 3 pinned posts allowed');
  }
  // ...
}

export async function createComment(postId: string, data: CommentInput) {
  // 권한: 모두
  requireAuth();
  // 대댓글 2단계 제한 체크
  if (data.parentId) {
    const parent = await getComment(data.parentId);
    if (parent.parentId) {
      throw new Error('Only 2 levels of comments allowed');
    }
  }
  // ...
}

export async function updateComment(id: string, data: CommentInput) {
  // 권한: 본인만
  const user = requireAuth();
  const comment = await getComment(id);
  requireOwner(comment.authorId, user.id);
  // ...
}

export async function deleteComment(id: string) {
  // 권한: 본인 또는 Admin/Super Admin
  const user = requireAuth();
  const comment = await getComment(id);

  if (!['super_admin', 'admin'].includes(user.role)) {
    requireOwner(comment.authorId, user.id);
  }
  // ... (대댓글도 함께 삭제)
}

export async function toggleLike(targetType: 'post' | 'comment', targetId: string) {
  // 권한: 모두
  requireAuth();
  // ...
}
```

### 4.5 Event Actions (v2.0 신규)

```typescript
// events.ts
export async function createEvent(data: EventInput) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}

export async function updateEvent(id: string, data: EventInput) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}

export async function deleteEvent(id: string) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}

export async function getEvents(batchId: string) {
  // 권한: 해당 Batch 구성원
  requireBatchAccess(batchId);
  // ...
}
```

### 4.6 Group Actions (v2.0 신규)

```typescript
// groups.ts
export async function createGroup(data: GroupInput) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}

export async function updateGroup(id: string, data: GroupInput) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}

export async function deleteGroup(id: string) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}

export async function addGroupMember(groupId: string, userId: string) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}

export async function removeGroupMember(groupId: string, userId: string) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}

export async function createGroupPost(groupId: string, data: PostInput) {
  // 권한: 그룹 구성원만
  const user = requireAuth();
  await requireGroupMembership(groupId, user.id);
  // ...
}

export async function getGroupPosts(groupId: string) {
  // 권한: 그룹 구성원만
  const user = requireAuth();
  await requireGroupMembership(groupId, user.id);
  // ...
}
```

### 4.7 User & Batch Actions

```typescript
// users.ts
export async function inviteUser(data: InviteInput) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // 중복 초대 체크
  // 7일 유효기간 설정
  // ...
}

export async function cancelInvite(inviteId: string) {
  // 권한: Super Admin, Admin only, 초대 대기 상태만
  requireRole('super_admin', 'admin');
  const invite = await getInvite(inviteId);
  if (invite.status !== 'invited') {
    throw new Error('Can only cancel pending invites');
  }
  // ...
}

// batches.ts
export async function createBatch(data: BatchInput) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // 여러 기수 동시 운영 가능 (제한 없음)
  // ...
}

export async function archiveBatch(id: string) {
  // 권한: Super Admin, Admin only
  requireRole('super_admin', 'admin');
  // ...
}
```

---

## 5. Permission Helper Functions

```typescript
// lib/auth/permissions.ts

import { getServerSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

type Role = 'super_admin' | 'admin' | 'mentor' | 'founder' | 'co_founder';

export async function requireAuth() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireAuth();
  const userBatch = await prisma.userBatch.findFirst({
    where: {
      userId: user.id,
      batch: { status: 'active' },
      status: 'active',
    },
  });

  if (!userBatch) {
    throw new Error('Forbidden: No active batch membership');
  }

  const userRole = userBatch.role as Role;

  // Super Admin은 모든 Admin 권한 포함
  const hasAdminPermission = roles.includes('admin') && userRole === 'super_admin';

  // Co-founder는 모든 Founder 권한 포함
  const hasFounderPermission = roles.includes('founder') && userRole === 'co_founder';

  if (!roles.includes(userRole) && !hasAdminPermission && !hasFounderPermission) {
    throw new Error('Forbidden');
  }

  return { ...user, role: userRole };
}

export function requireOwner(ownerId: string, userId: string) {
  if (ownerId !== userId) {
    throw new Error('Forbidden: Not the owner');
  }
}

export async function requireBatchAccess(batchId: string) {
  const user = await requireAuth();

  // Super Admin, Admin은 모든 Batch 접근 가능
  const adminBatch = await prisma.userBatch.findFirst({
    where: {
      userId: user.id,
      role: { in: ['super_admin', 'admin'] }
    },
  });
  if (adminBatch) return;

  // 해당 Batch의 참여자인지 확인
  const userBatch = await prisma.userBatch.findFirst({
    where: {
      userId: user.id,
      batchId,
      status: 'active',
    },
  });

  if (!userBatch) {
    throw new Error('Forbidden: Not a batch member');
  }
}

export async function requireGroupMembership(groupId: string, userId: string) {
  // Admin/Super Admin은 모든 그룹 접근 가능
  const adminBatch = await prisma.userBatch.findFirst({
    where: {
      userId,
      role: { in: ['super_admin', 'admin'] }
    },
  });
  if (adminBatch) return;

  // 그룹 구성원인지 확인
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId,
    },
  });

  if (!membership) {
    throw new Error('Forbidden: Not a group member');
  }
}

export async function getCurrentUserRole(): Promise<Role | null> {
  const session = await getServerSession();
  if (!session?.user) return null;

  const userBatch = await prisma.userBatch.findFirst({
    where: {
      userId: session.user.id,
      batch: { status: 'active' },
      status: 'active',
    },
  });

  return userBatch?.role as Role || null;
}

export async function canEditQuestion(questionId: string): Promise<boolean> {
  const user = await requireAuth();
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { _count: { select: { answers: true } } },
  });

  if (!question) return false;
  if (question.authorId !== user.id) return false;
  if (question._count.answers > 0) return false;

  return true;
}

export async function canEditAssignment(assignmentId: string): Promise<boolean> {
  await requireRole('super_admin', 'admin');

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { _count: { select: { submissions: true } } },
  });

  if (!assignment) return false;
  if (assignment._count.submissions > 0) return false;

  return true;
}

export async function canApproveRequest(requestId: string): Promise<boolean> {
  const user = await requireAuth();
  const userRole = await getCurrentUserRole();

  if (['super_admin', 'admin'].includes(userRole ?? '')) return true;
  if (userRole !== 'mentor') return false;

  const request = await prisma.officeHourRequest.findUnique({
    where: { id: requestId },
    include: { slot: true },
  });

  if (!request) return false;
  return request.slot.hostId === user.id;
}

export function isAdminRole(role: Role | null): boolean {
  return ['super_admin', 'admin'].includes(role ?? '');
}

export function isFounderRole(role: Role | null): boolean {
  return ['founder', 'co_founder'].includes(role ?? '');
}
```

---

## 6. Middleware Permission Check

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

const publicPaths = ['/login', '/invite', '/auth'];
const adminPaths = ['/admin'];
const mentorPaths = ['/office-hours/slots/new', '/office-hours/requests'];
const founderOnlyPaths = ['/questions/new', '/assignments/*/submit', '/office-hours/my-requests'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Get session
  const session = await getSession(request);
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = session.role;

  // Admin-only paths (Super Admin + Admin)
  if (adminPaths.some(p => pathname.startsWith(p))) {
    if (!['super_admin', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Mentor+ paths (Super Admin + Admin + Mentor)
  if (mentorPaths.some(p => pathname.startsWith(p))) {
    if (!['super_admin', 'admin', 'mentor'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Founder-only paths (Founder + Co-founder, 더 상세한 체크는 page/action에서)
  if (founderOnlyPaths.some(p => {
    const regex = new RegExp('^' + p.replace('*', '[^/]+') + '$');
    return regex.test(pathname);
  })) {
    if (!['founder', 'co_founder'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 7. UI Permission Helpers

```typescript
// hooks/use-permissions.ts

'use client';

import { useSession } from '@/hooks/use-session';

export function usePermissions() {
  const { user, role } = useSession();

  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin';
  const isMentor = role === 'mentor';
  const isFounder = role === 'founder';
  const isCoFounder = role === 'co_founder';

  const isAdminOrAbove = ['super_admin', 'admin'].includes(role ?? '');
  const isMentorOrAbove = ['super_admin', 'admin', 'mentor'].includes(role ?? '');
  const isFounderOrCoFounder = ['founder', 'co_founder'].includes(role ?? '');

  return {
    // Role checks
    isSuperAdmin,
    isAdmin,
    isMentor,
    isFounder,
    isCoFounder,
    isAdminOrAbove,
    isMentorOrAbove,
    isFounderOrCoFounder,

    // Question
    canCreateQuestion: isFounderOrCoFounder,
    canCreateAnswer: isMentorOrAbove,
    canCreateSummary: isAdminOrAbove,

    // Office Hour
    canCreateSlot: isMentorOrAbove,
    canRequestOfficeHour: isFounderOrCoFounder,

    // Assignment
    canCreateAssignment: ['super_admin', 'admin', 'mentor'].includes(role ?? ''),
    canSubmitAssignment: isFounderOrCoFounder,
    canCreateFeedback: isMentorOrAbove,
    canViewSubmissions: isMentorOrAbove,

    // Event
    canCreateEvent: isAdminOrAbove,

    // Group
    canCreateGroup: isAdminOrAbove,
    canManageGroup: isAdminOrAbove,

    // Community
    canPinPost: isAdminOrAbove,
    canHidePost: isAdminOrAbove,

    // Admin
    canManageBatch: isAdminOrAbove,
    canInviteUsers: isAdminOrAbove,

    // Ownership checks
    isOwner: (authorId: string) => user?.id === authorId,
    canEdit: (authorId: string) => user?.id === authorId,
    canDelete: (authorId: string) => isAdminOrAbove || user?.id === authorId,
  };
}
```

```tsx
// Example usage in component
'use client';

import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';

export function QuestionActions({ question }) {
  const { canCreateAnswer, canCreateSummary, isOwner } = usePermissions();
  const canEditQuestion = isOwner(question.authorId) && question.answers.length === 0;

  return (
    <div className="flex gap-2">
      {canEditQuestion && (
        <Button variant="outline" href={`/questions/${question.id}/edit`}>
          Edit
        </Button>
      )}
      {canCreateAnswer && (
        <Button>Write Answer</Button>
      )}
      {canCreateSummary && question.status === 'open' && (
        <Button variant="primary">Write Summary</Button>
      )}
    </div>
  );
}
```

---

**문서 끝**
