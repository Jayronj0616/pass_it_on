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

**What's left overall:** `/items/new` (post form — real insert + Storage upload replacing the local `URL.createObjectURL` preview), both dashboards (`my-items`/`my-inquiries` — still mock data), and the consumer-side action routes: `approve`, `reject`, `complete`, `contact` (all still empty placeholder files, same as the admin ones were before this session).

## 11. Next Task (pick up here)

Admin is fully wired now (see above). What's left, in the order this build has been going (consumer-side data wiring, then the multi-row action routes):

1. **`/items/new`** — post-item form. Needs a real `items` insert plus a real Storage upload to the `item-photos` bucket (replacing the current local `URL.createObjectURL` preview). Path convention for uploads is already fixed by the storage RLS policies in `0002_storage_policies.sql`: must be `{user_id}/filename`.
2. **Dashboards** — `/dashboard/my-items` and `/dashboard/my-inquiries`, still on mock data.
3. **Consumer action routes** — `approve`, `reject`, `complete`, `contact` under `/api/*` (see §6) are still empty placeholder files. These are multi-row/conditional writes, same reasoning as the admin action routes: use `lib/supabase/admin.ts` (service role) inside the route, but gate on the caller actually owning the relevant row (donator for approve/reject/complete, receiver for contact) — there's no `is_admin` shortcut here, ownership has to be checked against the authenticated caller's own id.

Read each file before touching it — this build has consistently used the pattern of reading current state (even placeholder comments) before writing, don't assume shape from memory.

User preferences to carry forward (see full list further down if this doc gets trimmed): ask for context/read files before acting, don't send code snippets unless asked, no unsolicited summaries, direct/no sugarcoating, update this section immediately after every completed task, one step at a time with confirmation before proceeding.
