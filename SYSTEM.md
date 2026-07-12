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
/                          → marketing landing page (public, all visitors except admins)
/browse                    → browse items (public, SSR/ISR for SEO)
/items/[id]                → item detail + "send inquiry" (login-gated action)
/items/new                 → post item form (auth required)
/dashboard/my-items        → donator view: items + their inquiries, approve/reject/complete actions
/dashboard/my-inquiries    → receiver view: inquiries sent + status, contact info once approved
/messages                  → chat inbox, one thread per inquiry (see §12)
/profile                   → edit display_name, email, phone, share_phone toggle (auth required)
/login, /signup            → Supabase Auth (email/password or magic link)
/verify                    → email OTP verification (see §14c)

/api/inquiries/[id]/approve   → server route: sets inquiry approved, others on item closed, item -> reserved
/api/inquiries/[id]/reject    → server route: sets inquiry rejected
/api/items/[id]/complete      → server route: donator marks item completed
/api/inquiries/[id]/contact   → server route: returns donator contact if approved + owned by caller
```

Messaging has no dedicated API routes — reads/writes go directly through the Supabase client (browser-side), gated by RLS. See §12.

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
- **Password reset / forgot-password flow — DONE, tsc clean (user confirmed).** Built per user's explicit flow: "forgot password" sends an email with a reset link. New `app/forgot-password/page.tsx` (email input, calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: <origin>/reset-password })`, generic "if that email exists" success message — deliberately doesn't confirm/deny whether the email is registered) and `app/reset-password/page.tsx` (new password + confirm fields, checks a session actually landed from the emailed link before allowing submit, calls `supabase.auth.updateUser({ password })`, redirects to `/login` on success). Both follow the same visual/loading-state/5s-slow-message pattern established in the auth-UX-polish pass. `app/login/page.tsx` gained a "Forgot password?" link under the password field, confirmed placement by user. **Dashboard redirect allowlist — DONE for dev.** `http://localhost:3000/reset-password` confirmed added to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs (screenshot confirmed). **Still outstanding: production domain's `/reset-password` needs to be added once deployed** — not done yet since there's no production URL to add. Flow is now testable end-to-end in dev.
- **Login rate-limiting — MISSING.** Nothing currently limits repeated failed login attempts on an account (contrast with the existing 10/day inquiry cap in `0007_inquiry_rate_limit.sql`). Lower urgency for a small app, but noting the asymmetry: inquiries are rate-limited, login attempts are not.

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

**Still open from §8:** inquiry rate-limiting, photo moderation — untouched. **Correction: inquiry rate-limiting is NOT untouched** — `supabase/migrations/0007_inquiry_rate_limit.sql` exists and is built (a `before insert` trigger on `inquiries`, 10/day cap per `receiver_id`). This line was stale; photo moderation (flag/report) was later built too, see below.

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

**Still open from §8:** inquiry rate-limiting — CORRECTION: already built, see `0007_inquiry_rate_limit.sql` note earlier in this section. This line was stale.

**Type-checking pass (this session, after the above):** ran `npx tsc --noEmit` for the first time against the whole project — uncovered issues no manual read-through had caught.

1. **Real bug, fixed:** `components/profile/ProfileForm.tsx` never resynced its internal field state when the `initialValues` prop changed after a render (no `useEffect`/`key`). Latent since the original mock code (save always echoed back exactly what was typed, so it never surfaced), but the new email-revert logic in `ProfilePageClient.tsx` (profiles.email deliberately NOT updated until confirmed) exposed it: the "check your email" banner would say one thing while the input field above it silently still showed the new unconfirmed address. Fixed with a `useEffect` syncing local state to `initialValues`.

2. **False alarm, checked and dropped:** suspected `handleReportSubmit`'s inferred return type (`ok` widened to `boolean` via literal-inference rules) wouldn't satisfy the `Promise<{ok:true}|{ok:false,error:string}>` prop type on `ReportItemModal`. Verified directly with an isolated `tsc --strict` repro instead of trusting the reasoning — it compiles clean, no bug. Noting this so a future session doesn't re-flag the same non-issue.

3. **Systemic, root-caused, now fixed:** none of the three Supabase client factories (`lib/supabase/client.ts`, `server.ts`, `admin.ts`) were parameterized with a generated `Database` type — every embedded relational select (`profiles(display_name)`, `items(title)`, etc.) was inferring as an array instead of a single object, and every `.rpc()` call inferred as `{}`. This predated the session (present in `admin/inquiries`, `admin/items`, `admin/page.tsx`, the approve/reject/contact routes, `dashboard/my-inquiries` — 18 pre-existing errors) and the same broken convention got copied into the new `admin/reports/page.tsx` (2 more). Root fix, not a per-file patch: generated real types via `npx supabase gen types typescript --project-id hsbapldnyiwjfdywdhlj --schema public`, then wired `Database` into all three client factories (`createBrowserClient<Database>`, `createServerClient<Database>`, `createSupabaseClient<Database>`). New file: `lib/supabase/database.types.ts` — **do not hand-edit, regenerate via the CLI command above whenever the schema changes.**
   - **Gotcha hit along the way:** first `gen types` run was piped with plain PowerShell `>` redirect, which on this machine writes UTF-16 with a BOM by default — produced a file that LOOKED like valid generated output but was garbled/unparseable. Fixed by regenerating with `| Out-File -Encoding utf8` instead. If regenerating this file later, use the `Out-File -Encoding utf8` form, not bare `>`.

4. **One more orphaned stub found this pass:** `app/items/page.tsx` — two comment lines, no exports, never wired (the real browse grid lives at `app/page.tsx` root). Same class of dead scaffold as `AuthGate.tsx`/`InquiryForm.tsx`, same treatment: moved to `_deleted/`. This is what was causing the unrelated `.next/dev/types/validator.ts` error ("is not a module") in the first `tsc` run.

5. **New, different, NOT YET FIXED — pick up here next session:** after the above fixes, a second `tsc --noEmit` run surfaced a *different* class of error in 7 files (`app/admin/inquiries/page.tsx`, `app/admin/items/page.tsx`, `app/admin/reports/page.tsx`, `app/dashboard/my-inquiries/page.tsx`, `app/dashboard/my-items/page.tsx`, `app/items/[id]/page.tsx`, `app/page.tsx`). Root cause: `items.status`, `inquiries.status`, and `reports.status` are all declared in the migrations as `text ... check (status in (...))` — a runtime CHECK constraint, not a Postgres enum — so the generated `Database` type correctly types these columns as plain `string`. But every frontend component typed them as narrow string-literal unions (e.g. `"available" | "reserved" | "completed"`), so assigning the raw DB row shape to those component prop types now fails. This is a real, contained mismatch — same pattern in all 7 files, needs a cast/narrowing helper at the DB→UI boundary in each (e.g. a small `asItemStatus(s: string)` type guard/assertion, or switch to Postgres enums for these three columns and regenerate types — worth deciding which approach before touching any of the 7). Not started.

## 11. Messaging Verification (resolved)

Of the three items flagged when messaging (§12) was discovered undocumented:

1. **`chat-images` bucket** — confirmed created in the Supabase dashboard, private (not public). Done.
2. **`tsc --noEmit`** — run, surfaced exactly one error: `components/dashboard/InquiryRow.tsx` used `<Link>` (a "Message" link into `/messages?inquiry=...`) with no `import Link from "next/link"`. Fixed by adding the import. Re-run not yet reconfirmed clean after the fix — do that before trusting this is fully closed.
3. **End-to-end manual test** — explicitly deferred by user ("will just test it myself" once deployed to Vercel). Not done, not blocking other work per user's call. Outcome not yet reported back.

## 12a. Landing Page + Route Restructure — tsc clean, click-through NOT fully done, one known bug fixed mid-session

Started this session, not in original scope (§1–§9) or the messaging addendum (§12). This section replaces the earlier "IN PROGRESS, NOT VERIFIED" version — several of the original unknowns are now resolved, but new work was added on top before full verification finished. Read carefully before assuming anything below is done.

### Confirmed since the original unverified pass

- **`npx tsc --noEmit` has been run multiple times since the restructure and is clean** as of the most recent check (after the auth-page links added at the very end of this session). Not re-run after literally the last two edits (login/signup browse links) — those are simple `<Link>` additions to already-typed pages, low risk, but technically unconfirmed.
- **One real bug found and fixed:** `components/dashboard/InquiryRow.tsx` used `<Link>` with no `import Link from "next/link"`. Fixed.
- **A recurring, unresolved environment issue was hit repeatedly this session:** newly-created files (via write/create, not in-place edits) intermittently vanished from disk minutes after being written — happened at least 5 times (`app/(app)/layout.tsx`, `components/auth/` entirely, `app/page.tsx` itself, `components/landing/HeroCarousel.tsx`, `components/landing/LandingFooter.tsx`). In-place edits to existing files were never affected. Root cause was investigated (OneDrive sync, VS Code, git) and never conclusively identified — git status showed no evidence of external deletion at the time checked. **Practical mitigation adopted: verify every newly-created file immediately after writing it, before building on top of it.** If a future session hits the same symptom, don't assume it's fixed — keep verifying.
- **Click-through was NOT systematically completed.** Individual pieces were checked ad hoc as they were built (hero, carousel, sections, footer, auth pages) and confirmed working by the user each time, but the full checklist from the original §13 (`/`, `/browse`, `/messages`, `/dashboard/my-items`, `/dashboard/my-inquiries`, `/profile`, `/items/new`, `/items/[id]`, logged in and out) was never run end-to-end as one pass. Treat as spot-checked, not fully verified.

### Additional work built on top this session (all new, on top of the original restructure)

- **Sign-out was completely missing app-wide** (not something this session broke — predated it) — no logout anywhere: admin sidebar, consumer nav, nowhere. Fixed: new `components/auth/SignOutButton.tsx` (client component, `supabase.auth.signOut()` → redirect to `/`), wired into both `app/(app)/layout.tsx`'s nav and `components/admin/AdminSidebar.tsx`.
- **Landing hero restructured from single centered column to two-column layout** (text left, visual right on `lg:` breakpoint, stacks on mobile) — direct response to user feedback that the original plain-text hero didn't feel distinctive enough.
- **New `components/landing/HeroCarousel.tsx`** — client component in the hero's right column. Auto-advances every 5s, pauses on hover, manual prev/next + dot navigation. Slide source is a merge of two things:
  1. Three static marketing photos the user supplied (`furniture.jpg`, `giving box.jpg`, `thrift.jpg`) — copied by the user into `public/landing/` (Next.js only serves static assets from `public/`; the user's original `images/` folder at project root is not web-servable and was deliberately left untouched as their own copy).
  2. Real posted item photos, fetched client-side from `items` where `status = 'available'` and `photo_url is not null`, newest first, limit 6 — same public-read pattern `/browse` already uses, no new RLS needed. Real item slides link to `/items/[id]`; static slides don't link anywhere.
  - `next.config.ts` already had the Supabase Storage `remotePatterns` needed for `next/image` to load these (added during the messaging work, confirmed still present, not new this session).
- **New `components/landing/HandoffIllustration.tsx`** — hand-coded SVG illustration (two hands passing a box), built as part of an earlier "how it works" expansion. **User disliked it ("looks bad/amateurish") and it was removed from the page** — the file still exists on disk but is now an orphaned/dead import, nothing references it anymore. Same category as `_deleted/` stubs from earlier sessions — not moved there only because this was found very late in a token-constrained session; a future pass should move it to `_deleted/` for consistency.
- **New `components/landing/LandingSections.tsx`** — "How it actually works" section (3 cards using the real `available → reserved → completed` status machine from §2, reusing `StatusTag`, not generic icon-copy) and a final "Ready to pass something on?" CTA section, both scroll-animated via Framer Motion's `whileInView` (`framer-motion` added as a new dependency, confirmed in `package.json`). The illustration section that used to sit between these two was removed per user request (see above) — file now goes straight from "How it actually works" to the final CTA.
- **New `components/landing/LandingFooter.tsx`** — simple footer, motto + copyright + real nav links (Browse/Log in/Sign up). Deliberately does NOT link to Privacy/Terms or any other page that doesn't exist — no invented links. Wired into `app/page.tsx` after `LandingSections`.
- **`app/login/page.tsx` and `app/signup/page.tsx`** — both previously had zero way to navigate anywhere except toggling between login/signup or back to `/` via the logo. User pointed this out as a real gap. Fixed with a minimal, deliberately-scoped addition (not the full nav, not the footer — user explicitly chose "minimal way back to browsing" to preserve the focused-auth pattern): a single "Browse without an account" link under the card, pointing to `/browse`.

### What's genuinely NOT done

1. **Full systematic click-through never completed as one pass** (see above) — do this first in the next session, don't assume it's covered by the piecemeal checks that happened during building.
2. **`HandoffIllustration.tsx` is dead code** — moved to `_deleted/`. **DONE.**
3. **`tsc` not re-run after the very last edit** (auth page links) — quick, low-risk, but technically unconfirmed.
4. **§6's route table still said `/` is "browse items (public, SSR/ISR for SEO)"** — fixed, now correctly shows `/` as the landing page and `/browse` as the grid, plus `/verify` added. **DONE.**
5. **DESIGN.md was updated for the initial restructure (route moves, shared nav) but NOT for anything built after that** — fixed. Screen list now covers the carousel, two-column hero, footer, illustration removal, auth-page browse links, `/verify`, `/admin/reports`, all three mobile-nav-drawer areas, the sign-out confirm modal, and `ReputationBadge`. **DONE.**

## 12b. Reputation Counts (donated/received, total + last-7-days) — MIGRATION APPLIED, TYPES REGENERATED, TSC CLEAN; VISUAL CLICK-THROUGH NOT YET DONE

Started this session, not in original scope. User's stated goal: abuse prevention — if a receiver is abusing the system (claiming too many items), a donator reviewing that person's inquiry should be able to see their claim history before approving.

### Decisions made (confirmed with user, don't re-litigate)

- **4 numbers per user:** `donated_total`, `donated_recent` (last 7 days), `received_total`, `received_recent` (last 7 days).
- **Definitions are conservative — only count REAL completed handoffs:**
  - `donated_*` = items where `donator_id = user AND status = 'completed'`.
  - `received_*` = inquiries where `receiver_id = user AND status = 'approved'` AND the parent item's `status = 'completed'` — i.e. approval alone does NOT count; the item must have actually been marked given away. User explicitly confirmed this (rejected "count as soon as approved").
  - `recent` = `completed_at` within the last 7 days (user's explicit number, not a default).
- **Visibility: public, everywhere a user's `display_name` currently shows** — not just to a donator reviewing that specific person's inquiry. User explicitly confirmed this after being told it makes claim history visible to strangers, not just contextually to a relevant donator. This is a real product/privacy decision, not a small UI tweak — worth remembering if it's ever questioned later.
- **Computed on-demand, NOT denormalized/trigger-maintained** (unlike `items.inquiry_count`). Reasoning: the 7-day window is a *rolling* window that changes daily even with zero new activity — a plain increment-on-insert trigger can't represent that without a separate scheduled job, which this project has no infrastructure for (no cron, no Edge Functions in use anywhere else). Total counts are cheap indexed `COUNT()`s; recent counts add one indexed range filter. Revisit only if this becomes a real read-performance bottleneck at scale.

### What exists right now

- **`supabase/migrations/0009_reputation_counts.sql` — WRITTEN AND APPLIED.** Hit two "already exists" errors on first apply attempts (a prior partial run had left `completed_at` and the trigger in place) — fixed by making the whole migration idempotent: `add column if not exists`, `drop trigger if exists` before `create trigger` (Postgres has no `create or replace trigger`), `create index if not exists`. Re-ran clean, applied successfully. Contains:
  1. `alter table items add column completed_at timestamptz` — didn't exist before; needed because `status = 'completed'` alone doesn't tell you *when* it became completed, which the 7-day window needs. This closes a gap SYSTEM.md §10 already flagged once before (the admin dashboard's "recent activity" section hit the same missing-timestamp problem and punted on it).
  2. `set_item_completed_at()` trigger — sets `completed_at = now()` when `status` transitions TO `'completed'`, clears it back to null if ever un-completed (so it can't go stale/wrong).
  3. Index on `completed_at` (partial, `where completed_at is not null`).
  4. `public_profiles` view **dropped and recreated** (views can't be `ALTER`ed to add columns) with the 4 new computed columns added via correlated subqueries, same `grant select to anon, authenticated` as before.
- **Migration applied.** `database.types.ts` regenerated (`npx supabase gen types typescript --project-id hsbapldnyiwjfdywdhlj --schema public | Out-File -Encoding utf8`) against the new `public_profiles` shape. `npx tsc --noEmit` run after — clean, user confirmed.

### What's NOT done yet

1. ~~`tsc --noEmit` has not been run since this frontend work was added.~~ **DONE, clean.**
2. **No visual/click-through test at all** for this feature — explicitly deferred by user for now, not abandoned. When picked back up: confirm the badge renders sensibly (not overflowing, not ugly) on `/dashboard/my-items` (inquiry list, hover for the recent-count tooltip) and `/items/[id]` ("Posted by X"), and specifically check mobile widths too now that the mobile-responsiveness pass (§13) is done.
3. **`my-inquiries` and messages thread list deliberately do NOT show the badge** — not an oversight, a reasoned decision: `my-inquiries` never displays another user's `display_name` at all (the donator's identity stays behind the §5 contact-reveal, only exposed after approval via the RPC), so there's nothing to attach a badge to. The messages inbox row is a decision *already made* (you're mid-conversation, not deciding whether to trust a stranger) and the row is visually tight — user agreed skipping it here avoids clutter for a spot where the signal doesn't actually help. If this reasoning is ever questioned, it was a deliberate call, not something missed.
4. **Existing already-completed items will show `0` for their `_recent` counts even if they were completed very recently**, because `completed_at` didn't exist before this migration — it only gets set going forward, on new status transitions to `completed`. No backfill was done or discussed. Fine for a fresh feature, but worth knowing if the numbers look "wrong" for old data right after this ships.

## 13. Next Task (pick up here)

**Mobile responsiveness — burger menu, DONE for all three scoped areas, tsc not yet run since the last two:**

Scope confirmed by user: full coverage (top nav + messages split-pane + admin sidebar), style = slide-out drawer, breakpoint = below `md` (~768px).

**Top nav — DONE, tsc clean (user confirmed).** New `components/nav/MobileNavDrawer.tsx` (client component): burger icon button (`md:hidden`), right-side slide-out drawer with backdrop, closes on link click or backdrop click. Contains the same links as the desktop nav (Browse, and when logged in: Messages/My items/My inquiries/Profile/Post an item/Sign out; when logged out: Log in/Sign up). `app/(app)/layout.tsx` updated: existing nav `<div>` gained `hidden md:flex` (desktop-only now), `<MobileNavDrawer isLoggedIn={!!user} />` added alongside it.

**Messages split-pane — DONE, tsc NOT yet run since this change.** Turned out to be mostly pre-built correctly — `app/(app)/messages/MessagesPageClient.tsx` and `components/messages/ThreadView.tsx` already had single-pane-on-mobile / split-pane-on-desktop logic with a working back button, just built on the `sm:` breakpoint (640px) instead of this pass's confirmed `md:` (768px). Fixed by swapping every `sm:` responsive class to `md:` in both files (layout toggling, back-button visibility) for consistency with the rest of this pass. No new components needed.

**Admin sidebar — DONE, tsc NOT yet run since this change.** `components/admin/AdminSidebar.tsx` restructured: extracted nav links into a shared internal `NavLinks` component (reused by both mobile and desktop to avoid duplicating the active-state logic), added a `md:hidden` sticky mobile top bar (burger button + "PassItOn Admin" label) and a right-side slide-out drawer (same visual pattern as `MobileNavDrawer.tsx`), and wrapped the original `<aside>` in `hidden md:flex` so it's desktop-only now. `app/admin/layout.tsx` untouched — `AdminSidebar` now returns a fragment (mobile bar + drawer, then desktop aside) so no changes needed at the layout level.

**Run `npx tsc --noEmit` before considering this fully closed** — run, clean, user confirmed. Mobile responsiveness (all three areas) is now fully DONE and VERIFIED (compile-wise; no visual click-through done yet at actual mobile widths, still worth a real check when convenient).

Original context, still relevant:

**Confirmed by re-reading the actual file (not just assumed) — this is a real, existing gap, not a hypothetical:** `app/(app)/layout.tsx`'s header is a single flat `flex items-center gap-4` row containing, when logged in, 6 links/buttons in a row (Browse, Messages, My items, My inquiries, Profile, Post an item) plus the sign-out button — 7 items total, no `flex-wrap`, no responsive breakpoint classes, no collapse behavior at all. On a narrow phone viewport this will overflow horizontally or squeeze into illegible text. This was built earlier this session (§12a) without mobile in mind — not a regression, just never designed for narrow screens in the first place.

Other known responsiveness gaps, not yet audited systematically:
- The landing page hero (§12a) uses a `lg:grid-cols-2` two-column layout that does stack on mobile (`grid` collapses to one column below `lg:`), but this was never actually verified on a real narrow viewport, only assumed to work because Tailwind's grid defaults to single-column pre-breakpoint.
- `components/messages/` (ThreadList/ThreadView split-pane layout) — built assuming enough width for a list+detail two-pane view; not confirmed how or whether it adapts on a phone-width screen.
- Admin sidebar (`AdminSidebar.tsx`) — fixed-width sidebar layout, not reviewed for mobile at all (lower priority — admins are less likely to be on mobile, but flagging since it was never actually decided this doesn't matter on mobile, just never discussed).

**Nothing has been built for messages/admin-sidebar coverage yet.** Top nav is done (see above). Remaining scope confirmed: full coverage including messages split-pane and admin sidebar, slide-out drawer style, `md` breakpoint — these are now settled, don't re-ask.

**Previously logged, NOW DONE — auth UX polish:**

User wants UX polish around auth transitions. Both timeout threshold (5 seconds) and logout-confirm style (custom modal, matches app styling) confirmed by user before building.

1. **Loading state on login submit** — turned out this was already built (`submitting` state, button text "Logging in...") before this task started; SYSTEM.md's earlier note calling this un-built was stale/wrong. **DONE** either way.
2. **Loading state on logout** — **DONE.** `SignOutButton.tsx` rewritten: click now opens a confirm modal instead of firing immediately (see item 4). Confirming sets a `signingOut` state, button shows "Logging out..." while `supabase.auth.signOut()` is in flight.
3. **"Taking longer than expected" message** — **DONE.** 5-second threshold, confirmed by user. Both `app/login/page.tsx` (below the submit button) and `SignOutButton.tsx`'s modal (below the confirm copy) show "This is taking longer than expected..." if their respective in-flight state is still true after 5s. Implemented as a `useEffect` + `setTimeout` keyed off the loading boolean, cleared on unmount/state change — same pattern in both files.
4. **Confirmation dialog before logging out** — **DONE.** Custom modal (confirmed style, not native `confirm()`), matches the app's existing modal visual pattern (`card-shadow`, `rounded-2xl`, `border-border`, backdrop click to dismiss — same shape as `InquiryModal`/`ReportItemModal`). Copy: "Log out? You'll need to log back in to access your account." Cancel/Log out buttons, both disabled while `signingOut` is true so the modal can't be dismissed mid-request.

`tsc --noEmit` run after all four — clean, user confirmed.

**Also still open, logged previously, NOT YET FIXED:**

~~Logged-in users can still navigate to `/login` and `/signup`...~~ **DONE.** Both `app/login/page.tsx` and `app/signup/page.tsx` now run a `useEffect` on mount that calls `supabase.auth.getUser()` and `router.replace("/")` if a session exists. Redirect target confirmed by user: `/` (landing page), not `/browse`. Implemented as a client-side check (both files are already `"use client"` components) rather than converting to a Server Component + `redirect()` like `/profile`/`/items/new` use — simpler, no structural change, but means there's a brief flash of the form before the redirect fires on mount, unlike the server-side pattern used elsewhere. Not yet run through `tsc` after this change.

**Note on ordering:** three separate NOT-YET-BUILT items now stack up in this section — mobile nav/burger menu, auth-transition UX polish, and the logged-in-can-still-reach-login-page bug. The first two will likely both touch `app/(app)/layout.tsx` (nav structure) and auth-adjacent files respectively; the third touches `app/login/page.tsx`/`app/signup/page.tsx`, which overlaps with item 1 of the UX polish list. Don't assume a build order — ask the user which to tackle first rather than picking one.

**Reputation counts (§12b) — migration applied, types regenerated, tsc clean. Only remaining step: visual click-through, explicitly deferred by user, not done:**

1. ~~Run `npx tsc --noEmit`~~ — done, clean.
2. Click through: `/dashboard/my-items` (see the badge next to each inquiry's receiver name, hover to confirm the tooltip shows recent counts) and any `/items/[id]` page (see the badge next to "Posted by X"). Confirm layout doesn't break/overflow on mobile widths too (`flex-wrap` was used specifically to handle that, but unverified — relevant now that the mobile-responsiveness pass in this same section is done).
3. If it all looks right, update §12b to reflect "verified" instead of "built, unverified."

**Once that's done, the older landing-page cleanup items are still outstanding:**

1. Do one real, systematic click-through: `/`, `/browse`, `/messages`, `/dashboard/my-items`, `/dashboard/my-inquiries`, `/profile`, `/items/new`, `/items/[id]`, `/login`, `/signup` — logged in and logged out where relevant, and now explicitly at mobile widths too given the new request. Never done as one complete pass, only spot-checked piece by piece.
2. Move `components/landing/HandoffIllustration.tsx` to `_deleted/` (orphaned, no longer imported anywhere). **DONE.**
3. Update SYSTEM.md §6's route table (still says `/` is the browse grid — wrong) and DESIGN.md's screen list (missing the carousel, two-column hero, footer, auth-page links, and now the reputation badges). **DONE — both §6 route table and DESIGN.md screen list.**
4. **Environment note for whoever picks this up:** an earlier part of this session repeatedly hit newly-created files vanishing from disk minutes after being written (7+ occurrences total across the session, including during the reputation-counts work — `ReputationBadge.tsx` needed a rewrite too). Root cause never confirmed. Verify every new file immediately after creating it, don't trust a single successful write.

After that: messaging's end-to-end manual test (§11, item 3) is still outstanding and was explicitly deferred, not abandoned. Photo moderation beyond report/flag (§8) and inquiry rate-limiting details remain unscoped — don't start speculatively.

Read each file before touching it — this build has consistently used the pattern of reading current state (even placeholder comments) before writing, don't assume shape from memory.

**New, logged this session — see §14 for full detail, NOT YET BUILT, working through 1-by-1:**
1. Display name case-insensitive uniqueness (`jayron`/`Jayron` must collide) — collision-handling behavior (auto-suffix vs hard error) still undecided.
2. Email uniqueness — already enforced by Supabase Auth, nothing to build, just confirmed.
3. Email OTP verification at signup (Supabase built-in email-OTP mode, option A) — gates ability to send an inquiry until verified.
4. Five trust/safety proposals captured for later, not scheduled: block a specific user, no-show tracking, location/distance, notifications, item expiry/staleness.

User preferences to carry forward (see full list further down if this doc gets trimmed): ask for context/read files before acting, don't send code snippets unless asked, no unsolicited summaries, direct/no sugarcoating, update this section immediately after every completed task, one step at a time with confirmation before proceeding.

## 12. In-App Messaging (Chat)

Added after the rest of this document was last updated — not in the original scope defined in §1–§9. Documented here after the fact from code inspection, not verified by running the app.

### Model

Chat threads are scoped 1:1 to an **inquiry**, not a generic user-to-user DM system — you can only message someone in the context of a specific inquiry on a specific item. This is deliberately separate from, and does not replace, the §5 contact-reveal mechanism (email/phone stays behind approval + RPC; chat is a different, broader channel).

Key design choice: chat opens as soon as an inquiry is **sent** (`pending`), not gated on approval — the donor needs to be able to screen/vet a requester via chat *before* deciding whether to approve them. A thread freezes (no new sends) once its inquiry becomes `rejected` or `closed`. Approved threads stay open indefinitely (through pickup) so both sides can coordinate logistics.

```sql
messages
  id            uuid PK
  inquiry_id    uuid references inquiries(id) on delete cascade
  sender_id     uuid references profiles(id) on delete cascade
  body          text          -- nullable
  image_path    text          -- nullable, path in private chat-images bucket
  created_at    timestamptz default now()
  check (body is not null or image_path is not null)

message_reads   -- one row per (inquiry, user); last-viewed timestamp only,
  inquiry_id    uuid references inquiries(id) on delete cascade   -- not a full per-message read-receipt system
  user_id       uuid references profiles(id) on delete cascade
  last_read_at  timestamptz default now()
  primary key (inquiry_id, user_id)
```

### RLS

- `messages` SELECT: either participant of the inquiry (receiver or the item's donator).
- `messages` INSERT: sender must be `auth.uid()`, must be a participant, and the inquiry must be `pending` or `approved` (blocks sending once `rejected`/`closed`).
- `message_reads`: each user can only read/write their own row, and only for inquiries they're a participant on.
- Storage (`chat-images` bucket, **private**, not public like `item-photos`): same participant check via `storage.foldername(name)[1]` matched against `inquiry_id`. Path convention: `{inquiry_id}/{uuid}.{ext}`. Read access is via short-lived (1hr) signed URLs only (`lib/utils/chatImages.ts`) — never `getPublicUrl()`.
- **Manual step required, not part of any migration:** the `chat-images` bucket itself must be created in the Supabase dashboard (Storage → New bucket → "chat-images" → Public **unchecked**), same as `item-photos` was. *Not confirmed whether this has actually been done — verify before relying on chat images working.*

### Realtime

`messages` is added to the `supabase_realtime` publication. Supabase Realtime re-evaluates the `messages_select_participant` RLS policy per subscriber, so this doesn't widen access beyond what SELECT already allows.

### Frontend

- `app/messages/page.tsx` — server component, builds the full thread list (one per inquiry the user's a participant in) with last-message preview, unread counts (computed from `message_reads.last_read_at`), and locked state (`rejected`/`closed` → locked). Supports deep-linking a specific thread via `?inquiry=`.
- `app/messages/MessagesPageClient.tsx` — client component. One `postgres_changes` INSERT subscription for the whole inbox (not per-thread). Sends are not optimistic — the realtime echo is the single source of truth for appending sent messages, deliberately avoiding reconciling an optimistic copy against the real row.
- `components/messages/` — `ThreadList`, `ThreadView`, `MessageBubble` (renders text and/or a signed-URL image), `MessageComposer` (text + single image attach, disables/shows a locked message when the inquiry is closed).
- `lib/utils/chatImages.ts` — wraps `createSignedUrl` for the private bucket.
- No API routes — all messaging reads/writes go through the browser Supabase client directly, relying entirely on RLS (unlike approve/reject/complete/contact, which are server routes because they need multi-row writes or conditional exposure).

### Status: implemented per static review, unverified end-to-end

Schema, RLS, realtime wiring, and all UI components exist and appear internally consistent (uses `asInquiryStatus` from `lib/utils/status.ts`, so it postdates that fix — confirms it was built after the last logged session). See §11 for the three specific open verification items.

## 14. Account Integrity + Trust/Safety — proposed, working through 1-by-1 (NONE BUILT YET)

This section is a queue, not a completed feature. Each item below gets built and verified one at a time; this section gets updated with a "done" marker after each one, same pattern as the rest of this doc.

### 14a. Display name uniqueness — DONE, VERIFIED (tsc clean)

- Case-insensitive: `jayron` and `Jayron` must be treated as the same value and collide. Confirmed by user.
- **`supabase/migrations/0010_display_name_unique.sql` — written and applied.** `create unique index profiles_display_name_lower_idx on profiles (lower(display_name))`. This is the enforcement source of truth.
- **Collision handling — CONFIRMED: hard error.** Signup is blocked with "Already taken" (case-insensitive match) rather than auto-suffixing.
- **`app/signup/page.tsx` — built.** Live debounced (500ms) check against `public_profiles` via `ilike` as the user types the display name field; inline status shown ("Checking availability..." / "Available" / "Already taken"). Submit button disabled unless status is `available`. Trimmed value used for both the check and the actual signup payload (`display_name: displayName.trim()`), so leading/trailing whitespace differences also collide. Submit-time DB unique-violation is still caught as a backstop for the race condition between the live check and actual submit, surfaced as a friendly message instead of raw Postgres error text.
- `npx tsc --noEmit` run after this change — clean, user confirmed.
- **Note:** the inline "Available"/"Already taken" text uses Tailwind's default `text-green-text`/`text-red-700` — `text-green-text` is an existing DESIGN.md token (reused from the status-pill palette), `text-red-700` is a Tailwind default already used elsewhere in this file for the error banner, not one of DESIGN.md's named tokens. Flagging since the token system is otherwise locked, not blocking.

### 14b. Email uniqueness — CONFIRMED ALREADY ENFORCED, NO WORK NEEDED

- `profiles.id` references `auth.users(id)`, and Supabase Auth itself already enforces unique emails at the `auth.users` level — signing up twice with the same email is already rejected by Supabase.
- Nothing to build here. Closed.

### 14c. Email OTP verification at signup — DONE, VERIFIED (tsc clean); dashboard config BLOCKED, deferred by user

- **Decision confirmed with user: Option A — Supabase's built-in email-OTP mode**, not a custom-built code system. Reasoning: user has no existing email-sending provider and no strong reason to need custom control over the code/expiry logic; built-in OTP means no new table, no third-party transactional email integration, no secrets to manage.
- **Dashboard config — IN PROGRESS, blocked on user needing a Resend account + verified domain, deferred for now.** Supabase Auth defaults to magic-link mode; getting a 6-digit code instead requires changing the "Confirm signup" email template (Dashboard → Authentication → Emails → Confirm signup → Source tab) to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`. **New blocker discovered this session, not previously known:** as of a June 2026 Supabase platform change, free-tier projects using the default email provider can no longer edit auth email templates at all — the Source tab is locked and says "setup custom SMTP to edit the source." Confirmed via current web search, not a user error. Custom SMTP is required to unlock template editing, not just for production email volume as originally assumed. User has started setting this up with Resend (chosen for its free tier and native Supabase integration) — Supabase's manual SMTP form is open and toggled on (Dashboard → Authentication → Emails → SMTP Settings), but blocked on: (1) needing a Resend account with actual SMTP credentials (host/port/username/password) to fill into that form, and (2) Resend requires a verified sending domain — a random email address won't work as the "Sender email address." **Explicitly deferred by user to pick up later** — do not assume this is abandoned, just paused. Claude has no dashboard access, this is entirely the user's task.
- Target expiry: 15 minutes, configured in the dashboard, not app code (dashboard access blocked as above until custom SMTP is live).
- Verification state check: `auth.users.email_confirmed_at`.
- **Gating rule — CONFIRMED AND BUILT: even unverified users can browse; they cannot inquire or post.**
  - Redirect to the verification page immediately after signup. **DONE.**
  - `/items/new` (posting) — **DONE.** Server Component, full-page redirect to `/verify?email=...` if `user.email_confirmed_at` is null, right after the existing logged-out check.
  - `/items/[id]` (item detail — inquiring) — **DONE.** Page itself stays public/browsable for everyone including unverified users, per explicit confirmation. Only the inquire action is blocked: `page.tsx` now computes `isEmailVerified` + passes `userEmail` down to `ItemDetailClient`, which passes both to `InquiryModal`. Modal shows a new `UnverifiedState` (mirrors the existing `LoggedOutState` pattern) with a "Verify email" button linking to `/verify?email=...`, shown whenever logged-in-but-unverified. `handleInquirySubmit` also has a server-side-insert-time guard (`if (!isEmailVerified) return { ok: false, error: ... }`) as a backstop against any client state desync, same pattern as the existing `!userId` guard.
- **Built so far (full list):**
  - `app/verify/page.tsx` — 6-digit code input, `supabase.auth.verifyOtp({ email, token, type: 'signup' })`, resend via `supabase.auth.resend({ type: 'signup', email })` with a 30s client cooldown (assumed, not explicitly confirmed by user).
  - `app/signup/page.tsx` — redirects to `/verify?email=...` on signup instead of an inline message.
  - `app/(app)/items/new/page.tsx` — redirect-if-unverified added.
  - `app/(app)/items/[id]/page.tsx` — passes `isEmailVerified` + `userEmail` down.
  - `app/(app)/items/[id]/ItemDetailClient.tsx` — accepts and threads through the two new props, guards the insert.
  - `components/inquiries/InquiryModal.tsx` — new `UnverifiedState`, new `isEmailVerified`/`verifyHref` props.
- `npx tsc --noEmit` run after all of the above — clean, user confirmed.
- **Not done / still open:** no click-through/live test yet (blocked on the dashboard config being the user's pending task). Resend cooldown (30s) still just an assumption, not explicitly confirmed.

### 14e. Build order — CONFIRMED: line up plan first, then build 1-by-1

User wants the full plan written before any implementation starts. Order to build once implementation begins: not yet chosen between 14a and 14c — ask before starting. Each item gets marked done in this section immediately after it's built and verified, same pattern as the rest of this doc — no batching multiple items into one "done" update.

### 14d. Trust/safety proposals — CAPTURED FOR LATER, NOT SCHEDULED, NOT SCOPED FOR BUILDING YET

Five gaps identified as real (not generic SaaS feature-listing) for a pickup-based donation app between strangers. Priority order below reflects assessed product impact, not a commitment to build in this order — user has not chosen what to build yet.

1. **Notifications** (highest priority) — nothing currently pings a donator when an inquiry lands, or a receiver when approved. For a low-frequency-visit app, this is a real adoption risk: most users won't remember to check back manually. Likely mechanism: Supabase trigger + edge function, or a transactional email service, on inquiry-insert and on approve.
2. **No-show tracking** (highest priority, paired with notifications) — nothing currently distinguishes "approved and completed" from "approved, then item went back to available because the receiver flaked." This is a stronger abuse signal than the existing reputation badge (§12b) but nothing captures it today.
3. **Location/distance** — no location field anywhere in the schema. For a pickup-based model, this is close to core, not a future-proofing extra — receivers in another city can currently inquire on items they can't feasibly collect. Even a rough field (city/neighborhood) would cut dead inquiries.
4. **Block a specific user** — rejection is currently per-inquiry; a rejected/abusive requester can still inquire on the donator's next item. No way today to say "don't let this person contact me again."
5. **Item expiry/staleness** — nothing prunes or flags old `available` listings that the donator never followed through on. Worth an auto-flag/nudge after N days of no activity.

**Deliberately not proposed, scope creep risk flagged:**
- Payments/monetary anything — contradicts the app's free-donation premise.
- Ratings/reviews as a separate system — would create a second, potentially conflicting trust signal alongside the existing reputation badge (§12b).

None of the five are scheduled. Don't start building any of them speculatively — confirm which one(s), if any, before writing code.

