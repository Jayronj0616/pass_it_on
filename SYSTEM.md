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
