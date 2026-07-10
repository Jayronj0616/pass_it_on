-- Item reports — the "flag for admin review" mechanism from SYSTEM.md §8/§11
-- (photo moderation). Any authenticated, non-suspended user can report an
-- item; only admins can read/resolve reports (service-role route, same
-- pattern as the rest of §9). A report is purely a signal — it does not
-- auto-hide the item. Actual removal still goes through the existing
-- items.removed_by_admin flow on /admin/items; resolving a report here just
-- clears it from the queue.

create table reports (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references items(id) on delete cascade,
  reporter_id   uuid not null references profiles(id) on delete cascade,
  reason        text not null,
  note          text,
  status        text not null default 'open'
                  check (status in ('open', 'resolved')),
  created_at    timestamptz not null default now(),

  unique (item_id, reporter_id, status)
);

create index reports_item_id_idx on reports (item_id);
create index reports_status_idx on reports (status);

alter table reports enable row level security;

-- Any authenticated, non-suspended user can file a report on any item
-- (including their own — not worth special-casing). No SELECT/UPDATE
-- policy for regular users: reports are readable/resolvable by admins only,
-- via the service-role client in lib/supabase/admin.ts, same as every other
-- admin action in SYSTEM.md §9.
create policy "reports_insert_authenticated"
  on reports for insert
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid() and suspended = false
    )
  );
