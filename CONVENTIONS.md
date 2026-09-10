# Conventions

## What this project is

PassItOn — a donation marketplace. Donators post items they want to give away; receivers browse
publicly (no login needed) and send an inquiry (login required). The donator approves one inquiry,
which reveals their contact info to that receiver; contact and pickup happen outside the app. Full
design and data model live in `SYSTEM.md` — read it before touching the approve/reject/contact flow.

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript, Tailwind 4, Supabase (Postgres + Auth,
via `@supabase/ssr`). No test framework is installed.

---

## Commands

| Purpose | Command |
| --- | --- |
| Full check (the closing gate) | `npm run typecheck` |
| Fast check (runs every turn) | `npm run lint` |
| Tests, one file | _none — no test framework installed_ |
| Run the app locally | `npm run dev` |

`npm run typecheck` only runs `tsc --noEmit`; it does not run `next build`, so build-only failures
(e.g. an invalid `next.config.ts` option) won't be caught by verify.

---

## Where things live

| Layer | Path | Owns |
| --- | --- | --- |
| Routes (consumer) | `app/(app)/**` | Browse, item detail, dashboard, messages, profile |
| Routes (admin) | `app/admin/**` | Admin console — accounts, items, inquiries, reports |
| Routes (API) | `app/api/**` | Server-side mutations that need to bypass RLS on purpose |
| Supabase clients | `lib/supabase/{client,server,admin}.ts` | Three separate clients — see Traps |
| Auth + admin routing | `middleware.ts` | Session refresh, `/admin` gating, admin/consumer split |
| Shared UI | `components/**` | Grouped by feature (`items/`, `admin/`, `messages/`, etc.) |

**Read this first:** `app/api/inquiries/[id]/approve/route.ts` — the template for any API route
that mutates state: auth check via `lib/supabase/server.ts`, then ownership/status checks, then the
actual mutation via `lib/supabase/admin.ts`.

---

## Traps

- Three separate Supabase clients exist on purpose: `lib/supabase/client.ts` (browser),
  `server.ts` (Server Components/pages, respects RLS as the logged-in user), and `admin.ts`
  (service-role, bypasses RLS — only for approve/reject/contact/complete and `app/admin/**` routes).
  Using `admin.ts` outside those routes bypasses row-level security for every caller.
- `middleware.ts` redirects logged-in admins away from the consumer app entirely, with one
  exception: `/items/[id]` (item detail) stays reachable so admins can view a listing they're
  moderating. `/items/new` and `/` (browse) are deliberately excluded from that exception.
- `_deleted/` at the repo root holds abandoned components (`AuthGate.tsx`, `InquiryForm.tsx`,
  `items_page.tsx`, `HandoffIllustration.tsx`). Nothing imports them — they are dead code kept for
  reference, not precedent to copy from.
- `SUPABASE_SERVICE_ROLE_KEY` must stay unprefixed (no `NEXT_PUBLIC_`) or its value ships to the
  browser. It's read only in `lib/supabase/admin.ts`.

---

## Reporting rules

- **A deferral is not a gap.** Work that was consciously postponed must not be reported as a defect,
  a finding, or a hand-off item — by a person or by an agent. From inside any single module a
  deliberate absence looks exactly like an oversight, so it will be re-raised on every audit until it
  is written down. Deferrals: no automated test suite exists yet — `verify` is type-check only, and
  that is intentional for now, not a gap to flag.
- **A claim that ages carries the date it was measured.** Any count, or any "every / all / none"
  statement, written into something durable — a doc, a status field, a user-visible string — says when
  it was measured: `measured NULL on 25 of 25 rows on 2026-08-06`.
- **Red is not automatically yours.** A failing typecheck or lint in code this turn did not touch is
  evidence about the tree, not a defect to fix. Establish provenance first (`git show HEAD:<path> |
  diff - <path>`), never by stashing.
- **A priority label is not permission to start.** "Critical" or "P1" in a spec or a ticket says what
  matters, not what is next, and not what has already been decided against.
