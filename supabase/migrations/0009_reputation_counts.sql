-- Adds a completion timestamp to items (needed to compute "claimed/donated
-- in the last 7 days" — status alone tells you an item IS completed, not
-- WHEN it became completed) and extends public_profiles with 4 public
-- reputation counts: donated_total, donated_recent, received_total,
-- received_recent. See SYSTEM.md for the abuse-prevention reasoning —
-- these are intentionally public (shown wherever a display_name shows,
-- e.g. InquiryRow when a donator is reviewing who's asking) so donators
-- can see a receiver's claim history before approving.
--
-- Definitions (deliberately conservative — only counts REAL completed
-- handoffs, not just "posted" or "approved but never picked up"):
--   donated_total/recent  = items where donator_id = user AND status = 'completed'
--   received_total/recent = inquiries where receiver_id = user AND status = 'approved'
--                            AND the item itself is 'completed'
--   recent = completed_at within the last 7 days
--
-- Counts are computed on-demand (not denormalized/trigger-maintained like
-- items.inquiry_count) because the 7-day window is a ROLLING window — it
-- changes daily even with zero new activity, which a plain increment-on-
-- insert trigger can't represent without a separate scheduled job this
-- project has no infrastructure for. Total counts are cheap indexed
-- COUNT()s; recent counts add one indexed range filter on completed_at.
-- Revisit only if this becomes a real read-performance bottleneck at scale.

alter table items add column completed_at timestamptz;

-- Set completed_at automatically whenever status transitions TO 'completed'
-- (not on every update — only the specific status transition). Also clears
-- it back to null if an item is ever un-completed, so it can't go stale.
create or replace function set_item_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at = now();
  elsif new.status is distinct from 'completed' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger on_item_status_change_set_completed_at
  before update on items
  for each row execute function set_item_completed_at();

create index items_completed_at_idx on items (completed_at) where completed_at is not null;

-- Replace public_profiles with the extended version. Views can't be
-- ALTERed to add columns — drop and recreate. Same grants as before.
drop view if exists public_profiles;

create view public_profiles as
  select
    p.id,
    p.display_name,
    (
      select count(*) from items i
      where i.donator_id = p.id and i.status = 'completed'
    ) as donated_total,
    (
      select count(*) from items i
      where i.donator_id = p.id and i.status = 'completed'
        and i.completed_at > now() - interval '7 days'
    ) as donated_recent,
    (
      select count(*) from inquiries iq
      join items i on i.id = iq.item_id
      where iq.receiver_id = p.id and iq.status = 'approved' and i.status = 'completed'
    ) as received_total,
    (
      select count(*) from inquiries iq
      join items i on i.id = iq.item_id
      where iq.receiver_id = p.id and iq.status = 'approved' and i.status = 'completed'
        and i.completed_at > now() - interval '7 days'
    ) as received_recent
  from profiles p;

grant select on public_profiles to anon, authenticated;
