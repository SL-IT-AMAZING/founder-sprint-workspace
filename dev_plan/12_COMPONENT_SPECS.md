# 12. 컴포넌트 스펙 (Component Specifications)

> **Zero Context AI Guide**: 이 문서는 모든 UI 컴포넌트의 스펙을 정의합니다.
> outsome-react 라이브러리에서 재사용 가능한 컴포넌트를 매핑하고,
> 신규 개발이 필요한 컴포넌트의 Props/States/Events를 명세합니다.

---

## 목차

1. [디자인 시스템 토큰](#1-디자인-시스템-토큰)
2. [outsome-react 컴포넌트 매핑 요약](#2-outsome-react-컴포넌트-매핑-요약)
3. [레이아웃 컴포넌트](#3-레이아웃-컴포넌트)
4. [인증 컴포넌트](#4-인증-컴포넌트)
5. [네비게이션 컴포넌트](#5-네비게이션-컴포넌트)
6. [피드/커뮤니티 컴포넌트](#6-피드커뮤니티-컴포넌트)
7. [질문 컴포넌트](#7-질문-컴포넌트)
8. [이벤트/오피스아워 컴포넌트](#8-이벤트오피스아워-컴포넌트)
9. [과제 컴포넌트](#9-과제-컴포넌트)
10. [그룹 컴포넌트](#10-그룹-컴포넌트)
11. [관리자 컴포넌트](#11-관리자-컴포넌트)
12. [공통 컴포넌트](#12-공통-컴포넌트)
13. [화면별 컴포넌트 매핑](#13-화면별-컴포넌트-매핑)

---

## 1. 디자인 시스템 토큰

> **디자인 정본**: `_bmad-output/excalidraw-diagrams/founder-sprint-theme.json` (Outsome 브랜드)
> **구조 참고**: YC Bookface 레이아웃 (정보 밀도, 2컬럼 피드, 카드 기반)
> **색상/폰트**: Outsome 브랜드 (theme.json 기준, YC 오렌지 아님)

outsome-react의 `bookface.css`에서 정의된 CSS 변수를 기반으로 MVP 디자인 토큰을 정의합니다.

### 색상

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--bg-cream` | `#FAF8F5` | 페이지 배경 (Outsome Beige) |
| `--card-bg` | `#ffffff` | 카드 배경 |
| `--card-border` | `#E8E4DE` | 카드 테두리 (Outsome 브랜드) |
| `--primary` | `#1A1A1A` | Outsome 블랙 액센트 (주요 색상) |
| `--primary-hover` | `#333333` | 블랙 호버 |
| `--accent` | `#555AB9` | outsome-react 기본 primary (보조 색상) |
| `--text-primary` | `#1A1A1A` | 주요 텍스트 (Outsome 브랜드) |
| `--text-secondary` | `#666666` | 보조 텍스트 |
| `--text-muted` | `#999999` | 약한 텍스트 |
| `--beige-badge` | `#F5F1EB` | 베이지 배지 배경 (Outsome Card Hover) |
| `--status-green` | `#2E7D32` | 성공/활성 상태 (Outsome 브랜드) |
| `--status-red` | `#C62828` | 에러/마감 상태 (Outsome 브랜드) |
| `--status-amber` | `#F57C00` | 경고/대기 상태 (Outsome 브랜드) |
| `--linkedin-blue` | `#0077B5` | LinkedIn 브랜딩 |
| `--border-color` | `#e0e0e0` | 일반 테두리 |
| `--border-light` | `#f0f0f0` | 얇은 구분선 |
| `--header-bg` | `#2F2C26` | 헤더 배경 (다크) |

### 타이포그래피

| 토큰 | 값 |
|------|-----|
| `--font-family` | `"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif` (Outsome 브랜드) |
| `--font-family-heading` | `"Georgia", "Libre Caslon Condensed", serif` (Outsome 브랜드) |
| `--font-family-badge` | `"Roboto Mono", monospace` |
| `--font-size-xs` | `11px` |
| `--font-size-sm` | `12px` |
| `--font-size-base` | `14px` |
| `--font-size-lg` | `16px` |
| `--font-size-xl` | `18px` |
| `--font-size-2xl` | `24px` |

### 간격

| 토큰 | 값 |
|------|-----|
| `--spacing-xs` | `4px` |
| `--spacing-sm` | `8px` |
| `--spacing-md` | `12px` |
| `--spacing-lg` | `16px` |
| `--spacing-xl` | `24px` |
| `--spacing-2xl` | `32px` |

### 라운딩

| 토큰 | 값 |
|------|-----|
| `--radius-sm` | `4px` |
| `--radius-md` | `6px` |
| `--radius-lg` | `9px` |
| `--radius-full` | `9999px` |

### 그림자

| 토큰 | 값 |
|------|-----|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow-md` | `0 2px 4px rgba(0,0,0,0.1)` |
| `--shadow-lg` | `0 4px 12px rgba(0,0,0,0.15)` |

---

## 2. outsome-react 컴포넌트 매핑 요약

### 재사용 가능 (직접 import 또는 경량 래핑)

| outsome-react 컴포넌트 | MVP 용도 | 수정 필요 사항 |
|------------------------|----------|---------------|
| `Avatar` | 프로필 아바타 전역 | primary 색상 `#555AB9` -> `#ff6600` 오버라이드 |
| `BatchBadge` | 배치 배지 전역 | 색상 커스터마이즈 필요 |
| `TagBadge` | 태그/상태 배지 전역 | 그대로 사용 가능 |
| `FeedTabs` | 피드 탭, 리스트 필터 | 탭 항목 커스터마이즈 |
| `PostCard` | 피드 게시글 카드 | 그대로 사용 가능 |
| `CommentThread` | 댓글 스레드 (2-level) | 그대로 사용 가능 |
| `PersonCard` | 사용자 카드 (사이드바) | 그대로 사용 가능 |
| `BookfaceHeader` | 상단 네비게이션 바 | nav 항목 + 로고 커스터마이즈 |
| `LeftSidebar` | 좌측 사이드바 | nav 항목 커스터마이즈 |
| `GroupBrowseModal` | 그룹 목록 모달 | 그대로 사용 가능 |
| `OfficeHoursForm` | 오피스아워 신청 폼 | partners 데이터 바인딩 |
| `DirectoryFilters` | 필터 사이드바 | 필터 섹션 커스터마이즈 |
| `ProfileHeader` | 프로필 헤더 | 탭 커스터마이즈 |
| `ConversationSidebar` | 참여자 목록 사이드바 | 그대로 사용 가능 |

### 참고용 (구조/스타일 차용, 신규 개발)

| outsome-react 컴포넌트 | MVP에서 참고할 부분 |
|------------------------|-------------------|
| `CompanyCard` | 카드 레이아웃 패턴 |
| `PersonListItem` | 리스트 아이템 패턴, LinkedIn 아이콘 |
| `ProfileSidebar` | 사이드바 정보 표시 패턴 |
| `NewsSection` | 그리드 카드 레이아웃 |
| `VideoCard` | 썸네일 카드 패턴 |
| `PhotosGallery` | 갤러리 스크롤 패턴 |
| `ArticleContent` | 컨텐츠 렌더링 패턴 |
| `MessageList` | 메시지 리스트 패턴 |

### 신규 개발 필요

| 컴포넌트 | 이유 |
|----------|------|
| `LinkedInLoginButton` | MVP 전용 OAuth 인증 |
| `QuestionCard` / `QuestionDetail` | Q&A 기능 (outsome-react에 없음) |
| `EventCard` / `EventCalendarView` | 이벤트 기능 (outsome-react에 없음) |
| `AssignmentCard` / `AssignmentDetail` | 과제 기능 (outsome-react에 없음) |
| `SubmissionForm` / `SubmissionStatusGrid` | 제출 기능 (outsome-react에 없음) |
| `AdminLayout` / `BatchForm` / `UserTable` | 관리자 기능 (outsome-react에 없음) |
| `FileUploader` | 파일 업로드 (outsome-react에 없음) |
| `DateTimePicker` | 날짜/시간 선택 (outsome-react에 없음) |
| `Modal` / `Toast` | 공통 UI (outsome-react에 부분적으로 있음) |

---

## 3. 레이아웃 컴포넌트

### AppShell

**outsome-react 매핑**: `BookfaceFeedPage` 레이아웃 구조 참고 (재구성 필요)

전체 앱의 최상위 레이아웃. Top Navbar(72px) + content area 구조.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `children` | `ReactNode` | Yes | 메인 콘텐츠 영역 |
| `sidebar` | `ReactNode` | No | 좌측 사이드바 콘텐츠 (있을 경우 2-column) |
| `rightPanel` | `ReactNode` | No | 우측 패널 콘텐츠 (있을 경우 3-column) |
| `sidebarCollapsed` | `boolean` | No | 사이드바 접힘 상태 (기본: false) |
| `maxWidth` | `string` | No | 최대 너비 (기본: "1200px") |

**States**:
- `sidebarOpen`: 모바일에서 사이드바 토글
- 그리드 레이아웃: `200px 1fr 280px` (3-column) / `200px 1fr` (2-column) / `1fr` (1-column)

**Events**: 없음 (순수 레이아웃)

**Variants**:
- `default`: 3-column (좌측 사이드바 + 메인 + 우측 패널)
- `two-column`: 2-column (좌측 사이드바 + 메인)
- `single`: 1-column (메인만)
- `admin`: AdminLayout로 전환

**사용 화면**: 모든 화면 (#1~#21)

---

### AdminLayout

**outsome-react 매핑**: 없음 (신규 개발)

관리자 전용 레이아웃. Left sidebar(240px) + main content 구조.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `children` | `ReactNode` | Yes | 메인 콘텐츠 영역 |
| `activeMenu` | `string` | Yes | 현재 활성 메뉴 항목 ID |
| `onMenuClick` | `(menuId: string) => void` | No | 메뉴 클릭 이벤트 |

**States**:
- `collapsedSidebar`: 사이드바 접힘 상태

**Events**: `onMenuClick`

**Variants**: 없음

**사용 화면**: #20 Admin: Batch Management, #21 Admin: User Management

---

### PageHeader

**outsome-react 매핑**: `OfficeHoursPage` 내부의 pageHeader 스타일 참고 (신규 개발)

페이지 상단 제목 + 설명 + 액션 버튼 영역.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | 페이지 제목 |
| `description` | `string` | No | 부제목/설명 |
| `actions` | `ReactNode` | No | 우측 액션 버튼 영역 |
| `breadcrumbs` | `{ label: string; href?: string }[]` | No | 브레드크럼 |
| `tabs` | `Tab[]` | No | 페이지 탭 (FeedTabs 사용) |
| `activeTab` | `string` | No | 현재 활성 탭 |
| `onTabChange` | `(tabId: string) => void` | No | 탭 변경 이벤트 |

**States**: 없음 (stateless)

**Events**: `onTabChange`

**Variants**:
- `default`: 제목 + 설명
- `with-tabs`: 제목 + 탭
- `with-actions`: 제목 + 우측 버튼

**사용 화면**: #2~#21 (거의 모든 화면)

---

### EmptyState

**outsome-react 매핑**: `GroupBrowseModal` 내부 emptyState 참고 (신규 개발)

데이터가 없을 때 표시하는 빈 상태 컴포넌트.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `icon` | `ReactNode` | No | 아이콘 (이모지 또는 SVG) |
| `title` | `string` | Yes | 빈 상태 제목 |
| `description` | `string` | No | 설명 텍스트 |
| `actionLabel` | `string` | No | CTA 버튼 텍스트 |
| `onAction` | `() => void` | No | CTA 버튼 클릭 |

**States**: 없음 (stateless)

**Events**: `onAction`

**Variants**: 없음

**사용 화면**: 모든 리스트 화면 (데이터 없을 때)

---

## 4. 인증 컴포넌트

### LinkedInLoginButton

**outsome-react 매핑**: `PersonListItem` 내부 LinkedIn 아이콘 스타일 참고 (신규 개발)

LinkedIn OAuth 로그인 버튼.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `onLogin` | `() => void` | Yes | 로그인 버튼 클릭 시 OAuth 플로우 시작 |
| `loading` | `boolean` | No | 로딩 상태 (기본: false) |
| `disabled` | `boolean` | No | 비활성 상태 (기본: false) |
| `fullWidth` | `boolean` | No | 전체 너비 (기본: true) |

**States**:
- `isLoading`: OAuth 진행 중 로딩 스피너
- `isHovered`: 호버 상태 시 배경색 변경

**Events**: `onLogin`

**Variants**:
- `default`: LinkedIn 파란색 (#0077B5) 배경 + 흰색 텍스트 + LinkedIn 로고 아이콘
- `outline`: 흰색 배경 + LinkedIn 파란색 테두리/텍스트

**스타일**:
```css
height: 48px;
border-radius: 6px;
font-size: 16px;
font-weight: 600;
background-color: #0077B5;
color: white;
```

**사용 화면**: #1 Login

---

### AuthCallback

**outsome-react 매핑**: 없음 (신규 개발)

LinkedIn OAuth 콜백 처리 컴포넌트 (화면 없이 로직만).

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `onSuccess` | `(user: User) => void` | Yes | 인증 성공 콜백 |
| `onError` | `(error: string) => void` | Yes | 인증 실패 콜백 |

**States**:
- `status`: `'processing' | 'success' | 'error'`
- `errorMessage`: 에러 메시지

**Events**: `onSuccess`, `onError`

**사용 화면**: #1 Login (리다이렉트 후)

---

## 5. 네비게이션 컴포넌트

### TopNavbar

**outsome-react 매핑**: `BookfaceHeader` (재사용 가능, 커스터마이즈 필요)

상단 고정 네비게이션 바. 높이 72px (outsome-react는 48px이므로 조정 필요).

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `userName` | `string` | No | 사용자 이름 |
| `userAvatarUrl` | `string` | No | 사용자 아바타 URL |
| `userRole` | `'ADMIN' \| 'PARTNER' \| 'FOUNDER' \| 'ALUMNI'` | No | 사용자 역할 |
| `notificationCount` | `number` | No | 알림 수 |
| `onLogoClick` | `() => void` | No | 로고 클릭 (홈으로) |
| `onSearchSubmit` | `(query: string) => void` | No | 검색 제출 |
| `onNotificationClick` | `() => void` | No | 알림 아이콘 클릭 |
| `onProfileClick` | `() => void` | No | 프로필 아바타 클릭 |
| `onAdminClick` | `() => void` | No | 관리자 메뉴 클릭 (ADMIN 역할만) |

**States**:
- `searchQuery`: 검색 입력 값
- `isSearchFocused`: 검색 포커스 상태
- `isProfileMenuOpen`: 프로필 드롭다운 상태

**Events**: `onLogoClick`, `onSearchSubmit`, `onNotificationClick`, `onProfileClick`, `onAdminClick`

**outsome-react BookfaceHeader와의 차이점**:
- 높이: 48px -> 72px
- nav 항목: `['Community', 'Advice', 'Tools', 'Contact']` -> `['Dashboard', 'Q&A', 'Events', 'Sessions', 'Feed', 'Groups']`
- 로고: Outsome 로고 -> FS (Founder Sprint) 로고
- 배경색: `#2F2C26` (유지 또는 `#ff6600` 활용)
- Admin 역할일 경우 관리자 링크 표시

**Variants**:
- `default`: 일반 사용자
- `admin`: ADMIN 역할 (관리자 링크 추가)

**사용 화면**: 모든 인증된 화면 (#2~#21)

---

### AdminSidebar

**outsome-react 매핑**: `LeftSidebar` 구조 참고 (신규 개발)

관리자 페이지 좌측 사이드바. AdminLayout 내부에서 사용.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `activeItem` | `string` | No | 현재 활성 메뉴 ID |
| `onItemClick` | `(itemId: string) => void` | No | 메뉴 항목 클릭 |

**메뉴 항목**:
```typescript
const ADMIN_NAV_ITEMS = [
  { id: 'batches', label: '배치 관리', icon: '📋' },
  { id: 'users', label: '사용자 관리', icon: '👥' },
  { id: 'sessions', label: '세션 관리', icon: '📅' },
  { id: 'assignments', label: '과제 관리', icon: '📝' },
];
```

**States**: 없음

**Events**: `onItemClick`

**사용 화면**: #20, #21

---

## 6. 피드/커뮤니티 컴포넌트

### PostCard

**outsome-react 매핑**: `PostCard` (직접 재사용)

피드 게시글 카드. outsome-react 컴포넌트를 그대로 사용.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 게시글 ID |
| `author` | `{ name: string; avatarUrl?: string; batch?: string; company?: string }` | Yes | 작성자 정보 |
| `content` | `string` | Yes | 게시글 내용 |
| `linkPreview` | `LinkPreview` | No | 링크 미리보기 |
| `tags` | `string[]` | No | 태그 목록 |
| `postedAt` | `string` | Yes | 작성 시간 (상대 시간) |
| `likes` | `number` | Yes | 좋아요 수 |
| `comments` | `number` | Yes | 댓글 수 |
| `views` | `number` | No | 조회 수 |
| `isLiked` | `boolean` | No | 좋아요 상태 |
| `isBookmarked` | `boolean` | No | 북마크 상태 |
| `isPinned` | `boolean` | No | 고정 게시글 여부 (MVP 추가) |
| `onLike` | `() => void` | No | 좋아요 토글 |
| `onComment` | `() => void` | No | 댓글 클릭 |
| `onBookmark` | `() => void` | No | 북마크 토글 |
| `onShare` | `() => void` | No | 공유 클릭 |
| `onAuthorClick` | `() => void` | No | 작성자 클릭 |

**States** (내부):
- `isExpanded`: 긴 텍스트 펼침 (280자 이상 시 truncate)

**Events**: `onLike`, `onComment`, `onBookmark`, `onShare`, `onAuthorClick`

**Variants**: 없음 (outsome-react 기본)

**사용 화면**: #14 Feed, #15 Post Detail, #18 Group Detail

---

### InlineComposer

**outsome-react 매핑**: `BookfaceFeedPage` 내부 newPostBox 스타일 참고 (신규 개발)

인라인 글쓰기 입력 영역. 클릭 시 PostCreateForm으로 확장 또는 모달 오픈.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `userAvatarUrl` | `string` | No | 현재 사용자 아바타 |
| `userName` | `string` | No | 현재 사용자 이름 |
| `placeholder` | `string` | No | 플레이스홀더 (기본: "무슨 생각을 하고 계신가요?") |
| `groupId` | `string` | No | 그룹 ID (그룹 내 작성 시) |
| `onClick` | `() => void` | Yes | 클릭 시 작성 화면으로 이동/모달 오픈 |

**States**: 없음 (클릭 시 다른 컴포넌트로 전환)

**Events**: `onClick`

**스타일**: 아바타(40px) + 베이지 배경(`#f1eadd`) 입력 영역 + 둥근 모서리(20px)

**사용 화면**: #14 Feed, #18 Group Detail

---

### CommentThread

**outsome-react 매핑**: `CommentThread` (직접 재사용)

2-level 중첩 댓글 스레드. outsome-react 컴포넌트를 그대로 사용.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `comments` | `Comment[]` | Yes | 댓글 목록 (중첩 구조) |
| `currentUserAvatar` | `string` | No | 현재 사용자 아바타 |
| `onUpvote` | `(commentId: string) => void` | No | 댓글 추천 |
| `onReply` | `(commentId: string, content: string) => void` | No | 댓글 답글 |
| `onReplyPrivately` | `(commentId: string) => void` | No | 비공개 답글 |
| `onSubmitComment` | `(content: string) => void` | No | 새 댓글 작성 |

**Comment 타입**:
```typescript
interface Comment {
  id: string;
  author: { name: string; avatarUrl?: string; batch?: string };
  content: string;
  quotedText?: string;
  postedAt: string;
  upvotes: number;
  isUpvoted?: boolean;
  replies?: Comment[];  // 최대 depth: 2
}
```

**States** (내부): `newComment` 입력 값

**Events**: `onUpvote`, `onReply`, `onReplyPrivately`, `onSubmitComment`

**사용 화면**: #15 Post Detail, #4 Question Detail

---

### LikeButton

**outsome-react 매핑**: `PostCard` 내부 like 버튼 참고 (분리 추출)

좋아요 토글 버튼. PostCard 내장이지만, 독립 사용이 필요한 경우를 위해 분리.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `count` | `number` | Yes | 좋아요 수 |
| `isLiked` | `boolean` | No | 좋아요 상태 (기본: false) |
| `onToggle` | `() => void` | Yes | 토글 이벤트 |

**States**: 없음 (외부 제어)

**Events**: `onToggle`

**스타일**: 활성 시 `#555AB9` 색상 + `▲` 아이콘, 비활성 시 `#666` + `△`

**사용 화면**: #14 Feed, #15 Post Detail (PostCard 내부)

---

### FeedTabs

**outsome-react 매핑**: `FeedTabs` (직접 재사용, 탭 항목 커스터마이즈)

탭 네비게이션 컴포넌트.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `tabs` | `Tab[]` | Yes | 탭 목록 |
| `activeTab` | `string` | Yes | 현재 활성 탭 ID |
| `onTabChange` | `(tabId: string) => void` | Yes | 탭 변경 이벤트 |

**Tab 타입**:
```typescript
interface Tab {
  id: string;
  label: string;
  count?: number;
}
```

**MVP 탭 세트 (피드)**:
```typescript
const feedTabs: Tab[] = [
  { id: 'all', label: '전체' },
  { id: 'pinned', label: '고정' },
  { id: 'mine', label: '내 글' },
];
```

**States** (내부): `hoveredTab` 호버 상태

**Events**: `onTabChange`

**스타일**: 활성 탭 `#555AB9` 색상 + 하단 2px 보더

**사용 화면**: #3 Question List, #14 Feed, #9 Session List

---

### PostCreateForm

**outsome-react 매핑**: 없음 (신규 개발, `OfficeHoursForm` 폼 스타일 참고)

게시글 작성 폼. 전체 페이지 또는 모달로 사용.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `groupId` | `string` | No | 그룹 ID (그룹 내 작성 시) |
| `initialContent` | `string` | No | 초기 내용 (수정 시) |
| `onSubmit` | `(data: PostCreateData) => void` | Yes | 제출 이벤트 |
| `onCancel` | `() => void` | Yes | 취소 이벤트 |
| `isSubmitting` | `boolean` | No | 제출 중 로딩 상태 |

**PostCreateData 타입**:
```typescript
interface PostCreateData {
  content: string;
  tags: string[];
  attachments: File[];
  isPinned: boolean;  // ADMIN만
  groupId?: string;
}
```

**States**:
- `content`: 텍스트 내용
- `tags`: 선택된 태그 목록
- `attachments`: 첨부 파일 목록

**Events**: `onSubmit`, `onCancel`

**사용 화면**: #16 Post Create

---

## 7. 질문 컴포넌트

### QuestionCard

**outsome-react 매핑**: 없음 (신규 개발, `PostCard` 구조 참고)

질문 목록의 개별 카드.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 질문 ID |
| `title` | `string` | Yes | 질문 제목 |
| `content` | `string` | Yes | 질문 내용 (미리보기, 2줄 truncate) |
| `author` | `{ name: string; avatarUrl?: string; batch?: string }` | Yes | 작성자 정보 |
| `status` | `'OPEN' \| 'ANSWERED' \| 'CLOSED'` | Yes | 질문 상태 |
| `answerCount` | `number` | Yes | 답변 수 |
| `voteCount` | `number` | Yes | 투표 수 |
| `createdAt` | `string` | Yes | 작성일 |
| `tags` | `string[]` | No | 태그 목록 |
| `hasSummary` | `boolean` | No | AI 요약 존재 여부 |
| `onClick` | `() => void` | No | 카드 클릭 |

**States** (내부): `isHovered` 호버 상태

**Events**: `onClick`

**Variants**:
- 상태 배지 색상: OPEN(`#22c55e`), ANSWERED(`#555AB9`), CLOSED(`#666666`)

**스타일**:
```css
background-color: #ffffff;
border: 1px solid #e0d6c8;
border-radius: 8px;
padding: 16px;
```

**사용 화면**: #3 Question List

---

### QuestionDetail

**outsome-react 매핑**: 없음 (신규 개발, `PostDetailPage` 레이아웃 참고)

질문 상세 페이지의 메인 콘텐츠.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 질문 ID |
| `title` | `string` | Yes | 질문 제목 |
| `content` | `string` | Yes | 질문 내용 (전체) |
| `author` | `{ name: string; avatarUrl?: string; batch?: string; company?: string }` | Yes | 작성자 정보 |
| `status` | `'OPEN' \| 'ANSWERED' \| 'CLOSED'` | Yes | 질문 상태 |
| `createdAt` | `string` | Yes | 작성일 |
| `tags` | `string[]` | No | 태그 목록 |
| `attachments` | `{ name: string; url: string; size: string }[]` | No | 첨부파일 |
| `answers` | `Answer[]` | Yes | 답변 목록 |
| `summary` | `string` | No | AI 요약 |
| `onAnswer` | `() => void` | No | 답변 작성 클릭 |
| `onStatusChange` | `(status: string) => void` | No | 상태 변경 (작성자/ADMIN) |
| `onAuthorClick` | `() => void` | No | 작성자 클릭 |

**Answer 타입**:
```typescript
interface Answer {
  id: string;
  author: { name: string; avatarUrl?: string; batch?: string; role?: string };
  content: string;
  createdAt: string;
  voteCount: number;
  isAccepted: boolean;
  isVoted: boolean;
}
```

**States**: 없음 (외부 제어)

**Events**: `onAnswer`, `onStatusChange`, `onAuthorClick`

**사용 화면**: #4 Question Detail

---

### AnswerCard

**outsome-react 매핑**: 없음 (신규 개발, `CommentThread` 내부 CommentItem 스타일 참고)

개별 답변 카드.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 답변 ID |
| `author` | `{ name: string; avatarUrl?: string; batch?: string; role?: string }` | Yes | 작성자 정보 |
| `content` | `string` | Yes | 답변 내용 |
| `createdAt` | `string` | Yes | 작성일 |
| `voteCount` | `number` | Yes | 투표 수 |
| `isAccepted` | `boolean` | No | 채택된 답변 여부 |
| `isVoted` | `boolean` | No | 현재 사용자 투표 여부 |
| `onVote` | `() => void` | No | 투표 토글 |
| `onAccept` | `() => void` | No | 답변 채택 (질문 작성자만) |

**States**: 없음 (외부 제어)

**Events**: `onVote`, `onAccept`

**Variants**:
- `default`: 일반 답변
- `accepted`: 채택된 답변 (좌측 초록색 보더 + 체크 아이콘)
- `partner`: 파트너 답변 (상단에 "Partner Answer" 배지)

**사용 화면**: #4 Question Detail

---

### SummaryCard

**outsome-react 매핑**: 없음 (신규 개발)

AI 요약 카드.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `summary` | `string` | Yes | AI 요약 텍스트 |
| `answersUsed` | `number` | No | 요약에 사용된 답변 수 |
| `generatedAt` | `string` | No | 생성 시간 |

**States**: 없음 (stateless)

**Events**: 없음

**스타일**: 베이지 배경(`#f1eadd`) + 좌측 오렌지 보더(3px `#ff6600`) + AI 아이콘

**사용 화면**: #4 Question Detail

---

### QuestionForm

**outsome-react 매핑**: 없음 (신규 개발, `OfficeHoursForm` 폼 패턴 참고)

질문 작성/수정 폼.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `initialData` | `Partial<QuestionFormData>` | No | 수정 시 초기 데이터 |
| `onSubmit` | `(data: QuestionFormData) => void` | Yes | 제출 이벤트 |
| `onCancel` | `() => void` | Yes | 취소 이벤트 |
| `isSubmitting` | `boolean` | No | 제출 중 상태 |

**QuestionFormData 타입**:
```typescript
interface QuestionFormData {
  title: string;
  content: string;
  tags: string[];
  attachments: File[];
}
```

**States**:
- `title`: 제목 입력 값
- `content`: 내용 입력 값 (rich text 또는 markdown)
- `tags`: 선택된 태그 목록
- `attachments`: 첨부 파일 목록 (최대 5개)

**Events**: `onSubmit`, `onCancel`

**사용 화면**: #5 Question Create

---

## 8. 이벤트/오피스아워 컴포넌트

### EventCard

**outsome-react 매핑**: 없음 (신규 개발, `CompanyCard` 카드 레이아웃 참고)

이벤트 목록의 개별 카드.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 이벤트 ID |
| `title` | `string` | Yes | 이벤트 제목 |
| `type` | `'ONE_OFF' \| 'OFFICE_HOUR' \| 'IN_PERSON'` | Yes | 이벤트 유형 |
| `startTime` | `string` | Yes | 시작 시간 (ISO) |
| `endTime` | `string` | Yes | 종료 시간 (ISO) |
| `timezone` | `'PST' \| 'KST'` | No | 타임존 (기본: PST) |
| `location` | `string` | No | 장소 (온라인일 경우 URL) |
| `host` | `{ name: string; avatarUrl?: string }` | Yes | 주최자 정보 |
| `attendeeCount` | `number` | No | 참석자 수 |
| `maxAttendees` | `number` | No | 최대 참석자 수 |
| `status` | `'UPCOMING' \| 'ONGOING' \| 'COMPLETED' \| 'CANCELLED'` | Yes | 이벤트 상태 |
| `isRegistered` | `boolean` | No | 현재 사용자 등록 여부 |
| `onClick` | `() => void` | No | 카드 클릭 |

**States** (내부): `isHovered`

**Events**: `onClick`

**Variants**:
- 유형 배지: ONE_OFF(오렌지), OFFICE_HOUR(보라), IN_PERSON(초록)
- 상태에 따른 opacity: COMPLETED/CANCELLED일 경우 0.7

**사용 화면**: #6 Event Calendar, #2 Dashboard

---

### EventCalendarView

**outsome-react 매핑**: 없음 (신규 개발)

이벤트 캘린더 뷰. 월간/주간/리스트 뷰 전환.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `events` | `Event[]` | Yes | 이벤트 목록 |
| `view` | `'month' \| 'week' \| 'list'` | No | 뷰 모드 (기본: month) |
| `selectedDate` | `Date` | No | 선택된 날짜 |
| `onDateSelect` | `(date: Date) => void` | No | 날짜 선택 |
| `onEventClick` | `(eventId: string) => void` | No | 이벤트 클릭 |
| `onViewChange` | `(view: string) => void` | No | 뷰 변경 |
| `onMonthChange` | `(date: Date) => void` | No | 월 변경 (이전/다음) |

**States**:
- `currentMonth`: 현재 표시 월
- `currentView`: 현재 뷰 모드
- `selectedDate`: 선택된 날짜

**Events**: `onDateSelect`, `onEventClick`, `onViewChange`, `onMonthChange`

**Variants**:
- `month`: 월간 그리드 (7x5/6)
- `week`: 주간 타임라인
- `list`: 리스트 뷰 (EventCard 세로 나열)

**사용 화면**: #6 Event Calendar

---

### EventCreationForm

**outsome-react 매핑**: `OfficeHoursForm` 폼 스타일 참고 (신규 개발)

이벤트 생성 폼. 유형에 따라 필드 동적 변경.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `initialData` | `Partial<EventFormData>` | No | 수정 시 초기 데이터 |
| `onSubmit` | `(data: EventFormData) => void` | Yes | 제출 이벤트 |
| `onCancel` | `() => void` | Yes | 취소 이벤트 |
| `isSubmitting` | `boolean` | No | 제출 중 상태 |

**EventFormData 타입**:
```typescript
interface EventFormData {
  title: string;
  type: 'ONE_OFF' | 'OFFICE_HOUR' | 'IN_PERSON';
  description: string;
  startTime: string;  // ISO
  endTime: string;    // ISO
  timezone: 'PST' | 'KST';
  location?: string;  // IN_PERSON일 때 필수
  meetingUrl?: string; // 온라인일 때
  maxAttendees?: number;
  isRecurring?: boolean;  // OFFICE_HOUR일 때
  recurringPattern?: string;
}
```

**States**:
- 폼 필드별 입력 값
- `selectedType`: 이벤트 유형 (One-off/Office Hour/In-person 선택 시 필드 변경)

**Events**: `onSubmit`, `onCancel`

**유형별 필드 차이**:
- ONE_OFF: 기본 필드만
- OFFICE_HOUR: 반복 설정, 슬롯 시간 추가
- IN_PERSON: 장소 필드 필수

**사용 화면**: #7 Event Creation

---

### OfficeHourSchedulingForm

**outsome-react 매핑**: `OfficeHoursForm` (재사용 가능, 커스터마이즈)

관리자가 회사 팀 또는 메인 Founder 연락처를 지정해 오피스아워를 스케줄링하는 폼.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `partners` | `{ id: string; name: string }[]` | Yes | 파트너 목록 |
| `availableSlots` | `Slot[]` | Yes | 이용 가능한 슬롯 목록 |
| `onSubmit` | `(data: SlotRequestData) => void` | Yes | 신청 이벤트 |
| `instructions` | `string` | No | 안내 문구 |

**Slot 타입**:
```typescript
interface Slot {
  id: string;
  partnerId: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'REQUESTED' | 'CONFIRMED' | 'COMPLETED';
}
```

**SlotRequestData 타입**:
```typescript
interface SlotRequestData {
  slotId?: string;
  partnerId: string;
  topic: string;
  preferredTime: string;
  shareWithCofounders: boolean;
}
```

**States**: 폼 필드별 입력 값

**Events**: `onSubmit`

**사용 화면**: #8 Office Hour Scheduling

---

### SlotCard

**outsome-react 매핑**: 없음 (신규 개발)

개별 오피스아워 슬롯 카드.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 슬롯 ID |
| `partner` | `{ name: string; avatarUrl?: string; specialty?: string }` | Yes | 파트너 정보 |
| `startTime` | `string` | Yes | 시작 시간 |
| `endTime` | `string` | Yes | 종료 시간 |
| `status` | `'AVAILABLE' \| 'REQUESTED' \| 'CONFIRMED' \| 'COMPLETED'` | Yes | 슬롯 상태 |
| `requester` | `{ name: string; topic: string }` | No | 신청자 정보 (상태가 REQUESTED 이상일 때) |
| `onRequest` | `() => void` | No | 신청 버튼 클릭 |
| `onCancel` | `() => void` | No | 취소 버튼 클릭 |

**States** (내부): `isHovered`

**Events**: `onRequest`, `onCancel`

**Variants** (상태별 스타일):
- AVAILABLE: 초록 점선 테두리, "신청하기" 버튼
- REQUESTED: 노란 배경, "대기 중" 배지
- CONFIRMED: 파란 배경, "확정됨" 배지 + 상세 정보
- COMPLETED: 회색 배경, "완료" 배지

**사용 화면**: #8 Office Hour Slot Registration

---

### RequestCard

**outsome-react 매핑**: 없음 (신규 개발)

오피스아워 요청 카드 (파트너 대시보드용).

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 요청 ID |
| `requester` | `{ name: string; avatarUrl?: string; batch?: string; company?: string }` | Yes | 신청자 정보 |
| `topic` | `string` | Yes | 상담 주제 |
| `preferredTime` | `string` | Yes | 희망 시간 |
| `status` | `'PENDING' \| 'APPROVED' \| 'REJECTED'` | Yes | 요청 상태 |
| `requestedAt` | `string` | Yes | 신청일 |
| `onApprove` | `() => void` | No | 승인 |
| `onReject` | `() => void` | No | 거절 |

**States**: 없음 (외부 제어)

**Events**: `onApprove`, `onReject`

**Variants** (상태별):
- PENDING: 승인/거절 버튼 표시
- APPROVED: 초록 배지
- REJECTED: 빨간 배지

**사용 화면**: #8 Office Hour Slot Registration (파트너 뷰)

---

## 9. 과제 컴포넌트

### AssignmentCard

**outsome-react 매핑**: 없음 (신규 개발, `PostCard` 카드 스타일 참고)

과제 목록의 개별 카드.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 과제 ID |
| `title` | `string` | Yes | 과제 제목 |
| `description` | `string` | No | 과제 설명 (2줄 truncate) |
| `sessionTitle` | `string` | No | 관련 세션 이름 |
| `dueDate` | `string` | Yes | 마감일 (ISO) |
| `status` | `'NOT_STARTED' \| 'IN_PROGRESS' \| 'SUBMITTED' \| 'GRADED'` | Yes | 진행 상태 |
| `isOverdue` | `boolean` | No | 마감 초과 여부 |
| `submissionCount` | `number` | No | 제출 수 (관리자 뷰) |
| `totalCount` | `number` | No | 전체 대상 수 (관리자 뷰) |
| `onClick` | `() => void` | No | 카드 클릭 |

**States** (내부): `isHovered`

**Events**: `onClick`

**Variants** (상태별 배지):
- NOT_STARTED: 회색 배지
- IN_PROGRESS: 노란 배지
- SUBMITTED: 파란 배지
- GRADED: 초록 배지
- 마감 초과 시: 빨간 테두리

**스타일**:
```css
background-color: #ffffff;
border: 1px solid #e0d6c8;
border-radius: 8px;
padding: 16px;
/* 마감 초과 시 */
border-left: 3px solid #ef4444;
```

**사용 화면**: #11 Assignment List, #2 Dashboard

---

### AssignmentDetail

**outsome-react 매핑**: 없음 (신규 개발, `ArticleContent` 콘텐츠 렌더링 참고)

과제 상세 페이지 메인 콘텐츠.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 과제 ID |
| `title` | `string` | Yes | 과제 제목 |
| `content` | `string` | Yes | 과제 내용 (HTML/Markdown) |
| `sessionTitle` | `string` | No | 관련 세션 이름 |
| `dueDate` | `string` | Yes | 마감일 |
| `status` | `string` | Yes | 진행 상태 |
| `attachments` | `{ name: string; url: string; size: string }[]` | No | 첨부파일 |
| `submission` | `Submission` | No | 내 제출물 (있을 경우) |
| `feedback` | `Feedback` | No | 피드백 (있을 경우) |
| `onSubmit` | `() => void` | No | 제출하기 클릭 |

**Submission 타입**:
```typescript
interface Submission {
  id: string;
  content: string;
  link?: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'REVIEWED';
}
```

**Feedback 타입**:
```typescript
interface Feedback {
  id: string;
  reviewer: { name: string; avatarUrl?: string };
  content: string;
  grade?: string;
  createdAt: string;
}
```

**States**: 없음 (외부 제어)

**Events**: `onSubmit`

**사용 화면**: #12 Assignment Detail

---

### SubmissionForm

**outsome-react 매핑**: 없음 (신규 개발, `OfficeHoursForm` 폼 패턴 참고)

과제 제출 폼. 텍스트 + 링크 입력.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `assignmentId` | `string` | Yes | 과제 ID |
| `initialData` | `Partial<SubmissionData>` | No | 수정 시 초기 데이터 |
| `onSubmit` | `(data: SubmissionData) => void` | Yes | 제출 이벤트 |
| `onCancel` | `() => void` | Yes | 취소 이벤트 |
| `isSubmitting` | `boolean` | No | 제출 중 상태 |

**SubmissionData 타입**:
```typescript
interface SubmissionData {
  content: string;     // 텍스트 내용
  link?: string;       // 외부 링크 (GitHub, 문서 등)
  attachments: File[]; // 첨부파일 (최대 5개)
}
```

**States**: 폼 필드별 입력 값

**Events**: `onSubmit`, `onCancel`

**사용 화면**: #12 Assignment Detail (제출 영역)

---

### SubmissionStatusGrid

**outsome-react 매핑**: 없음 (신규 개발)

과제 제출 현황 그리드. 관리자/파트너가 모든 파운더의 제출 상태를 한눈에 확인.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `assignmentTitle` | `string` | Yes | 과제 제목 |
| `submissions` | `SubmissionStatus[]` | Yes | 제출 현황 목록 |
| `onUserClick` | `(userId: string) => void` | No | 사용자 클릭 |
| `onReview` | `(submissionId: string) => void` | No | 리뷰 클릭 |

**SubmissionStatus 타입**:
```typescript
interface SubmissionStatus {
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  batch?: string;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'REVIEWED';
  submittedAt?: string;
  grade?: string;
}
```

**States**: 없음 (외부 제어)

**Events**: `onUserClick`, `onReview`

**스타일**: 그리드 레이아웃 (카드 또는 테이블)
- NOT_SUBMITTED: 회색 배경
- SUBMITTED: 파란 배경 + "제출됨" 배지
- REVIEWED: 초록 배경 + 성적 표시

**사용 화면**: #13 Submission Status

---

### FeedbackCard

**outsome-react 매핑**: 없음 (신규 개발, `CommentThread` CommentItem 스타일 참고)

과제 피드백 카드.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `reviewer` | `{ name: string; avatarUrl?: string; role?: string }` | Yes | 리뷰어 정보 |
| `content` | `string` | Yes | 피드백 내용 |
| `grade` | `string` | No | 성적/등급 |
| `createdAt` | `string` | Yes | 작성일 |

**States**: 없음 (stateless)

**Events**: 없음

**스타일**: 좌측 초록 보더(3px) + 아바타 + 리뷰어 정보 + 피드백 텍스트

**사용 화면**: #12 Assignment Detail

---

## 10. 그룹 컴포넌트

### GroupCard

**outsome-react 매핑**: `GroupBrowseModal` 내부 groupItem 스타일 참고 (신규 개발)

그룹 목록의 개별 카드.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 그룹 ID |
| `name` | `string` | Yes | 그룹 이름 |
| `description` | `string` | No | 그룹 설명 |
| `memberCount` | `number` | Yes | 멤버 수 |
| `memberAvatars` | `string[]` | No | 멤버 아바타 (최대 5개 스택) |
| `lastActive` | `string` | No | 마지막 활동 시간 |
| `isJoined` | `boolean` | No | 현재 사용자 가입 여부 |
| `badge` | `string` | No | 그룹 배지 (예: "Official") |
| `onClick` | `() => void` | No | 카드 클릭 |
| `onJoin` | `() => void` | No | 가입 버튼 클릭 |

**States** (내부): `isHovered`

**Events**: `onClick`, `onJoin`

**스타일**: 아바타 스택(겹침 -8px) + 그룹 정보 + 가입 버튼

**사용 화면**: #17 Group List

---

### GroupDetail

**outsome-react 매핑**: 없음 (신규 개발, `BookfaceFeedPage` 레이아웃 참고)

그룹 상세 페이지. 그룹 헤더 + 임베디드 피드 구조.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 그룹 ID |
| `name` | `string` | Yes | 그룹 이름 |
| `description` | `string` | No | 그룹 설명 |
| `memberCount` | `number` | Yes | 멤버 수 |
| `createdBy` | `{ name: string; avatarUrl?: string }` | Yes | 생성자 정보 |
| `isJoined` | `boolean` | Yes | 현재 사용자 가입 여부 |
| `isAdmin` | `boolean` | No | 현재 사용자가 그룹 관리자인지 |
| `posts` | `PostCardProps[]` | Yes | 그룹 피드 게시글 |
| `members` | `Member[]` | Yes | 멤버 목록 |
| `onJoin` | `() => void` | No | 가입 버튼 |
| `onLeave` | `() => void` | No | 탈퇴 버튼 |
| `onManage` | `() => void` | No | 관리 버튼 (관리자만) |

**States**: 없음 (외부 제어)

**Events**: `onJoin`, `onLeave`, `onManage`

**사용 화면**: #18 Group Detail

---

### GroupManagementForm

**outsome-react 매핑**: 없음 (신규 개발)

그룹 생성/관리 폼.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `initialData` | `Partial<GroupFormData>` | No | 수정 시 초기 데이터 |
| `onSubmit` | `(data: GroupFormData) => void` | Yes | 제출 이벤트 |
| `onCancel` | `() => void` | Yes | 취소 이벤트 |
| `onDelete` | `() => void` | No | 삭제 이벤트 (수정 시만) |
| `isSubmitting` | `boolean` | No | 제출 중 상태 |

**GroupFormData 타입**:
```typescript
interface GroupFormData {
  name: string;
  description: string;
  isPublic: boolean;
}
```

**States**: 폼 필드별 입력 값

**Events**: `onSubmit`, `onCancel`, `onDelete`

**사용 화면**: #19 Group Management

---

### MemberList

**outsome-react 매핑**: `ConversationSidebar` 참여자 목록 참고 (커스터마이즈)

그룹 멤버 목록.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `members` | `Member[]` | Yes | 멤버 목록 |
| `isAdmin` | `boolean` | No | 관리자 여부 (삭제 버튼 표시) |
| `onMemberClick` | `(userId: string) => void` | No | 멤버 클릭 |
| `onRemoveMember` | `(userId: string) => void` | No | 멤버 제거 (관리자) |

**Member 타입**:
```typescript
interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  batch?: string;
  company?: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}
```

**States**: 없음 (외부 제어)

**Events**: `onMemberClick`, `onRemoveMember`

**사용 화면**: #18 Group Detail (사이드바), #19 Group Management

---

## 11. 관리자 컴포넌트

### BatchCard

**outsome-react 매핑**: `BatchBadge` 배지 스타일 참고 (신규 개발)

배치 관리 목록의 카드.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 배치 ID |
| `name` | `string` | Yes | 배치 이름 (예: "W24", "S24") |
| `status` | `'ACTIVE' \| 'UPCOMING' \| 'COMPLETED' \| 'ARCHIVED'` | Yes | 배치 상태 |
| `startDate` | `string` | Yes | 시작일 |
| `endDate` | `string` | Yes | 종료일 |
| `founderCount` | `number` | Yes | 파운더 수 |
| `sessionCount` | `number` | No | 세션 수 |
| `onClick` | `() => void` | No | 카드 클릭 |
| `onEdit` | `() => void` | No | 수정 버튼 클릭 |

**States** (내부): `isHovered`

**Events**: `onClick`, `onEdit`

**Variants** (상태별 배지):
- ACTIVE: 초록 배지(`#22c55e`)
- UPCOMING: 파란 배지(`#555AB9`)
- COMPLETED: 회색 배지
- ARCHIVED: 투명 배지

**사용 화면**: #20 Admin: Batch Management

---

### BatchForm

**outsome-react 매핑**: 없음 (신규 개발)

배치 생성/수정 폼.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `initialData` | `Partial<BatchFormData>` | No | 수정 시 초기 데이터 |
| `onSubmit` | `(data: BatchFormData) => void` | Yes | 제출 이벤트 |
| `onCancel` | `() => void` | Yes | 취소 이벤트 |
| `isSubmitting` | `boolean` | No | 제출 중 상태 |

**BatchFormData 타입**:
```typescript
interface BatchFormData {
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ARCHIVED';
}
```

**States**: 폼 필드별 입력 값

**Events**: `onSubmit`, `onCancel`

**사용 화면**: #20 Admin: Batch Management (모달 또는 별도 페이지)

---

### UserInviteForm

**outsome-react 매핑**: 없음 (신규 개발)

사용자 초대 폼. 이메일 + 역할 선택.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `batchId` | `string` | Yes | 초대할 배치 ID |
| `onSubmit` | `(data: InviteData) => void` | Yes | 초대 이벤트 |
| `onCancel` | `() => void` | Yes | 취소 이벤트 |
| `isSubmitting` | `boolean` | No | 제출 중 상태 |

**InviteData 타입**:
```typescript
interface InviteData {
  emails: string[];  // 쉼표/줄바꿈 구분
  role: 'FOUNDER' | 'PARTNER' | 'ALUMNI';
  batchId: string;
  message?: string;  // 초대 메시지
}
```

**States**:
- `emailInput`: 이메일 입력 값
- `parsedEmails`: 파싱된 이메일 목록 (태그 형태 표시)
- `selectedRole`: 선택된 역할

**Events**: `onSubmit`, `onCancel`

**사용 화면**: #21 Admin: User Management

---

### UserTable

**outsome-react 매핑**: `PersonListItem` 리스트 아이템 스타일 참고 (신규 개발)

사용자 관리 테이블.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `users` | `UserRow[]` | Yes | 사용자 목록 |
| `sortBy` | `string` | No | 정렬 기준 |
| `sortOrder` | `'asc' \| 'desc'` | No | 정렬 방향 |
| `onSort` | `(field: string) => void` | No | 정렬 변경 |
| `onUserClick` | `(userId: string) => void` | No | 사용자 클릭 |
| `onRoleChange` | `(userId: string, role: string) => void` | No | 역할 변경 |
| `onDeactivate` | `(userId: string) => void` | No | 비활성화 |
| `searchQuery` | `string` | No | 검색어 |
| `onSearch` | `(query: string) => void` | No | 검색 이벤트 |

**UserRow 타입**:
```typescript
interface UserRow {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'PARTNER' | 'FOUNDER' | 'ALUMNI';
  batch?: string;
  company?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'INVITED';
  lastLoginAt?: string;
}
```

**States**: 없음 (외부 제어)

**Events**: `onSort`, `onUserClick`, `onRoleChange`, `onDeactivate`, `onSearch`

**컬럼 정의**:
| 컬럼 | 너비 | 내용 |
|-------|------|------|
| 이름 | 25% | 아바타 + 이름 + 배치 배지 |
| 이메일 | 20% | 이메일 |
| 역할 | 15% | RoleBadge 컴포넌트 |
| 상태 | 10% | StatusBadge |
| 배치 | 10% | BatchBadge |
| 마지막 로그인 | 15% | 상대 시간 |
| 액션 | 5% | ... 메뉴 |

**사용 화면**: #21 Admin: User Management

---

## 12. 공통 컴포넌트

### Avatar

**outsome-react 매핑**: `Avatar` (직접 재사용)

프로필 아바타 컴포넌트.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `src` | `string` | No | 이미지 URL |
| `alt` | `string` | Yes | 대체 텍스트 (이니셜 생성에도 사용) |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | No | 크기 (기본: md) |
| `badge` | `string` | No | 배지 텍스트 (예: 배치명) |
| `showBadge` | `boolean` | No | 배지 표시 여부 |
| `onClick` | `() => void` | No | 클릭 이벤트 |

**크기 매핑**: xs=24, sm=32, md=40, lg=48, xl=64

**States** (내부):
- `imgError`: 이미지 로드 실패 시 이니셜 폴백
- `isHovered`: 호버 상태

**사용 화면**: 전체 (#1~#21)

---

### BatchBadge

**outsome-react 매핑**: `BatchBadge` (직접 재사용, 색상 커스터마이즈)

배치 배지 컴포넌트.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `batch` | `string` | Yes | 배치명 (예: "W24") |
| `size` | `'sm' \| 'md' \| 'lg'` | No | 크기 (기본: md) |
| `variant` | `'default' \| 'outline'` | No | 스타일 변형 |

**MVP 커스터마이즈**: 기본 색상을 `#555AB9` -> `#ff6600`(YC 오렌지) 또는 `#f1eadd`(베이지 배경)으로 변경

**사용 화면**: 전체 (사용자 정보 표시 영역)

---

### RoleBadge

**outsome-react 매핑**: 없음 (신규 개발, `TagBadge` 구조 참고)

사용자 역할 배지.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | `'ADMIN' \| 'PARTNER' \| 'FOUNDER' \| 'ALUMNI'` | Yes | 역할 |
| `size` | `'sm' \| 'md'` | No | 크기 (기본: md) |

**역할별 색상**:
| 역할 | 배경색 | 텍스트색 |
|------|--------|---------|
| ADMIN | `#ef4444` (빨간) | `#ffffff` |
| PARTNER | `#ff6600` (오렌지) | `#ffffff` |
| FOUNDER | `#22c55e` (초록) | `#ffffff` |
| ALUMNI | `#f1eadd` (베이지) | `#2F2C26` |

**사용 화면**: #21 User Management, #4 Question Detail (답변자 역할)

---

### StatusBadge

**outsome-react 매핑**: `TagBadge` color prop 활용 (재사용 가능)

범용 상태 배지.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | Yes | 상태 텍스트 |
| `color` | `'green' \| 'red' \| 'amber' \| 'blue' \| 'gray' \| 'purple'` | No | 색상 (기본: gray) |
| `size` | `'sm' \| 'md'` | No | 크기 (기본: md) |

**일반적인 상태-색상 매핑**:
| 상태 | 색상 | 용도 |
|------|------|------|
| Open / Active | green | 질문, 배치 |
| Closed / Archived | gray | 질문, 배치 |
| Answered | blue | 질문 |
| Pending / In Progress | amber | 과제, 요청 |
| Overdue / Rejected | red | 과제, 요청 |
| Confirmed | purple | 오피스아워 |

**사용 화면**: 전체 (상태 표시 영역)

---

### FileUploader

**outsome-react 매핑**: 없음 (신규 개발)

파일 업로드 컴포넌트. Drag & Drop + 클릭 지원.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `maxFiles` | `number` | No | 최대 파일 수 (기본: 5) |
| `maxSizeMB` | `number` | No | 파일당 최대 크기 MB (기본: 10) |
| `acceptedTypes` | `string[]` | No | 허용 MIME 타입 |
| `files` | `UploadedFile[]` | Yes | 현재 파일 목록 |
| `onFilesChange` | `(files: UploadedFile[]) => void` | Yes | 파일 변경 이벤트 |
| `onError` | `(error: string) => void` | No | 에러 이벤트 |
| `disabled` | `boolean` | No | 비활성 상태 |

**UploadedFile 타입**:
```typescript
interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;  // 0~100
  status: 'uploading' | 'completed' | 'error';
  url?: string;      // 업로드 완료 후 URL
}
```

**States** (내부):
- `isDragging`: 드래그 오버 상태
- 파일별 업로드 진행률

**Events**: `onFilesChange`, `onError`

**스타일**: 점선 테두리 + 드래그 영역 + 파일 리스트

**사용 화면**: #5 Question Create, #12 Assignment Detail, #16 Post Create

---

### DateTimePicker

**outsome-react 매핑**: 없음 (신규 개발)

날짜/시간 선택 컴포넌트. PST/KST 타임존 지원.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | `string` | No | 선택된 날짜/시간 (ISO) |
| `onChange` | `(value: string) => void` | Yes | 변경 이벤트 |
| `timezone` | `'PST' \| 'KST'` | No | 타임존 (기본: PST) |
| `onTimezoneChange` | `(tz: string) => void` | No | 타임존 변경 |
| `showTime` | `boolean` | No | 시간 선택 표시 (기본: true) |
| `minDate` | `string` | No | 최소 선택 가능 날짜 |
| `maxDate` | `string` | No | 최대 선택 가능 날짜 |
| `disabled` | `boolean` | No | 비활성 상태 |

**States** (내부):
- `isOpen`: 캘린더 드롭다운 열림
- `currentMonth`: 표시 월
- `selectedTimezone`: PST/KST 토글

**Events**: `onChange`, `onTimezoneChange`

**사용 화면**: #7 Event Creation, #10 Session Create, 관리자 폼

---

### Modal

**outsome-react 매핑**: `GroupBrowseModal` overlay/modal 스타일 참고 (신규 개발)

범용 모달/다이얼로그 컴포넌트.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | 열림 상태 |
| `onClose` | `() => void` | Yes | 닫기 이벤트 |
| `title` | `string` | No | 모달 제목 |
| `children` | `ReactNode` | Yes | 모달 내용 |
| `size` | `'sm' \| 'md' \| 'lg'` | No | 크기 (기본: md) |
| `showClose` | `boolean` | No | 닫기 버튼 표시 (기본: true) |
| `footer` | `ReactNode` | No | 하단 액션 영역 |

**크기 매핑**: sm=400px, md=600px, lg=800px

**States**: 없음 (외부 제어)

**Events**: `onClose` (오버레이 클릭 / ESC 키 / X 버튼)

**스타일** (GroupBrowseModal 참고):
```css
overlay: rgba(0,0,0,0.5), z-index: 1000
modal: #ffffff, border-radius: 12px, box-shadow: 0 8px 30px rgba(0,0,0,0.12)
max-height: 85vh
```

**사용 화면**: 전체 (확인 다이얼로그, 폼 모달 등)

---

### Toast

**outsome-react 매핑**: 없음 (신규 개발)

알림 토스트 컴포넌트.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | `string` | Yes | 메시지 |
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | No | 타입 (기본: info) |
| `duration` | `number` | No | 표시 시간 ms (기본: 3000) |
| `onClose` | `() => void` | No | 닫기 이벤트 |

**타입별 스타일**:
| 타입 | 좌측 보더 색상 | 아이콘 |
|------|--------------|-------|
| success | `#22c55e` | 체크 |
| error | `#ef4444` | X |
| warning | `#f59e0b` | ! |
| info | `#555AB9` | i |

**States**: 없음 (외부 제어, Context/Provider 패턴 권장)

**사용 화면**: 전체 (작업 완료/에러 알림)

---

### Pagination

**outsome-react 매핑**: 없음 (신규 개발)

페이지네이션 컴포넌트.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `currentPage` | `number` | Yes | 현재 페이지 |
| `totalPages` | `number` | Yes | 전체 페이지 수 |
| `onPageChange` | `(page: number) => void` | Yes | 페이지 변경 |
| `siblingCount` | `number` | No | 현재 페이지 양옆 표시 수 (기본: 1) |

**States**: 없음 (외부 제어)

**Events**: `onPageChange`

**스타일**: `<< < 1 2 [3] 4 5 > >>` 패턴

**사용 화면**: #3 Question List, #11 Assignment List, #21 User Management

---

### SearchInput

**outsome-react 매핑**: `BookfaceHeader` 내부 검색 + `DirectoryFilters` 검색 참고 (재사용)

검색 입력 컴포넌트.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | `string` | Yes | 검색어 |
| `onChange` | `(value: string) => void` | Yes | 변경 이벤트 |
| `onSubmit` | `(value: string) => void` | No | 엔터 제출 |
| `placeholder` | `string` | No | 플레이스홀더 (기본: "검색...") |
| `debounceMs` | `number` | No | 디바운스 ms (기본: 300) |

**States** (내부): `isFocused`

**Events**: `onChange`, `onSubmit`

**스타일**: 돋보기 아이콘 + 입력 필드 + 둥근 모서리

**사용 화면**: #3, #6, #9, #11, #17, #21

---

### SessionCard

**outsome-react 매핑**: 없음 (신규 개발, `EventCard`와 유사)

세션(강의/워크숍) 카드.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | 세션 ID |
| `title` | `string` | Yes | 세션 제목 |
| `description` | `string` | No | 세션 설명 |
| `speaker` | `{ name: string; avatarUrl?: string; title?: string }` | Yes | 발표자 정보 |
| `date` | `string` | Yes | 세션 날짜 |
| `time` | `string` | Yes | 세션 시간 |
| `batchId` | `string` | No | 배치 ID |
| `status` | `'UPCOMING' \| 'COMPLETED'` | Yes | 상태 |
| `assignmentCount` | `number` | No | 관련 과제 수 |
| `onClick` | `() => void` | No | 클릭 이벤트 |

**States** (내부): `isHovered`

**Events**: `onClick`

**사용 화면**: #9 Session List, #2 Dashboard

---

### SessionForm

**outsome-react 매핑**: 없음 (신규 개발)

세션 생성/수정 폼.

| Props | Type | Required | Description |
|-------|------|----------|-------------|
| `initialData` | `Partial<SessionFormData>` | No | 수정 시 초기 데이터 |
| `batches` | `{ id: string; name: string }[]` | Yes | 배치 목록 |
| `onSubmit` | `(data: SessionFormData) => void` | Yes | 제출 이벤트 |
| `onCancel` | `() => void` | Yes | 취소 이벤트 |
| `isSubmitting` | `boolean` | No | 제출 중 상태 |

**SessionFormData 타입**:
```typescript
interface SessionFormData {
  title: string;
  description: string;
  speakerName: string;
  speakerTitle?: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: 'PST' | 'KST';
  batchId: string;
  meetingUrl?: string;
  materials?: File[];
}
```

**States**: 폼 필드별 입력 값

**Events**: `onSubmit`, `onCancel`

**사용 화면**: #10 Session Create/Edit

---

## 13. 화면별 컴포넌트 매핑

각 화면에서 사용하는 컴포넌트 목록입니다.

### #1 Login

| 컴포넌트 | 용도 |
|----------|------|
| `LinkedInLoginButton` | OAuth 로그인 버튼 |
| `AuthCallback` | 콜백 처리 (화면 없음) |

**레이아웃**: 단일 중앙 정렬, 로고 + 제목 + 버튼

---

### #2 Dashboard

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 전체 레이아웃 |
| `TopNavbar` | 상단 네비게이션 |
| `LeftSidebar` | 좌측 사이드바 |
| `PageHeader` | "대시보드" 제목 |
| `SessionCard` | 다음 세션 요약 |
| `AssignmentCard` | 마감 임박 과제 |
| `EventCard` | 다가오는 이벤트 |
| `PostCard` | 최근 피드 미리보기 |

---

### #3 Question List

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "Q&A" + "질문하기" 버튼 |
| `FeedTabs` | 전체/내 질문/미답변 탭 |
| `SearchInput` | 질문 검색 |
| `QuestionCard` | 질문 카드 목록 |
| `Pagination` | 페이지네이션 |
| `EmptyState` | 질문 없음 |

---

### #4 Question Detail

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `QuestionDetail` | 질문 상세 |
| `SummaryCard` | AI 요약 |
| `AnswerCard` | 답변 목록 |
| `StatusBadge` | 질문 상태 |
| `RoleBadge` | 답변자 역할 |

---

### #5 Question Create

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "질문 작성" |
| `QuestionForm` | 질문 폼 |
| `FileUploader` | 첨부파일 |

---

### #6 Event Calendar

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "이벤트" + 뷰 전환 + "이벤트 만들기" |
| `EventCalendarView` | 캘린더/리스트 뷰 |
| `EventCard` | 이벤트 카드 (리스트 뷰) |

---

### #7 Event Creation

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "이벤트 만들기" |
| `EventCreationForm` | 이벤트 폼 |
| `DateTimePicker` | 날짜/시간 선택 |

---

### #8 Office Hour Slot Registration

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "오피스 아워" |
| `SlotRegistrationForm` | 슬롯 신청 폼 (OfficeHoursForm 기반) |
| `SlotCard` | 슬롯 카드 목록 |
| `RequestCard` | 요청 카드 (파트너 뷰) |

---

### #9 Session List

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "세션" |
| `FeedTabs` | 예정/완료 탭 |
| `SessionCard` | 세션 카드 목록 |
| `SearchInput` | 세션 검색 |

---

### #10 Session Create/Edit

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "세션 만들기" / "세션 수정" |
| `SessionForm` | 세션 폼 |
| `DateTimePicker` | 날짜/시간 선택 |

---

### #11 Assignment List

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "과제" |
| `FeedTabs` | 전체/진행중/완료 탭 |
| `AssignmentCard` | 과제 카드 목록 |
| `SearchInput` | 과제 검색 |
| `Pagination` | 페이지네이션 |

---

### #12 Assignment Detail

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `AssignmentDetail` | 과제 상세 |
| `SubmissionForm` | 제출 폼 |
| `FeedbackCard` | 피드백 표시 |
| `FileUploader` | 첨부파일 업로드 |
| `StatusBadge` | 과제 상태 |

---

### #13 Submission Status

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "제출 현황" |
| `SubmissionStatusGrid` | 제출 현황 그리드 |
| `Avatar` | 사용자 아바타 |
| `StatusBadge` | 제출 상태 배지 |

---

### #14 Feed

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 3-column 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `LeftSidebar` | 좌측 사이드바 |
| `FeedTabs` | 전체/고정/내 글 탭 |
| `InlineComposer` | 글쓰기 입력 |
| `PostCard` | 게시글 카드 목록 |
| `PersonCard` | 우측 "팔로우 추천" |

---

### #15 Post Detail

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 2-column 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PostCard` | 게시글 상세 |
| `CommentThread` | 댓글 스레드 |
| `ConversationSidebar` | 참여자 목록 |

---

### #16 Post Create

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "글 작성" |
| `PostCreateForm` | 게시글 폼 |
| `FileUploader` | 이미지/첨부파일 |

---

### #17 Group List

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "그룹" + "그룹 만들기" |
| `SearchInput` | 그룹 검색 |
| `GroupCard` | 그룹 카드 목록 |
| `FeedTabs` | 내 그룹/공개 그룹 탭 |

---

### #18 Group Detail

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 2-column 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `GroupDetail` | 그룹 헤더 + 피드 |
| `InlineComposer` | 그룹 내 글쓰기 |
| `PostCard` | 그룹 피드 게시글 |
| `MemberList` | 우측 멤버 목록 |

---

### #19 Group Management

| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 레이아웃 |
| `TopNavbar` | 네비게이션 |
| `PageHeader` | "그룹 관리" |
| `GroupManagementForm` | 그룹 설정 폼 |
| `MemberList` | 멤버 관리 (추가/제거) |

---

### #20 Admin: Batch Management

| 컴포넌트 | 용도 |
|----------|------|
| `AdminLayout` | 관리자 레이아웃 |
| `TopNavbar` | 네비게이션 (admin variant) |
| `AdminSidebar` | 관리자 사이드바 |
| `PageHeader` | "배치 관리" + "배치 추가" |
| `BatchCard` | 배치 카드 목록 |
| `BatchForm` | 배치 생성/수정 모달 |
| `Modal` | 폼 모달 |
| `StatusBadge` | 배치 상태 |

---

### #21 Admin: User Management

| 컴포넌트 | 용도 |
|----------|------|
| `AdminLayout` | 관리자 레이아웃 |
| `TopNavbar` | 네비게이션 (admin variant) |
| `AdminSidebar` | 관리자 사이드바 |
| `PageHeader` | "사용자 관리" + "초대하기" |
| `SearchInput` | 사용자 검색 |
| `UserTable` | 사용자 테이블 |
| `UserInviteForm` | 초대 모달 |
| `Modal` | 폼 모달 |
| `RoleBadge` | 역할 배지 |
| `BatchBadge` | 배치 배지 |
| `Pagination` | 페이지네이션 |

---

## 부록: 컴포넌트 총 개수 요약

| 카테고리 | 재사용 (outsome-react) | 신규 개발 | 합계 |
|----------|----------------------|----------|------|
| 레이아웃 | 0 | 4 | 4 |
| 인증 | 0 | 2 | 2 |
| 네비게이션 | 2 (BookfaceHeader, LeftSidebar) | 1 (AdminSidebar) | 3 |
| 피드/커뮤니티 | 4 (PostCard, CommentThread, FeedTabs, PersonCard) | 3 (InlineComposer, LikeButton, PostCreateForm) | 7 |
| 질문 | 0 | 5 (QuestionCard, QuestionDetail, AnswerCard, SummaryCard, QuestionForm) | 5 |
| 이벤트/오피스아워 | 1 (OfficeHoursForm) | 5 (EventCard, EventCalendarView, EventCreationForm, SlotCard, RequestCard) | 6 |
| 과제 | 0 | 5 (AssignmentCard, AssignmentDetail, SubmissionForm, SubmissionStatusGrid, FeedbackCard) | 5 |
| 그룹 | 1 (GroupBrowseModal) | 3 (GroupCard, GroupDetail, GroupManagementForm) | 4 |
| 관리자 | 0 | 4 (BatchCard, BatchForm, UserInviteForm, UserTable) | 4 |
| 공통 | 3 (Avatar, BatchBadge, TagBadge) | 9 (RoleBadge, StatusBadge, FileUploader, DateTimePicker, Modal, Toast, Pagination, SearchInput, SessionCard + SessionForm) | 12 |
| **합계** | **11** | **41** | **52** |

> **참고**: SlotRegistrationForm은 OfficeHoursForm의 커스터마이즈 래핑이므로 "재사용" 카테고리에 포함.
> MemberList는 ConversationSidebar 참고 커스터마이즈이므로 "신규 개발"에 포함.
