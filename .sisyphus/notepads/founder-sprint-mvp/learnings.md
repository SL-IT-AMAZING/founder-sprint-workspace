## Learnings

- What worked well: Wrapping Prisma reads with unstable_cache and adding revalidateTag alongside existing revalidatePath updates was straightforward once cache keys were standardized.
- What didn't work as expected: Next.js revalidateTag in this project requires a second argument (profile); calls with one argument failed TypeScript.
- What would I do differently: Check Next cache type signatures up front to avoid bulk edits when the API shape differs.
- Gotchas: TypeScript LSP server is not installed, so lsp_diagnostics cannot run; rely on tsc for verification.
