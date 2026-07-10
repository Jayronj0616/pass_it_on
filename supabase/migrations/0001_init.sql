<<<<<<< HEAD
-- PassItOn — initial schema
-- See SYSTEM.md §4 (core schema) and §9 (admin additions) for design notes.
-- Admin columns are folded into this single migration since it's the only
-- migration file scaffolded. Split into 0002_admin.sql later if you prefer
-- to keep base schema and admin schema separately versioned.

-- ============================================================
-- profiles
-- ============================================================
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  email         text not null,
  phone         text,
  share_phone   boolean not null default false,
  is_admin      boolean not null default false,
  suspended     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- items
-- ============================================================
create table items (
  id                 uuid primary key default gen_random_uuid(),
  donator_id         uuid not null references profiles(id) on delete cascade,
  title              text not null,
  description        text not null,
  photo_url          text,
  status             text not null default 'available'
                       check (status in ('available', 'reserved', 'completed')),
  inquiry_count      int not null default 0,
  removed_by_admin   boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index items_status_idx on items (status);
create index items_donator_id_idx on items (donator_id);

-- ============================================================
-- inquiries
-- ============================================================
create table inquiries (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references items(id) on delete cascade,
  receiver_id   uuid not null references profiles(id) on delete cascade,
  message       text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected', 'closed')),
  created_at    timestamptz not null default now(),

  unique (item_id, receiver_id)
);

create index inquiries_item_id_idx on inquiries (item_id);
create index inquiries_receiver_id_idx on inquiries (receiver_id);

-- ============================================================
-- public_profiles view
-- ============================================================
-- profiles.email/phone must never be reachable via a client SELECT — see
-- SYSTEM.md §5. RLS is row-level, not column-level, so the profiles table
-- itself is locked to "select your own row only" below. This view exposes
-- just the two fields that are safe to show publicly (e.g. donator display
-- name on an item card) without touching contact info. Views run with the
-- privileges of the view owner by default, so this bypasses the profiles
-- RLS policy on purpose, but only exposes the two whitelisted columns.
create view public_profiles as
  select id, display_name
  from profiles;

grant select on public_profiles to anon, authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table items enable row level security;
alter table inquiries enable row level security;

-- profiles: no public SELECT policy — only the owner can read their own
-- row directly (needed for e.g. the /profile edit page). Everyone else
-- must go through public_profiles (display_name only) or the server-side
-- contact-reveal / admin-lookup paths in SYSTEM.md §5 and §9.
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

-- items: public SELECT for now (open decision in SYSTEM.md §8 — whether
-- reserved/completed items stay visible in public browse is still unresolved,
-- so this currently shows all non-removed items regardless of status).
-- Removed-by-admin items are hidden from everyone except the owner.
create policy "items_select_public"
  on items for select
  using (removed_by_admin = false or donator_id = auth.uid());

create policy "items_insert_own"
  on items for insert
  with check (
    donator_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid() and suspended = false
    )
  );

create policy "items_update_own"
  on items for update
  using (donator_id = auth.uid());

create policy "items_delete_own"
  on items for delete
  using (donator_id = auth.uid());

-- inquiries: insert restricted to authenticated, non-suspended users,
-- acting as themselves. Select restricted to your own inquiries (as
-- receiver) or inquiries on items you posted (as donator).
create policy "inquiries_select_own_or_on_own_item"
  on inquiries for select
  using (
    receiver_id = auth.uid()
    or item_id in (select id from items where donator_id = auth.uid())
  );

create policy "inquiries_insert_own"
  on inquiries for insert
  with check (
    receiver_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid() and suspended = false
    )
  );

-- No client-side UPDATE policy on inquiries or on items.status: approve /
-- reject / complete / admin force-close are multi-row, conditional writes
-- and go through the service-role API routes in SYSTEM.md §6 and §9, not
-- direct client writes.
=======
-- profiles, items, inquiries tables + RLS policies
-- See SYSTEM.md §4 for full schema and RLS notes
>>>>>>> c98a9489027454d730cce406f24e65d63b986d31
