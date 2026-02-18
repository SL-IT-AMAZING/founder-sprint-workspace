# Founder Sprint

Accelerator program management platform built by Outsome. Manages batches of founders, mentors, and admins with Q&A, office hours, assignments, community feed, events, and session tracking.

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js | 16.1.4 |
| Runtime | React | 19.2.3 |
| Database ORM | Prisma | 7.3.0 |
| Auth & Storage | Supabase (SSR + JS Client) | 0.8 / 2.91 |
| Styling | Tailwind CSS | 4 |
| Language | TypeScript | 5 |
| Email | nodemailer (Gmail SMTP) | 7 |
| Calendar | googleapis (Google Calendar API) | 170 |
| Validation | zod | 4 |
| Animation | framer-motion | 12 |
| Testing | Playwright | 1.58 |
| Date Handling | date-fns / date-fns-tz | 4 / 3 |

## Features

- **Dashboard** -- Overview and quick access to all features
- **Q&A** -- Founders ask questions, mentors/admins answer, admins summarize and close
- **Feed** -- Community posts with images, comments, and likes
- **Events** -- One-off events, office hours, and in-person events with Google Calendar integration
- **Office Hours** -- Mentors create slots, founders request, auto-generates Google Meet links
- **Sessions** -- Program sessions with slides and recording links
- **Assignments** -- Create assignments with due dates, founders submit, mentors provide feedback
- **Groups** -- Founder groups with dedicated feeds and office hours
- **Admin Panel** -- User management, batch management, email invitations
- **Profile & Settings** -- Profile editing (name, job title, company, bio, profile image)

## Role System

| Role | Description |
|------|-------------|
| `super_admin` | Full system access across all batches |
| `admin` | Batch-level administration and user management |
| `mentor` | Answer Q&A, create office hour slots, provide assignment feedback |
| `founder` | Core participant -- ask questions, submit assignments, request office hours |
| `co_founder` | Associated with a founder, similar permissions |

## Data Models

21 Prisma models: User, Batch, UserBatch, Question, QuestionAttachment, Answer, Summary, OfficeHourSlot, OfficeHourRequest, Session, Assignment, Submission, Feedback, Event, Group, GroupMember, Post, PostImage, Comment, Like, InvitationToken.

See `prisma/schema.prisma` for the full schema.

## Project Structure

```
founder-sprint/
├── prisma/
│   └── schema.prisma          # Database schema (21 models)
├── src/
│   ├── actions/                # Server actions (auth, feed, questions, etc.)
│   ├── app/
│   │   ├── (auth)/             # Login, OAuth callback
│   │   ├── (dashboard)/        # Main app pages
│   │   │   ├── admin/          # Admin panel
│   │   │   ├── assignments/    # Assignment management
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── events/         # Event management
│   │   │   ├── feed/           # Community feed
│   │   │   ├── groups/         # Founder groups
│   │   │   ├── office-hours/   # Office hour management
│   │   │   ├── questions/      # Q&A system
│   │   │   ├── schedule/       # Schedule view
│   │   │   ├── sessions/       # Program sessions
│   │   │   ├── settings/       # User settings
│   │   │   └── submissions/    # Submission management
│   │   ├── api/                # API routes (upload, invite)
│   │   └── invite/             # Invitation acceptance flow
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utilities (auth, email, calendar, Supabase clients)
│   └── types/                  # TypeScript type definitions
├── e2e/                        # Playwright E2E tests
└── public/                     # Static assets (images, icons)
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or a Supabase project)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# Generate Prisma client
npx prisma generate

# Push schema to database (first time)
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See `.env.example` for the full list. Key services required:

| Service | Variables | Purpose |
|---------|-----------|---------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth (LinkedIn OAuth), database, file storage |
| Database | `DATABASE_URL` | PostgreSQL connection string |
| Gmail SMTP | `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Invitation emails, office hour notifications |
| Google Calendar | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID` | Office hour scheduling with Google Meet links |
| App | `NEXT_PUBLIC_APP_URL` | Base URL for invitation links |
| Office Hour | `OFFICE_HOUR_TARGET_EMAIL` | Receives founder-initiated office hour requests |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (`prisma generate && next build`) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Playwright E2E tests |
| `npm run test:ui` | Run Playwright tests with UI |
| `npm run test:headed` | Run Playwright tests in headed browser |

## Deployment

Deployed on [Vercel](https://vercel.com). Set all environment variables from `.env.example` in the Vercel dashboard.

Build command: `prisma generate && next build`
