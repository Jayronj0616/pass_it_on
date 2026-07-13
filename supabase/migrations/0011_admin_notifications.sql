-- Admin notification bell: pings admins in-app when any item is posted
-- (including by an admin themselves, per explicit confirmation). No email —
-- in-app only, real-time via the same supabase_realtime pattern messaging
-- already uses (0008_messages.sql).
--
-- Deliberately NOT a per-event notifications table (one row per item
-- posted) — "every item post" is the entire trigger, and items.created_at
-- already has everything needed. Unread count = count of items posted after
-- this admin's last_read_at. This mirrors message_reads' shape (one row per
-- user tracking "last viewed", not a full per-event log) but is a single
-- row per admin instead of per-thread, since this is one global feed, not
-- one per item.

-- ============================================================
-- admin_notification_reads
-- ============================================================
create table admin_notification_reads (
  admin_id      uuid primary key references profiles(id) on delete cascade,
  last_read_at  timestamptz not null default now()
);

alter table admin_notification_reads enable row level security;

create policy "admin_notification_reads_select_own"
  on admin_notification_reads for select
  using (
    admin_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "admin_notification_reads_insert_own"
  on admin_notification_reads for insert
  with check (
    admin_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "admin_notification_reads_update_own"
  on admin_notification_reads for update
  using (admin_id = auth.uid());

-- ============================================================
-- get_admin_last_read() — get-or-create, so a brand-new admin (no row yet)
-- defaults to "now" instead of showing every item ever posted as unread on
-- first load. security invoker (default) — runs as the calling admin, so
-- the insert/select above still go through the RLS policies just written,
-- same access as if the client did it directly; this just makes the
-- "create if missing, then read" atomic in one round trip instead of two.
-- ============================================================
create or replace function get_admin_last_read()
returns timestamptz
language plpgsql
security invoker
as $$
declare
  result timestamptz;
begin
  insert into admin_notification_reads (admin_id, last_read_at)
  values (auth.uid(), now())
  on conflict (admin_id) do nothing;

  select last_read_at into result
  from admin_notification_reads
  where admin_id = auth.uid();

  return result;
end;
$$;

-- ============================================================
-- Realtime — items needs to broadcast INSERTs for the notification bell to
-- update live. Not previously added (only messages was, in 0008). Same
-- RLS-respects-per-subscriber behavior applies (items_select_public from
-- 0001_init.sql) — newly-inserted items default removed_by_admin = false,
-- so they're visible under that policy to any subscriber, admin or not.
-- ============================================================
alter publication supabase_realtime add table items;
