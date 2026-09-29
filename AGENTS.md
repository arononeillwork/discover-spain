<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Discover Spain: project notes

Expat life-admin guides for the Costa del Sol. Next.js 16 + Supabase. See README.md for the full picture.

- **Content lives in Supabase, not in code.** Pages read it through `src/lib/queries.ts` on every request. To change seed content, edit `supabase/seed.sql`. To change the schema, add a migration in `supabase/migrations/` (with RLS, policies and explicit grants), then run `npm run db:reset && npm run db:types && npm run db:test`.
- **Local stack:** `npm run db:start` (Supabase CLI, Docker). Studio is on :54323 and Mailpit (auth emails) on :54324.
- **Checks before handing off:** `npm run lint`, `npm run typecheck`, `npm run build` (the build needs no database), and `npm run db:test` for DB changes.
- **Next.js 16:** middleware is `src/proxy.ts`. `params`, `searchParams` and `cookies()` are async.
- **Env:** `NEXT_PUBLIC_*` values are inlined at build time. `SUPABASE_URL` is a runtime, server-only override (used in Docker). Never expose secret or service-role keys.
