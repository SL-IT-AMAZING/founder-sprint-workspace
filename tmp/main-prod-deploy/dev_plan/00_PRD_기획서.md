# Founder Sprint MVP 기획서

**문서 버전**: v1.0  
**작성일**: 2026년 1월 21일  
**클라이언트**: Peter Shin (YC W20)  
**개발사**: SL:IT (전도현)  

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [목적 및 전제](#2-목적-및-전제)
3. [사용자 역할 및 권한](#3-사용자-역할-및-권한)
4. [핵심 기능 명세](#4-핵심-기능-명세)
5. [화면 구성안](#5-화면-구성안)
6. [데이터 모델](#6-데이터-모델)
7. [알림 정책](#7-알림-정책)
8. [기술 요구사항](#8-기술-요구사항)
9. [제외 항목](#9-제외-항목)
10. [일정 및 예산](#10-일정-및-예산)

---

## 1. 프로젝트 개요

### 1.1 프로젝트명
**Founder Sprint Workspace MVP**

### 1.2 한 줄 정의
> "Batch(기수) 기반으로 질문-피드백-요약이 반복되는 Execution 중심 워크스페이스"

### 1.3 배경
현재 Founder Sprint 프로그램은 카카오톡, Google Docs, 이메일 등 분산된 도구로 운영되고 있습니다. 이를 하나의 통합된 워크스페이스로 옮겨 운영 효율성을 검증하고자 합니다.

### 1.4 핵심 가치
- **기수(Batch) 단위 완전 분리**: 각 기수의 데이터와 활동이 독립적으로 관리됨
- **운영 중심 설계**: 커뮤니티/소셜 기능이 아닌, 실행과 피드백에 집중
- **지식 자산 축적**: 질문-답변-요약을 통한 체계적인 지식 아카이빙

---

## 2. 목적 및 전제

### 2.1 목적
- YC Bookface의 기능적 복제가 **아님**
- 향후 외부 SaaS 확장을 전제로 하지 **않음**
- **Outsome / Founder Sprint 내부 전용** 운영 실험용 MVP
- 소수 인원, Batch(기수) 단위 운영 구조 검증

### 2.2 전제 조건
| 항목 | 내용 |
|------|------|
| 사용 범위 | Outsome, Founder Sprint 내부 전용 |
| 운영 규모 | 기수당 Founder 10명 이내, Mentor 10명 정도 |
| 동시 운영 기수 | 1개 (동시에 여러 기수 운영하지 않음) |
| UX/UI 완성도 | 빠른 운영 검증 우선, 완성도보다 기능 동작 중심 |
| 제품 수명 | **6개월 이내 폐기 또는 전면 재작성 가능성** 전제 |

### 2.3 성공 기준
- 1개 기수(Batch)를 본 시스템으로 완주할 수 있는가?
- 기존 분산 도구(카톡, 이메일, Google Docs) 대비 운영 효율이 개선되는가?

---

## 3. 사용자 역할 및 권한

### 3.1 역할 정의

| 역할 | 설명 | 예상 인원 |
|------|------|----------|
| **Admin** | 전체 운영 주체. Peter Shin. | 1명 |
| **Mentor** | Founder의 질문에 답변하고 피드백 제공 | 기수당 약 10명 |
| **Founder** | 프로그램 참가자. 질문, 과제 제출, 오피스아워 요청 | 기수당 10명 이내 |

### 3.2 권한 매트릭스

| 기능 | Admin | Mentor | Founder |
|------|:-----:|:------:|:-------:|
| **Batch 관리** |
| Batch 생성/수정/종료 | ✅ | ❌ | ❌ |
| 사용자 초대 | ✅ | ❌ | ❌ |
| **질문/답변/요약** |
| 질문 작성 | ❌ | ❌ | ✅ |
| 질문 열람 | ✅ | ✅ | ✅ |
| 답변 작성 | ✅ | ✅ | ❌ |
| 요약 작성 | ✅ | ❌ | ❌ |
| **오피스아워** |
| 슬롯 등록 | ✅ | ✅ | ❌ |
| 오피스아워 요청 | ❌ | ❌ | ✅ |
| 요청 승인/거절 | ✅ | ✅ (본인 슬롯) | ❌ |
| **세션/슬라이드** |
| 세션 등록/수정 | ✅ | ❌ | ❌ |
| 세션 열람 | ✅ | ✅ | ✅ |
| **과제** |
| 과제 생성 | ✅ | ❌ | ❌ |
| 과제 제출 | ❌ | ❌ | ✅ |
| 피드백 작성 | ✅ | ✅ | ❌ |
| 제출 현황 조회 | ✅ | ✅ | ❌ (본인만) |
| **커뮤니티** |
| 게시글 작성 | ✅ | ✅ | ✅ |
| 댓글/좋아요 | ✅ | ✅ | ✅ |
| 게시글 비공개/삭제 | ✅ | ❌ (본인만) | ❌ (본인만) |
| 공지 등록 (상단 고정) | ✅ | ❌ | ❌ |

### 3.3 사용자 등록 방식
- **초대 기반**: Admin이 이메일 주소로 사용자 초대
- **인증 방식**: LinkedIn OAuth 로그인
- **Founder 재참여**: 불가 (1인 1기수 원칙, LinkedIn ID 기준 검증)
- **Mentor 재참여**: 가능 (여러 기수 참여 가능)

### 3.4 초대 정책

| 항목 | 내용 |
|------|------|
| 초대 유효 기간 | **7일** (만료 시 재발송 필요) |
| 이메일 매칭 | LinkedIn 계정 이메일 기준 (초대 이메일은 알림용) |
| 초대 취소 | Admin이 가능 (초대 대기 상태에서만) |
| 중복 초대 | 동일 이메일로 중복 초대 불가 |
| 역할 변경 | 같은 Batch 내 역할 변경 불가 |

---

## 4. 핵심 기능 명세

### 4.1 Batch(기수) 관리

#### 4.1.1 개요
모든 데이터는 Batch(기수) 단위로 완전히 분리됩니다. 한 사용자는 하나의 Active Batch에만 속합니다.

#### 4.1.2 Batch 상태

| 상태 | 설명 |
|------|------|
| **Active** | 현재 운영 중인 기수. 모든 기능 사용 가능 |
| **Archived** | 종료된 기수. 전체 Read-only. 열람만 가능, 수정/추가 불가 |

#### 4.1.3 기능 상세

| 기능 | 설명 |
|------|------|
| Batch 생성 | Admin이 새 기수 생성 (이름, 기간, 설명) |
| Batch 종료 | Admin이 수동으로 Archived 상태로 전환 |
| 동시 운영 | **불가** - 한 번에 1개의 Active Batch만 존재 |
| Archived 열람 | 해당 기수 참여자 + Admin만 열람 가능 |

#### 4.1.4 Batch 제약 사항

| 제약 | 설명 |
|------|------|
| 생성 제한 | Active Batch가 존재하면 새 Batch 생성 버튼 비활성화 |
| 삭제 | **불가** (잘못 생성 시 DB 직접 처리) |
| 재활성화 | **불가** (Archived → Active 전환 불가) |
| 이름 | 최대 100자, 중복 허용 |

#### 4.1.5 Batch 정보 항목
- Batch 이름 (예: "Founder Sprint 5기")
- 시작일
- 종료 예정일
- 설명 (선택, 최대 500자)
- 상태 (Active / Archived)

---

### 4.2 질문 → 답변 → 요약

#### 4.2.1 개요
Founder가 질문을 작성하면, Mentor/Admin이 답변하고, 최종적으로 요약을 작성하여 질문을 마무리합니다. 이 요약이 지식 자산의 핵심입니다.

#### 4.2.2 질문 (Question)

| 항목 | 내용 |
|------|------|
| 작성 권한 | Founder만 |
| 제목 | 텍스트 (필수, **최대 200자**) |
| 내용 | 텍스트 (필수, **최대 10,000자**) |
| 첨부파일 | 이미지(jpg, png, gif), PDF (**최대 5개, 각 10MB**) |
| 상태 | Open / Closed |
| 수정 | 답변이 달리기 전까지만 가능 |
| 삭제 | 불가 |
| 공개 범위 | 기수 내 전체 공개 (비공개 질문 없음) |
| Mentor 지정 | 없음 (전체 Mentor에게 공개) |
| 카테고리/태그 | 없음 |

#### 4.2.3 답변 (Answer)

| 항목 | 내용 |
|------|------|
| 작성 권한 | Admin, Mentor |
| 내용 | 텍스트 (**최대 10,000자**) |
| 복수 답변 | 가능 (하나의 질문에 여러 답변) |
| 수정 | 작성자 본인만 가능 |
| 삭제 | **불가** |
| Founder 권한 | 열람만 가능 (답변 작성 불가) |

#### 4.2.4 요약 (Summary)

| 항목 | 내용 |
|------|------|
| 작성 권한 | **Admin만** |
| 내용 | 텍스트 (**최대 10,000자**) |
| 개수 | 질문 1개당 요약 1개 |
| 효과 | 요약 작성 시 해당 질문은 **Closed** 처리 |
| 수정 | Admin만 가능 |
| 삭제 | **불가** |
| 재오픈 | **불가** (Closed → Open 전환 불가) |
| 목적 | 해당 질문에 대한 최종 정리, 반복 질문 방지, 지식 자산 축적 |

#### 4.2.5 질문 리스트 화면
- 기수 내 전체 질문 목록
- 정렬: 최신순
- 필터: 상태별 (Open / Closed / 전체)

---

### 4.3 오피스아워 (Office Hour)

#### 4.3.1 개요
Mentor/Admin이 시간 슬롯을 등록하면, Founder가 요청하고, 승인 시 Google Calendar Invite가 자동 발송됩니다.

#### 4.3.2 플로우

```
[Mentor/Admin] 슬롯 등록
       ↓
[Founder] 슬롯 선택 및 요청
       ↓
[Mentor/Admin] 승인 또는 거절
       ↓
[승인 시] Google Meet 링크 자동 생성 + Calendar Invite 발송
```

#### 4.3.3 슬롯 등록

| 항목 | 내용 |
|------|------|
| 등록 권한 | Admin, Mentor |
| 슬롯 단위 | **30분 고정** |
| 시간대 저장 | **UTC** (내부 저장) |
| 시간대 표시 | PST / KST 선택 표시 |
| 반복 등록 | 없음 (수동으로 개별 등록) |
| 수정 | 요청 없는 슬롯만 가능 |
| 삭제 | 요청 없는 슬롯만 가능 |
| 과거 시간 | 등록 불가 |

#### 4.3.4 요청 및 승인

| 항목 | 내용 |
|------|------|
| 요청 권한 | Founder |
| 형태 | **1:1** (한 슬롯에 한 Founder) |
| 다중 요청 | 가능 (Mentor가 승인할 사람 선택, 나머지는 대기 유지) |
| 승인 권한 | 해당 슬롯의 Mentor, 또는 Admin |
| 취소 | 확정 전: 요청자가 자유롭게 취소 가능 |
| 취소 (확정 후) | Admin만 취소 가능 |
| Calendar 실패 시 | 에러 메시지 표시 + 수동 처리 안내 |

#### 4.3.5 Google Calendar 연동

| 항목 | 내용 |
|------|------|
| 연동 계정 | **peter@outsome.co** |
| 자동 생성 | 승인 시 Google Meet 링크 자동 생성 |
| Invite 발송 | 참석자(Founder, Mentor/Admin) 전원에게 Calendar Invite 이메일 발송 |

---

### 4.4 세션 & 슬라이드 (Session & Slides)

#### 4.4.1 개요
Admin이 정기 세션 정보를 등록하고, Google Slides 링크를 공유합니다.

#### 4.4.2 세션 정보 항목

| 항목 | 필수 여부 | 설명 |
|------|:--------:|------|
| 제목 | 필수 | 세션 제목 |
| 날짜 | 필수 | 세션 진행 날짜 |
| 설명 | 선택 | 세션 내용 요약 |
| 슬라이드 링크 | 선택 | Google Slides URL |
| 녹화 링크 | 선택 | 녹화 영상 URL |

#### 4.4.3 권한

| 기능 | Admin | Mentor | Founder |
|------|:-----:|:------:|:-------:|
| 세션 등록/수정/삭제 | ✅ | ❌ | ❌ |
| 세션 열람 | ✅ | ✅ | ✅ |

---

### 4.5 과제 (Assignment)

#### 4.5.1 개요
기존 카톡 + Google Docs로 운영하던 과제 흐름을 시스템으로 옮깁니다.

#### 4.5.2 플로우

```
[Admin] 과제 생성 (Google Docs 링크 포함)
       ↓
[Founder] 과제 제출 (텍스트 또는 링크)
       ↓
[Admin/Mentor] 피드백 작성
       ↓
[Founder] 결과 확인 (필요시 재제출)
```

#### 4.5.3 과제 생성

| 항목 | 내용 |
|------|------|
| 생성 권한 | Admin만 |
| 제목 | 최대 200자 |
| 설명 | 최대 5,000자 |
| 템플릿 링크 | Google Docs URL (선택) |
| 마감일 | **KST 23:59 기준** |
| 수정 | 제출물 없을 때만 가능 |
| 삭제 | 제출물 없을 때만 가능 |
| 공개 범위 | 전체 Founder에게 동일 과제 |

#### 4.5.4 과제 제출

| 항목 | 내용 |
|------|------|
| 제출 권한 | Founder |
| 제출 형식 | 텍스트(최대 5,000자) 또는 링크 (둘 중 하나 이상 필수) |
| 마감 후 제출 | 가능 ("지각 제출" 표시) |
| 재제출 | 가능 (**덮어쓰기** - 최신 제출물만 유지) |
| 제출물 열람 | 본인 + Admin + Mentor만 |

#### 4.5.5 피드백

| 항목 | 내용 |
|------|------|
| 작성 권한 | Admin, Mentor |
| 형식 | **텍스트 피드백만** (최대 3,000자, 점수 없음) |
| 복수 피드백 | 가능 (Admin, Mentor 각자 피드백 작성 가능) |
| 수정 | 작성자 본인만 가능 |
| 삭제 | **불가** |

#### 4.5.6 제출 현황 대시보드
- Admin/Mentor가 전체 Founder의 제출 현황을 한눈에 확인
- 표시 정보: Founder명, 제출 여부, 제출 시간, 지각 여부, 피드백 여부

---

### 4.6 커뮤니티 (게시판)

#### 4.6.1 개요
기수 내 구성원들이 자유롭게 소통할 수 있는 단순 게시판입니다. 복잡한 커뮤니티/피드 형태가 아닌 기본 게시판입니다.

#### 4.6.2 게시글

| 항목 | 내용 |
|------|------|
| 작성 권한 | Admin, Mentor, Founder (모두) |
| 내용 | 텍스트 (**최대 3,000자**) |
| 이미지 첨부 | 가능 (**최대 5장**, 각 5MB, jpg/png/gif) |
| 카테고리 | 없음 (단일 피드) |
| 수정 | 본인 글만 가능 ("수정됨" 표시) |
| 삭제 | 본인 글만 가능 (**댓글 있어도 함께 삭제**) |

#### 4.6.3 댓글

| 항목 | 내용 |
|------|------|
| 작성 권한 | 모두 |
| 내용 | 텍스트 (**최대 1,000자**) |
| 대댓글 | 가능 (**2단계까지** - 댓글 → 대댓글) |
| 수정 | 본인 댓글만 가능 ("수정됨" 표시) |
| 삭제 | 본인 댓글만 가능 (**대댓글 있어도 함께 삭제**) |

#### 4.6.4 좋아요
- 게시글에 좋아요 가능
- 댓글에 좋아요 가능
- **토글 방식** (좋아요 취소 가능)

#### 4.6.5 관리 기능

| 기능 | 권한 | 비고 |
|------|------|------|
| 게시글 비공개 처리 | Admin | 작성자/Admin만 열람 가능 |
| 게시글 삭제 | Admin | 완전 삭제 |
| 공지 등록 (상단 고정) | Admin | **최대 3개** |

---

## 5. 화면 구성안

### 5.1 화면 목록

| # | 화면명 | 접근 권한 | 설명 |
|---|--------|----------|------|
| 1 | 로그인 | 전체 | LinkedIn OAuth 로그인 |
| 2 | 대시보드 | 전체 | 메인 홈, 주요 정보 요약 |
| 3 | 질문 리스트 | 전체 | 기수 내 질문 목록 |
| 4 | 질문 상세 | 전체 | 질문 + 답변 + 요약 |
| 5 | 질문 작성 | Founder | 새 질문 작성 폼 |
| 6 | 오피스아워 캘린더 | 전체 | 슬롯 목록 및 요청 |
| 7 | 오피스아워 슬롯 등록 | Admin, Mentor | 새 슬롯 등록 폼 |
| 8 | 세션 리스트 | 전체 | 세션 목록 및 슬라이드 링크 |
| 9 | 세션 등록/수정 | Admin | 세션 관리 폼 |
| 10 | 과제 리스트 | 전체 | 과제 목록 |
| 11 | 과제 상세 | 전체 | 과제 내용 + 제출 폼 (Founder) |
| 12 | 과제 제출 현황 | Admin, Mentor | 전체 제출 현황 대시보드 |
| 13 | 커뮤니티 피드 | 전체 | 게시글 리스트 |
| 14 | 게시글 상세 | 전체 | 게시글 + 댓글 |
| 15 | 게시글 작성 | 전체 | 새 게시글 작성 폼 |
| 16 | Admin: Batch 관리 | Admin | Batch 생성/종료 |
| 17 | Admin: 사용자 관리 | Admin | 초대/역할 관리 |

---

## 6. 데이터 모델

### 6.1 ERD 개요

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Batch    │────<│    User     │>────│  UserBatch  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Question   │────<│   Answer    │     │   Summary   │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       └─────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ OfficeHour  │────<│  OHRequest  │     │   Session   │
│    Slot     │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Assignment  │────<│ Submission  │────<│  Feedback   │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Post     │────<│   Comment   │     │    Like     │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 6.2 테이블 상세

#### 6.2.1 User (사용자)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| email | VARCHAR | 이메일 (Unique) |
| name | VARCHAR | 이름 |
| linkedin_id | VARCHAR | LinkedIn OAuth ID |
| profile_image | VARCHAR | 프로필 이미지 URL |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

#### 6.2.2 Batch (기수)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| name | VARCHAR | 기수명 |
| description | TEXT | 설명 |
| start_date | DATE | 시작일 |
| end_date | DATE | 종료 예정일 |
| status | ENUM | 'active', 'archived' |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

#### 6.2.3 UserBatch (사용자-기수 연결)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| batch_id | UUID | FK → Batch |
| role | ENUM | 'admin', 'mentor', 'founder' |
| invited_at | TIMESTAMP | 초대일시 |
| joined_at | TIMESTAMP | 가입일시 |
| status | ENUM | 'invited', 'active' |

#### 6.2.4 Question (질문)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| batch_id | UUID | FK → Batch |
| author_id | UUID | FK → User |
| title | VARCHAR | 질문 제목 |
| content | TEXT | 질문 내용 |
| status | ENUM | 'open', 'closed' |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

#### 6.2.5 QuestionAttachment (질문 첨부파일)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| question_id | UUID | FK → Question |
| file_url | VARCHAR | 파일 URL |
| file_name | VARCHAR | 파일명 |
| file_size | INTEGER | 파일 크기 (bytes) |
| file_type | VARCHAR | MIME type |
| created_at | TIMESTAMP | 생성일시 |

#### 6.2.6 Answer (답변)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| question_id | UUID | FK → Question |
| author_id | UUID | FK → User |
| content | TEXT | 답변 내용 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

#### 6.2.7 Summary (요약)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| question_id | UUID | FK → Question (Unique) |
| author_id | UUID | FK → User |
| content | TEXT | 요약 내용 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

#### 6.2.8 OfficeHourSlot (오피스아워 슬롯)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| batch_id | UUID | FK → Batch |
| host_id | UUID | FK → User (Mentor/Admin) |
| start_time | TIMESTAMP | 시작 시간 |
| end_time | TIMESTAMP | 종료 시간 (start + 30분) |
| timezone | VARCHAR | 'PST' 또는 'KST' |
| status | ENUM | 'available', 'requested', 'confirmed', 'completed', 'cancelled' |
| google_meet_link | VARCHAR | Google Meet 링크 |
| google_event_id | VARCHAR | Google Calendar Event ID |
| created_at | TIMESTAMP | 생성일시 |

#### 6.2.9 OfficeHourRequest (오피스아워 요청)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| slot_id | UUID | FK → OfficeHourSlot |
| requester_id | UUID | FK → User (Founder) |
| message | TEXT | 요청 메시지 (선택) |
| status | ENUM | 'pending', 'approved', 'rejected', 'cancelled' |
| created_at | TIMESTAMP | 생성일시 |
| responded_at | TIMESTAMP | 응답일시 |

#### 6.2.10 Session (세션)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| batch_id | UUID | FK → Batch |
| title | VARCHAR | 세션 제목 |
| description | TEXT | 설명 (선택) |
| session_date | DATE | 세션 날짜 |
| slides_url | VARCHAR | 슬라이드 링크 (선택) |
| recording_url | VARCHAR | 녹화 링크 (선택) |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

#### 6.2.11 Assignment (과제)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| batch_id | UUID | FK → Batch |
| title | VARCHAR | 과제 제목 |
| description | TEXT | 과제 설명 |
| template_url | VARCHAR | Google Docs 템플릿 링크 |
| due_date | TIMESTAMP | 마감일시 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

#### 6.2.12 Submission (제출)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| assignment_id | UUID | FK → Assignment |
| author_id | UUID | FK → User (Founder) |
| content | TEXT | 제출 내용 |
| link_url | VARCHAR | 제출 링크 (선택) |
| is_late | BOOLEAN | 지각 제출 여부 |
| submitted_at | TIMESTAMP | 제출일시 |
| updated_at | TIMESTAMP | 수정일시 (재제출) |

#### 6.2.13 Feedback (피드백)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| submission_id | UUID | FK → Submission |
| author_id | UUID | FK → User (Admin/Mentor) |
| content | TEXT | 피드백 내용 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

#### 6.2.14 Post (게시글)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| batch_id | UUID | FK → Batch |
| author_id | UUID | FK → User |
| content | TEXT | 게시글 내용 |
| is_pinned | BOOLEAN | 상단 고정 여부 |
| is_hidden | BOOLEAN | 비공개 여부 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

#### 6.2.15 PostImage (게시글 이미지)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| post_id | UUID | FK → Post |
| image_url | VARCHAR | 이미지 URL |
| created_at | TIMESTAMP | 생성일시 |

#### 6.2.16 Comment (댓글)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| post_id | UUID | FK → Post |
| parent_id | UUID | FK → Comment (대댓글용, nullable) |
| author_id | UUID | FK → User |
| content | TEXT | 댓글 내용 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

#### 6.2.17 Like (좋아요)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| target_type | ENUM | 'post', 'comment' |
| target_id | UUID | Post 또는 Comment ID |
| created_at | TIMESTAMP | 생성일시 |

*Unique constraint: (user_id, target_type, target_id)*

#### 6.2.18 Notification (알림 로그)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User (수신자) |
| type | ENUM | 알림 유형 |
| title | VARCHAR | 알림 제목 |
| content | TEXT | 알림 내용 |
| reference_type | VARCHAR | 참조 엔티티 타입 |
| reference_id | UUID | 참조 엔티티 ID |
| sent_at | TIMESTAMP | 발송일시 |
| email_sent | BOOLEAN | 이메일 발송 여부 |

---

## 7. 알림 정책

### 7.1 이메일 알림 (Optional - 있으면 좋음)

> ⚠️ **우선순위 낮음**: 시간/예산 여유 있을 때만 구현

| # | 트리거 | 수신자 | 이메일 제목 (예시) |
|---|--------|--------|-------------------|
| 1 | 질문 등록 | Admin + 전체 Mentor | [Founder Sprint] 새 질문: {질문 제목} |
| 2 | 요약 등록 | 질문 작성자 (Founder) | [Founder Sprint] 질문이 마무리되었습니다: {질문 제목} |

### 7.2 Google Calendar Invite (필수)

| 트리거 | 발송 대상 | 내용 |
|--------|----------|------|
| 오피스아워 승인 | Host + Founder | Google Meet 링크 포함 Calendar Invite |

### 7.3 MVP에서 제외되는 알림

- ❌ 답변 등록 알림
- ❌ 오피스아워 요청/승인/거절 알림
- ❌ 과제 등록/피드백 알림
- ❌ 게시글 댓글 알림
- ❌ 좋아요 알림
- ❌ Slack 알림
- ❌ Push 알림
- ❌ 인앱 알림

---

## 8. 기술 요구사항

### 8.1 인증

| 항목 | 내용 |
|------|------|
| 로그인 방식 | **LinkedIn OAuth 2.0** |
| 이메일/비밀번호 | 사용하지 않음 |
| 세션 관리 | JWT 또는 Session 기반 (개발자 선택) |

### 8.2 외부 연동

| 서비스 | 용도 | 연동 계정 |
|--------|------|----------|
| LinkedIn OAuth | 사용자 인증 | 신규 앱 생성 필요 |
| Google Calendar API | 오피스아워 Invite 발송 | peter@outsome.co |
| Google Meet | 화상 미팅 링크 자동 생성 | peter@outsome.co |
| 이메일 발송 (SMTP/SES) | 알림 이메일 | 개발자 선택 |

### 8.3 파일 저장

| 항목 | 내용 |
|------|------|
| 저장소 | Supabase Storage |
| 질문 첨부파일 | 이미지, PDF / 최대 10MB |
| 게시글 이미지 | 이미지 / 최대 5MB |

### 8.4 플랫폼

| 항목 | 내용 |
|------|------|
| 플랫폼 | Web |
| 반응형 | 기본 지원 (모바일 최적화는 아님) |
| 브라우저 | Chrome, Safari, Edge 최신 버전 |

### 8.5 언어

| 항목 | 내용 |
|------|------|
| UI 언어 | **영어 단일** |

### 8.6 도메인

| 항목 | 내용 |
|------|------|
| 도메인 | **추후 결정** |

### 8.7 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x |
| Database | Supabase (PostgreSQL) | - |
| ORM | Prisma | 6.x |
| Auth | Supabase Auth (LinkedIn OIDC) | - |
| Storage | Supabase Storage | - |
| Calendar | Google Calendar API | v3 |
| Deployment | Vercel | - |
| Styling | Tailwind CSS | 4.x |

> 상세 기술 명세는 `Founder_Sprint_개발_계획서.md` 참조

### 8.8 인프라 계정

| 서비스 | 계정 소유 | 비고 |
|--------|----------|------|
| Supabase | **Outsome** | 중간 점검 시 전환 |
| Vercel | **Outsome** | 중간 점검 시 전환 |
| Google Cloud | **Outsome** | peter@outsome.co |
| LinkedIn Developer | **Outsome** | 중간 점검 시 전환 |
| 도메인 | **Outsome** | 발주자 직접 구매, 수급자 연결 |

> 개발 초기에는 수급자 계정으로 진행 후, 중간 점검(1/26) 시 발주자 계정으로 전환  
> 모든 인프라 비용은 발주자 부담

---

## 9. 제외 항목

아래 기능들은 이번 MVP 범위에서 **명시적으로 제외**됩니다.

| # | 제외 기능 | 사유 |
|---|----------|------|
| 1 | 실시간 채팅 | MVP 범위 초과 |
| 2 | AI 요약/추천 | MVP 범위 초과 |
| 3 | 외부 사용자 초대 (Self sign-up) | 내부 전용 |
| 4 | 결제/구독 | 내부 전용 |
| 5 | 검색 고도화 | MVP 범위 초과 |
| 6 | Slack 알림 | MVP 범위 초과 |
| 7 | Push 알림 | MVP 범위 초과 |
| 8 | 개인 캘린더 전체 연동 | Calendar Invite 발송만 지원 |
| 9 | 오피스아워 반복 슬롯 등록 | MVP 범위 초과 |
| 10 | 게시글 카테고리 | MVP 범위 초과 |
| 11 | 다국어 지원 | 영어 단일 |
| 12 | 성능 최적화, 대규모 트래픽 대응 | MVP 전제 |
| 13 | 상용 서비스 수준의 보안 설계 | MVP 전제 |
| 14 | 모바일 앱 | Web만 지원 |

---

## 10. 일정 및 예산

### 10.1 예산

| 항목 | 금액 |
|------|------|
| 개발비 | **400만원** |

### 10.2 일정

| 항목 | 기간 |
|------|------|
| 개발 기간 | **2주** |

### 10.3 주요 마일스톤 (예시)

| 주차 | 목표 |
|------|------|
| 1주차 | 인증, Batch 관리, 질문/답변/요약, 기본 UI |
| 2주차 | 오피스아워, 과제, 커뮤니티, 알림, 테스트 및 배포 |

*상세 일정은 개발자와 협의 후 확정*

---

## 부록 A: 용어 정의

| 용어 | 정의 |
|------|------|
| Batch (기수) | Founder Sprint 프로그램의 운영 단위. 모든 데이터는 Batch 단위로 분리됨 |
| Founder | 프로그램 참가자. 스타트업 창업자 |
| Mentor | Founder에게 조언과 피드백을 제공하는 멘토 |
| Admin | 프로그램 운영자 (Peter) |
| 오피스아워 | Mentor/Admin과 Founder 간 1:1 미팅 시간 |
| 요약 (Summary) | 질문에 대한 최종 정리. 작성 시 질문이 Closed 됨 |

---

## 부록 B: 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| v1.0 | 2026.01.21 | 전도현 | 최초 작성 (계약 체결용) |

---

**문서 끝**
