# Code Templates (POC Verified)

This folder contains verified code templates extracted from the POC project.
All code has been build-tested with Next.js 16.1.4 and compiles successfully.

## File Index

| File | Description |
|------|-------------|
| `prisma.config.ts` | Prisma 7 configuration (REQUIRED) |
| `supabase-client.ts` | Browser Supabase client |
| `supabase-server.ts` | Server Supabase client (with await cookies) |
| `supabase-middleware.ts` | Session refresh middleware helper |
| `middleware.ts` | Root middleware |
| `prisma.ts` | Prisma client singleton |
| `google-calendar.ts` | Google Calendar API with Meet |
| `auth-actions.ts` | Authentication server actions |
| `server-action-example.ts` | Server action with Zod 4.x validation |
| `useActionState-example.tsx` | useActionState hook pattern |
| `submit-button.tsx` | Submit button with pending state |
| `login-page.tsx` | Login page component |
| `auth-callback.ts` | OAuth callback route handler |
| `globals.css` | Tailwind CSS 4 with @theme inline |

## Critical Notes

1. **Prisma 7**: Must create `prisma.config.ts` - url/directUrl removed from schema
2. **Zod 4.x**: Use `error.issues[0]` not `error.errors[0]`
3. **Tailwind 4**: Use `@theme inline {}` not `@theme {}`
4. **Next.js 16**: `cookies()` requires `await`
5. **Supabase**: Use `linkedin_oidc` provider
