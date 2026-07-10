# PassItOn — System Design

> *"Don't throw it away. Pass it on."*

## 1. Concept

A donation marketplace. Donators post items they want to give away. Receivers browse publicly (no login needed) and send an inquiry (login required). The donator reviews inquiries and approves one. On approval, the receiver gets the donator's contact info (email always, phone if the donator opted to share it). Contact and pickup happen outside the app.

## 2. Core Flow

```
[Donator]                          [Receiver]
   |                                    |
   | Posts item (title, desc, photo)    |
   |----------------------------------->|
   |                                    | Browses items (public, no login)
   |                                    | Opens item detail
   |                                    | Sends inquiry (requires login)
   |<-----------------------------------|
   | Sees list of inquiries on item     |
   | Approves one inquiry               |
   |----------------------------------->|
   |                                    | Sees donator's email (+ phone if shared)
   |                                    | Contacts donator externally
   | Marks item "completed" after       |
   | handoff                            |
```

Item status machine:

```
available ──(donator approves an inquiry)──> reserved ──(donator marks complete)──> completed
   ^                                             |
   └─────────────(donator un-approves)───────────┘
```

- `available`: visible in listings, accepts new inquiries.
- `reserved`: hidden from "browse" (or shown as reserved), no new inquiries accepted, other pending inquiries on it are auto-set to `closed`.
- `completed`: terminal state, kept for history/stats.

Inquiry status: `pending → approved | rejected | closed` (`closed` = auto-set when a different inquiry on the same item gets approved).

## 3. Why donator-approval instead of first-come-first-served

First-come-first-served needs a hard lock the instant one inquiry lands to avoid double-claims — that's a real concurrency problem for a use case that doesn't need the speed. Donators giving away physical items usually want to pick based on need, location, or trust anyway. Approval flow is simpler to build correctly (no race condition) and matches actual donation behavior.

## 4. Data Model (Supabase / Postgres)

```sql
-- profiles: mirrors auth.users, holds public-facing fields
profiles
  id            uuid PK, references auth.users(id)
  display_name  text
  email         text        -- denormalized copy for easy display after approval
  phone         text null   -- optional, only shown if set
  share_phone   boolean default false
  created_at    timestamptz default now()

items
  id            uuid PK default gen_random_uuid()
  donator_id    uuid references profiles(id)
  title         text not null
  description   text not null
  photo_url     text
  status        text not null default 'available'  -- available | reserved | completed
  inquiry_count int not null default 0              -- denormalized counter for public display
  created_at    timestamptz default now()
  updated_at    timestamptz default now()

inquiries
  id            uuid PK default gen_random_uuid()
  item_id       uuid references items(id) on delete cascade
  receiver_id   uuid references profiles(id)
  message       text          -- optional note from receiver
  status        text not null default 'pending'  -- pending | approved | rejected | closed
  created_at    timestamptz default now()

  unique (item_id, receiver_id)  -- one inquiry per receiver per item
```

Indexes: `items(status)`, `items(donator_id)`, `inquiries(item_id)`, `inquiries(receiver_id)`.

### Row Level Security (this is the part that actually matters here)

- `items`: SELECT open to everyone (`available` items at least — decide if `reserved`/`completed` stay publicly visible or not). INSERT/UPDATE/DELETE restricted to `donator_id = auth.uid()`.
- `inquiries`: INSERT restricted to authenticated users, `receiver_id = auth.uid()`. SELECT restricted to `receiver_id = auth.uid() OR item_id IN (select id from items where donator_id = auth.uid())` — i.e. you only ever see your own inquiries or inquiries on items you posted.
- `profiles.email` / `profiles.phone`: **do not** expose these via a public SELECT policy. They should only become visible to a receiver through a server-side function/route triggered by approval (see §5), not by querying `profiles` directly. Otherwise anyone can just query the table and get every donator's email regardless of approval status.

## 5. Contact Reveal — the actual mechanism

This is the part you specifically asked about, so being explicit:

Don't let the client read `profiles.phone`/`email` directly, even for approved inquiries — RLS policies on `profiles` are hard to scope to "only if you have an approved inquiry on one of this person's items" without a join, and it's easy to get wrong.

Instead:
1. Client calls a Postgres function (`get_donator_contact(inquiry_id)`) via RPC, or a Vercel API route that uses the Supabase service role key server-side.
2. The function/route checks: does an inquiry with this id exist, is its status `approved`, and does `auth.uid()` match its `receiver_id`? If yes, return the donator's email/phone. If no, return nothing/403.
3. This keeps the reveal logic in one enforced place instead of relying on RLS alone for something conditional on workflow state, not just row ownership.

## 6. Route / Page Structure (Next.js on Vercel)

```
/                          → browse items (public, SSR/ISR for SEO)
/items/[id]                → item detail + "send inquiry" (login-gated action)
/items/new                 → post item form (auth required)
/dashboard/my-items        → donator view: items + their inquiries, approve/reject/complete actions
/dashboard/my-inquiries    → receiver view: inquiries sent + status, contact info once approved
/profile                   → edit display_name, email, phone, share_phone toggle (auth required)
/login, /signup            → Supabase Auth (email/password or magic link)

/api/inquiries/[id]/approve   → server route: sets inquiry approved, others on item closed, item -> reserved
/api/inquiries/[id]/reject    → server route: sets inquiry rejected
/api/items/[id]/complete      → server route: donator marks item completed
/api/inquiries/[id]/contact   → server route: returns donator contact if approved + owned by caller
```

Approve/complete/contact routes run server-side (not pure client Supabase calls) because they involve multi-row writes (item + inquiries together) or conditional data exposure — cleaner to keep that logic off the client.

## 7. Stack Mapping

- **Frontend**: Next.js (App Router) on Vercel.
- **Auth**: Supabase Auth (email/password or magic link — magic link avoids you handling passwords at all, worth considering given this is a small app).
- **DB**: Supabase Postgres, RLS as above.
- **Storage**: Supabase Storage bucket for item photos, public read, authenticated write scoped to own uploads.
- **Image handling**: client uploads directly to Supabase Storage, store the resulting public URL in `items.photo_url`.

## 8. Open Decisions Still Worth Making

- Should `reserved`/`completed` items stay visible in public browse (marked as such) or disappear entirely? Affects the `items` SELECT RLS policy and the listing query.
- Rate-limiting inquiries (stop one user spamming every item) — worth a simple per-user daily cap if abuse becomes a concern.
- Photo moderation — none currently in scope; flag if needed later.

## 9. Admin

Schema additions on top of §4:

```sql
alter table profiles add column is_admin boolean not null default false;
alter table profiles add column suspended boolean not null default false;
alter table items add column removed_by_admin boolean not null default false;
```

- `is_admin` marks platform admins. No self-service promotion path — set manually in the DB for now.
- `suspended` blocks login and new listings/inquiries for that account. Existing items they posted stay live unless separately removed.
- `removed_by_admin` is a moderation flag independent of the `available → reserved → completed` status machine (§2). A removed item drops out of public browse regardless of its status, but the row and its status history are kept, not deleted.

### Access rules

- Admin routes (`/admin/*`) must gate on `profiles.is_admin = true`, checked server-side. Never trust a client-side flag for this.
- Admin's ability to read `profiles.email`/`phone` directly (§5 normally blocks this for everyone else) must go through the same kind of server-side check — a service-role query or RPC that verifies `auth.uid()`'s own profile has `is_admin = true` before returning other users' contact fields. Do not open this via a blanket RLS SELECT policy on `profiles`, since that would leak contact info to any authenticated client, not just verified admins.
- Force-closing an inquiry (admin action) sets `inquiries.status = 'closed'` directly, bypassing the normal "approval closes siblings" trigger path — used for disputes/abuse, not part of the regular flow.

### Route / page structure

```
/admin                    → dashboard: account/item/inquiry counts, recent activity
/admin/accounts           → all accounts, suspend/reinstate
/admin/items              → all items regardless of status, remove/restore
/admin/inquiries          → all inquiries, force-close

/api/admin/accounts/[id]/suspend   → server route: toggles profiles.suspended, gated on caller.is_admin
/api/admin/items/[id]/remove       → server route: toggles items.removed_by_admin, gated on caller.is_admin
/api/admin/inquiries/[id]/close    → server route: force-sets inquiries.status = 'closed', gated on caller.is_admin
```

## 10. Build Progress

**Done:**
- All UI screens (consumer + admin) built with mock/local data — see DESIGN.md for token system and screen list.
- `supabase/migrations/0001_init.sql` — profiles/items/inquiries tables, RLS policies, admin columns from §9 (folded into this migration rather than split out — only one migration file existed in the scaffold).
- `supabase/migrations/0002_storage_policies.sql` — storage.objects policies scoping item-photos uploads to `{user_id}/filename` paths.
- `supabase/migrations/0003_profile_trigger.sql` — `handle_new_user()` trigger auto-creates a `profiles` row on `auth.users` insert (needed since profiles.display_name/email are NOT NULL and client-side insert-after-signup is fragile when email confirmation is enabled).
- `supabase/functions/get_donator_contact.sql` — the §5 RPC function.
- `public_profiles` view (id, display_name only) added on top of §4 — not originally specified. profiles has no public SELECT policy at all (self-select only), so anything needing to show a donator's display_name publicly (e.g. item cards) reads this view instead of the table.
- `lib/supabase/client.ts`, `server.ts` — browser and SSR clients (anon key, respect RLS as the logged-in user).
- `lib/supabase/admin.ts` — **new file, not in original scaffold.** Service-role client, only for routes in §6/§9 that intentionally bypass RLS (approve/reject/complete/contact, admin/*).
- `middleware.ts` — **new file, not in original scaffold.** Required by `@supabase/ssr` to refresh the session cookie every request.
- `app/login/page.tsx`, `app/signup/page.tsx` — wired to real `supabase.auth.signInWithPassword` / `signUp`, inline error display, redirect on success.

**Still mock/unwired:**
- Dev-only login toggle in `ItemDetailClient.tsx` — needs real session check.
- Browse grid, item detail, both dashboards — still reading mock data, not Supabase queries.
- `ItemForm.tsx` — photo preview still local (`URL.createObjectURL`), not uploaded to the `item-photos` bucket.
- All four scaffolded API routes (`approve`, `reject`, `complete`, `contact`) and all three admin API routes — still empty placeholder files.
- `/admin/*` pages — no server-side `is_admin` gate yet.

**Open decision resolved (defaulted, not a real decision):** §8's "should reserved/completed items stay in public browse" — `items_select_public` RLS policy currently shows all non-removed items regardless of status. Revisit if that's not what you want.

**Still open from §8:** inquiry rate-limiting, photo moderation — untouched.

**Required env vars so far:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**Also done since above:**
- `supabase/migrations/0004_inquiry_count_trigger.sql` — `on_inquiry_created` trigger increments `items.inquiry_count` on every successful inquiry insert (not on approve/reject/closed — just a running total of how many people inquired).
- `app/items/[id]/page.tsx` + `ItemDetailClient.tsx` + `InquiryModal.tsx` — fully wired. Dev login toggle removed. Real session passed server-side as `userId`. Real `inquiries` insert on submit, with inline error handling (including a friendlier message for the `unique(item_id, receiver_id)` violation). Donator name is read via `public_profiles`, not `profiles` directly.
- `lib/utils/format.ts` — new file, `formatRelativeTime()` helper (kept separate from `status.ts`, which is scoped to status-machine logic only).
- `app/page.tsx` (browse grid) — wired to real Supabase query: `items` where `status != 'completed'`, newest first. Errors currently just `console.error`, no user-facing error UI yet.
- `middleware.ts` — now also enforces the admin/consumer split at the route level, not just session refresh: logged-out hitting `/admin/*` → `/login`; non-admin hitting `/admin/*` → `/`; **admin hitting anything outside `/admin/*` (except `/login`/`/signup`) → `/admin`**, so an admin account never sees the consumer browse/dashboard UI. This queries `profiles.is_admin` on every request for logged-in users — fine at current scale, but if middleware latency ever matters, move `is_admin` into the JWT's `app_metadata` via a trigger instead of querying per-request.
- `credentials.md` (gitignored) — seeded test accounts: `admin123@gmail.com` (is_admin=true) and `user123@gmail.com`, created via `supabase/seed.sql`.

**Admin pages — in progress:**
- `app/admin/page.tsx` — wired. Real stat counts via parallel `count: 'exact', head: true` queries (no data transfer). "Recent activity" scoped to creation events only (item posted, inquiry sent, account created) — schema has no `approved_at`/`completed_at` timestamps, so status-change events from the original mock ("approved an inquiry", "marked as given away") aren't derivable without adding those columns. Ask before adding them if that's wanted.
- `app/admin/accounts/page.tsx` + new `AccountsPageClient.tsx` — wired. Split into Server Component (data fetch via `lib/supabase/admin.ts`) + Client Component (table/modal interactivity), same pattern as `items/[id]`. Items/inquiries-per-account counts computed in JS from raw `donator_id`/`receiver_id` columns — no GROUP BY without an RPC/view, fine at current scale, revisit if the accounts list grows large.
- `app/api/admin/accounts/[id]/suspend/route.ts` — **new file, new directory tree.** Nothing was scaffolded under `/api/admin/*` at all — SYSTEM.md §9 documents the routes but none existed as files. This route re-checks `is_admin` itself (middleware's admin gate is `pathname.startsWith("/admin")`, which does **not** match `/api/admin/*` — confirmed gap from earlier, now handled for this one route). Also blocks suspending admin accounts server-side, not just hidden client-side in `AccountsTable`.

**Still to do on admin:** ~~`/admin/items` and `/admin/inquiries` pages + their action routes~~ — done, see below.

**Admin pages/routes — now fully wired:**
- `app/admin/items/page.tsx` + `ItemsPageClient.tsx` + `app/api/admin/items/[id]/remove/route.ts` — same Server/Client Component split, same is_admin re-check pattern. Uses `items.inquiry_count` directly (already maintained by the 0004 trigger), no extra aggregation needed here.
- `app/admin/inquiries/page.tsx` + `InquiriesPageClient.tsx` + `app/api/admin/inquiries/[id]/close/route.ts` — nested embed query (`receiver:profiles(...)`, `items(title, donator:profiles(...))`) to pull item title + both names in one query. Close route rejects if inquiry is already `closed`/`rejected`.
- **Admin/consumer POV boundary tightened further:** `middleware.ts` now carves out one exception — admins CAN view `/items/[id]` (needed since the admin Items table links there) but NOT `/items/new` or `/` (browse). On that item detail page, `ItemDetailClient.tsx` now takes an `isAdmin` prop (fetched server-side in `app/items/[id]/page.tsx`) and replaces the "Send inquiry" button with a plain notice when true — admin accounts can look but not act like a user. **Not done:** this is UI-only. The `inquiries_insert_own` RLS policy doesn't check `is_admin`, so an admin account could still insert an inquiry by calling the API directly. Left as-is since it's not really an attack surface (it's the site owner's own account), but flagging in case that reasoning changes.

**What's left overall:** ~~`/items/new`, both dashboards, and the four consumer action routes~~ — done, see below.

**Consumer side — now fully wired:**
- `/items/new` — split into a Server Component (`page.tsx`, auth check + redirect to `/login` if no session) and a client component (`NewItemFormClient.tsx`) doing the real work: uploads the photo to the `item-photos` bucket at `{user_id}/{uuid}.{ext}` via the browser client, gets the public URL, then inserts into `items` with `donator_id` from the server-verified session.
- `/dashboard/my-items` — same Server/Client split as the admin pages. Server Component reads the donator's own items (RLS already allows this via the existing items policy) plus their inquiries (RLS already allows donators to see inquiries on their own items — no admin client needed for the reads), resolves receiver display names via `public_profiles`. Client component (`MyItemsPageClient.tsx`) calls the real `approve`/`reject`/`complete` routes and applies the same local state transition it already had, now gated on a real API response instead of a timeout.
- `/dashboard/my-inquiries` — stayed a plain Server Component (no interactivity needed). Reads the receiver's own inquiries + item info, and for any `approved` inquiry calls the `get_donator_contact` RPC directly (security definer function already enforces the ownership/approval check, so no extra gating needed here).
- `/api/inquiries/[id]/approve` — verifies caller is the item's donator, inquiry is `pending`, and item is `available`; sets inquiry `approved`, all other pending inquiries on that item `closed`, item `reserved`.
- `/api/inquiries/[id]/reject` — verifies caller is the item's donator and inquiry is `pending`; sets `rejected`.
- `/api/items/[id]/complete` — verifies caller is the item's donator and item is `reserved`; sets `completed`.
- `/api/inquiries/[id]/contact` — uses the regular (non-admin) server client since `get_donator_contact` is security definer and checks `auth.uid()` itself — no separate ownership check needed in the route.

**Also resolved this session:** an unresolved git merge conflict was found across 13 files, not just the ones originally scoped — `SYSTEM.md`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `app/page.tsx`, `app/items/[id]/page.tsx`, `ItemDetailClient.tsx`, `InquiryModal.tsx`, `get_donator_contact.sql`, `app/admin/accounts/page.tsx`, `app/admin/inquiries/page.tsx`, `app/admin/page.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`. In every case HEAD had the complete real implementation and the other side was a stale mock-data stub with no unique additions — resolved by keeping HEAD and stripping markers everywhere.

**Also done:** removed the stale `// TODO: gate this layout on profiles.is_admin` comment from `app/admin/layout.tsx` — confirmed `middleware.ts`'s matcher already covers `/admin/*` and redirects logged-out users to `/login` and non-admins to `/` before the layout renders, so there was nothing left to check.

**Also resolved this session:** `supabase/migrations/0001_init.sql` still had unresolved git merge conflict markers — missed by the earlier 13-file conflict cleanup. Same resolution pattern applied: HEAD had the complete schema/RLS matching SYSTEM.md §4, the other side was a one-line stub. Kept HEAD, stripped markers.

**Orphaned stubs:** `components/auth/AuthGate.tsx` and `components/inquiries/InquiryForm.tsx` moved to `_deleted/` (no `delete` capability in the current toolset — `move_file` was the closest option). Nothing referenced them; safe to `rm -rf _deleted/` once confirmed.

**`/profile` — now fully wired:**
- `app/profile/page.tsx` — Server Component, auth check + redirect to `/login`, reads own `profiles` row.
- `app/profile/ProfilePageClient.tsx` — client component (renamed from the old single-file mock page). `display_name`/`phone`/`share_phone` write directly to `profiles` via the browser client (`profiles_update_own` RLS policy already allowed this — confirmed once 0001 was fixed).
- **Email changes are handled separately, never written directly to `profiles.email`:** submitting a changed email calls `supabase.auth.updateUser({ email })`, which does NOT touch `auth.users.email` until the user confirms via the link sent to the new address. `profiles.email` stays on the old value in the meantime (both in the DB and in the UI state after save) — a local-only `emailConfirmationSent` flag just acknowledges the action, it's not a source of truth and doesn't survive a reload.
- `supabase/migrations/0005_email_confirm_sync.sql` — new. Trigger on `auth.users` (`after update ... when (new.email is distinct from old.email)`) syncs `profiles.email` only once Supabase actually confirms the change. This was a deliberate choice over optimistic writes or client-side sync-on-load — see reasoning inline in the migration.

**Photo moderation (flag/report, not automated) — now wired:**
- `supabase/migrations/0006_reports.sql` — new `reports` table (`item_id`, `reporter_id`, `reason`, `note`, `status: open|resolved`). Any authenticated, non-suspended user can INSERT; no SELECT/UPDATE policy for regular users — admin-only via service-role, same pattern as everything else in §9. `unique(item_id, reporter_id, status)` blocks duplicate *open* reports from the same user but allows re-reporting after resolution.
- `components/items/ReportItemModal.tsx` + wired into `ItemDetailClient.tsx` — "Report this item" link (hidden for admin viewers), reason dropdown + optional note, inserts into `reports`.
- `app/admin/reports/page.tsx` + `ReportsPageClient.tsx` + `components/admin/ReportsTable.tsx` + `app/api/admin/reports/[id]/resolve/route.ts` — same Server/Client split and is_admin re-check pattern as the other admin pages. "Resolve" only clears the queue entry — actually removing an item still goes through the existing `/admin/items` remove flow, deliberately not merged into this route.
- `components/admin/AdminSidebar.tsx` — added "Reports" nav link.
- **Not done:** no report count on `/admin/page.tsx`'s dashboard stat cards — wasn't asked for, flagging in case it's wanted for parity with the other entities.

**Still open from §8:** inquiry rate-limiting — explicitly deferred, no cap/mechanism chosen yet.

**Type-checking pass (this session, after the above):** ran `npx tsc --noEmit` for the first time against the whole project — uncovered issues no manual read-through had caught.

1. **Real bug, fixed:** `components/profile/ProfileForm.tsx` never resynced its internal field state when the `initialValues` prop changed after a render (no `useEffect`/`key`). Latent since the original mock code (save always echoed back exactly what was typed, so it never surfaced), but the new email-revert logic in `ProfilePageClient.tsx` (profiles.email deliberately NOT updated until confirmed) exposed it: the "check your email" banner would say one thing while the input field above it silently still showed the new unconfirmed address. Fixed with a `useEffect` syncing local state to `initialValues`.

2. **False alarm, checked and dropped:** suspected `handleReportSubmit`'s inferred return type (`ok` widened to `boolean` via literal-inference rules) wouldn't satisfy the `Promise<{ok:true}|{ok:false,error:string}>` prop type on `ReportItemModal`. Verified directly with an isolated `tsc --strict` repro instead of trusting the reasoning — it compiles clean, no bug. Noting this so a future session doesn't re-flag the same non-issue.

3. **Systemic, root-caused, now fixed:** none of the three Supabase client factories (`lib/supabase/client.ts`, `server.ts`, `admin.ts`) were parameterized with a generated `Database` type — every embedded relational select (`profiles(display_name)`, `items(title)`, etc.) was inferring as an array instead of a single object, and every `.rpc()` call inferred as `{}`. This predated the session (present in `admin/inquiries`, `admin/items`, `admin/page.tsx`, the approve/reject/contact routes, `dashboard/my-inquiries` — 18 pre-existing errors) and the same broken convention got copied into the new `admin/reports/page.tsx` (2 more). Root fix, not a per-file patch: generated real types via `npx supabase gen types typescript --project-id hsbapldnyiwjfdywdhlj --schema public`, then wired `Database` into all three client factories (`createBrowserClient<Database>`, `createServerClient<Database>`, `createSupabaseClient<Database>`). New file: `lib/supabase/database.types.ts` — **do not hand-edit, regenerate via the CLI command above whenever the schema changes.**
   - **Gotcha hit along the way:** first `gen types` run was piped with plain PowerShell `>` redirect, which on this machine writes UTF-16 with a BOM by default — produced a file that LOOKED like valid generated output but was garbled/unparseable. Fixed by regenerating with `| Out-File -Encoding utf8` instead. If regenerating this file later, use the `Out-File -Encoding utf8` form, not bare `>`.

4. **One more orphaned stub found this pass:** `app/items/page.tsx` — two comment lines, no exports, never wired (the real browse grid lives at `app/page.tsx` root). Same class of dead scaffold as `AuthGate.tsx`/`InquiryForm.tsx`, same treatment: moved to `_deleted/`. This is what was causing the unrelated `.next/dev/types/validator.ts` error ("is not a module") in the first `tsc` run.

5. **New, different, NOT YET FIXED — pick up here next session:** after the above fixes, a second `tsc --noEmit` run surfaced a *different* class of error in 7 files (`app/admin/inquiries/page.tsx`, `app/admin/items/page.tsx`, `app/admin/reports/page.tsx`, `app/dashboard/my-inquiries/page.tsx`, `app/dashboard/my-items/page.tsx`, `app/items/[id]/page.tsx`, `app/page.tsx`). Root cause: `items.status`, `inquiries.status`, and `reports.status` are all declared in the migrations as `text ... check (status in (...))` — a runtime CHECK constraint, not a Postgres enum — so the generated `Database` type correctly types these columns as plain `string`. But every frontend component typed them as narrow string-literal unions (e.g. `"available" | "reserved" | "completed"`), so assigning the raw DB row shape to those component prop types now fails. This is a real, contained mismatch — same pattern in all 7 files, needs a cast/narrowing helper at the DB→UI boundary in each (e.g. a small `asItemStatus(s: string)` type guard/assertion, or switch to Postgres enums for these three columns and regenerate types — worth deciding which approach before touching any of the 7). Not started.

## 11. Next Task (pick up here)

1. **Fix the 7 status-typing errors above** — decide cast-at-boundary vs. Postgres enum migration first, then apply consistently across all 7 files, not just the newest ones.
2. **Inquiry rate-limiting** (§8) — no cap or mechanism decided yet.
3. **`/admin` dashboard reports stat** — optional, not requested yet.

Read each file before touching it — this build has consistently used the pattern of reading current state (even placeholder comments) before writing, don't assume shape from memory.

User preferences to carry forward (see full list further down if this doc gets trimmed): ask for context/read files before acting, don't send code snippets unless asked, no unsolicited summaries, direct/no sugarcoating, update this section immediately after every completed task, one step at a time with confirmation before proceeding.
