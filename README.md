# Discover Spain

Step-by-step life-admin guides for expats on the Costa del Sol: NIE, padrón, bank account, social security, healthcare, driving licence, mortgages, PideTaxi vs Uber, and a directory of recommended tradespeople.

- **App:** Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS v4).
- **Data and sign-in:** Supabase (Postgres, Auth, Studio). Locally it runs in Docker via the Supabase CLI.
- **Content:** every guide, fee, ride option, health section and tradesperson lives in the database. You edit it in Supabase Studio, not in code.

## Prerequisites

- Node.js 20.9 or newer (Next.js 16 needs it; CI and the Docker image use Node 22).
- Docker Desktop, or another Docker-compatible runtime, running. The Supabase CLI starts the database in Docker. The CLI itself is a dev dependency, so there's nothing to install globally.

## Quick start

```bash
npm install
npm run setup    # starts local Supabase (first run downloads its images, which takes a few minutes)
                 # and creates .env.local from .env.example if it is missing
npm run dev
```

Open **http://localhost:3000**. Pages re-render as you save.

| What                | URL                    | Use it for                                          |
| ------------------- | ---------------------- | --------------------------------------------------- |
| The app             | http://localhost:3000  | The site                                            |
| Supabase Studio     | http://127.0.0.1:54323 | Editing all content, approving tradespeople, users  |
| Mailpit             | http://127.0.0.1:54324 | Catches sign-in emails locally (nothing is sent)    |
| Supabase API        | http://127.0.0.1:54321 | Used by the app                                     |
| Postgres            | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | psql and other DB tools |

Stop Supabase with `npm run db:stop`. Your data is kept for the next `npm run db:start`.

## Editing content (Supabase Studio)

Open Studio → **Table Editor**, pick a table and edit rows. The site reads the database on every request, so reload the page to see a change.

| On the site                            | Table(s)                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Guides, their steps, tips and links    | `guides`, `guide_steps` (ordered by `position`)                                                   |
| Home page "Your path" order            | `guides.path_position`: 1, 2, 3…; empty means the guide is not on the path                         |
| Hide a guide                           | `guides.published` = false (its steps are hidden too)                                             |
| Taxis & transport                      | `ride_options` (`highlighted` marks the recommended pick), `airport_options`                      |
| Mortgages                              | `purchase_fees`, `mortgage_facts`, `rate_types`, `resource_links`, `content_blocks` (`mortgages.buyer_protections`) |
| Healthcare                             | `health_sections`, `health_points` (the `public` section links to the `health-card` guide while it is published) |
| Tradespeople                           | `tradespeople`, `trade_categories`                                                                |

Most tables have a `sort_order` column that controls display order.

> **Local edits are not saved in git.** `npm run db:reset` rebuilds the database from `supabase/migrations` and `supabase/seed.sql` and throws away changes made in Studio. To keep a content change, also put it in `supabase/seed.sql`.

### Approving tradesperson suggestions

Visitors can suggest a tradesperson with the **Recommend a tradesperson** form on `/trades`. Suggestions are saved with `status = pending` and are not shown on the site. To review them:

1. In Studio, open `tradespeople` and filter on `status` = `pending`.
2. Check the details. `recommended_by` holds the contact of the person who suggested them, if they gave one. It and `submitted_by` are only visible to admins: the public API can't read those two columns.
3. Set `status` to `approved` to publish, or `rejected` to decline. Tick `verified` if you have vetted them yourself, which shows a verified badge.

Only `approved` rows are public. The five seeded entries are placeholders (`is_placeholder = true`) and should be replaced with real contacts.

## Sign-in and progress

- **Sign-in** uses a passwordless magic link (`/login`). Locally, the email lands in **Mailpit** (http://127.0.0.1:54324). Open the link in the same browser you requested it from: links are bound to that browser (PKCE), so a link sent by someone else can't sign you into their account. The very first email for a new address is titled "Confirm your email address"; it signs you in just the same.
- Browse the app on **`localhost`** (e.g. http://localhost:3000). Local Supabase only sends sign-in links back to `localhost` on any port, or `127.0.0.1:3000`.
- **Checklist progress:** when signed out, ticks are saved in the browser (`localStorage`). When signed in, they are saved to your account (`user_progress` table) and follow you across devices. Anything ticked before signing in is added to your account.
- Signed-up users appear in Studio → **Authentication**.

## Running the app in Docker

The app has a production `Dockerfile` (Next.js standalone output, non-root user) and a `docker-compose.yml`. Supabase is **not** part of the compose file: it keeps running in the Supabase CLI's own containers, and the app container talks to it through `host.docker.internal`.

```bash
npm run db:start     # Supabase (skip if it is already running)
npm run docker:up    # builds the image and serves the app on http://localhost:3000
```

- `npm run docker:up` runs `docker compose up --build` with values from `.env.example`, then `.env.local`. Pass extra flags after `--`, e.g. `npm run docker:up -- --detach`, and stop with `docker compose down`.
- Port 3000 busy (e.g. by `npm run dev`)? Use `WEB_PORT=3300 npm run docker:up` and open http://localhost:3300.
- `NEXT_PUBLIC_SUPABASE_*` values are baked into the image at build time. After changing them, rebuild (`docker:up` always does). The server inside the container uses `SUPABASE_URL=http://host.docker.internal:54321`, set in `docker-compose.yml`.

## Database workflow

Everything about the database lives in `supabase/`:

- `migrations/`: the schema, row-level security policies and grants, as timestamped SQL files.
- `seed.sql`: all site content, loaded after migrations on every reset.
- `tests/`: pgTAP tests for the schema and security rules.
- `config.toml`: local stack settings (ports, auth redirect URLs, …).

| Command             | What it does                                                                        |
| ------------------- | ----------------------------------------------------------------------------------- |
| `npm run db:start`  | Start local Supabase (Docker)                                                       |
| `npm run db:stop`   | Stop it (data is kept)                                                              |
| `npm run db:status` | Show local URLs and keys                                                            |
| `npm run db:reset`  | Recreate the database from `migrations/` + `seed.sql` (discards local edits)         |
| `npm run db:test`   | Run the pgTAP tests in `supabase/tests`                                             |
| `npm run db:types`  | Regenerate `src/lib/database.types.ts` from the local schema, after schema changes (leaves the file alone if the stack isn't running) |

To change the schema:

1. `npx supabase migration new <name>`, then write the SQL in the new file.
2. `npm run db:reset`, `npm run db:types` and `npm run db:test`.

New tables need `enable row level security`, policies and explicit grants, like the existing migration. The first migration switches off Supabase's default grants to `anon`/`authenticated` for new tables and sequences, so a table you forget to grant is simply not reachable from the API.

## Other scripts

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Development server on :3000                      |
| `npm run build`     | Production build (does not need the database)    |
| `npm start`         | Serve the production build (`next start`). It prints a warning about `output: standalone`; that's expected and harmless, since that output is for the Docker image. |
| `npm run lint`      | ESLint                                           |
| `npm run typecheck` | TypeScript check (`next typegen` + `tsc`)        |

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck and build on every push and pull request to `main`. It also runs the database tests against a fresh local Postgres.

## Project structure

```
src/
  app/                 Routes: / , /guides, /guides/[slug], /transport, /mortgages,
                       /healthcare, /trades, /login, /auth/confirm (magic-link landing)
  components/          UI components (header, checklist, calculator, trades directory, forms…)
  lib/
    queries.ts         All database reads for the pages
    supabase/          Supabase clients (server, browser) and shared config
    database.types.ts  Generated from the schema (npm run db:types)
    types.ts           Types the UI uses
    progress.ts        Browser-side progress store
  proxy.ts             Keeps the sign-in session fresh (Next.js 16 "proxy", formerly middleware)
supabase/              Migrations, seed data, tests, local config
scripts/               setup and docker:up helpers (plain Node)
Dockerfile, docker-compose.yml
```

Colours and shared styles (`.card`, `.chip`, `.link`, `.btn`, `.input`) are in `src/app/globals.css`.

## Environment variables

`.env.example` holds the local defaults, and `npm run setup` copies it to `.env.local`. The local keys are Supabase's public demo keys and only work against the local stack.

| Variable                               | Where it's used                                                         |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase API URL for the browser and server. Inlined at build time.     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key. Row-level security decides what it can do.      |
| `SUPABASE_URL` (optional)              | Server-only override, read at runtime, e.g. from inside Docker.         |

Never put a secret or service-role key in a `NEXT_PUBLIC_` variable.

## Deployment (later)

This isn't set up yet. When it is, it will be separate from any other project:

1. **Supabase:** create a dedicated Supabase cloud project. Then `npx supabase link --project-ref <ref>` and `npx supabase db push --include-seed` apply the migrations and content. In the project's Auth settings, set the Site URL and redirect URLs to the live domain (`https://<domain>/**`), keep **Confirm email** turned on (as in `supabase/config.toml`; otherwise anyone could sign up with someone else's address and a password and be signed in at once), and configure SMTP so sign-in emails are delivered.
2. **Hosting:** host the Next.js app on its own. Any Node host works, or this Docker image, built with the cloud project's URL and publishable key as the `NEXT_PUBLIC_*` build args. Serve it over HTTPS: the session cookies are then marked `Secure` (the app detects HTTPS directly or from a proxy's `X-Forwarded-Proto`). Consider HSTS at the host.
