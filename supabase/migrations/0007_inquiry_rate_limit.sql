-- Simple per-user daily inquiry cap (SYSTEM.md §8, deferred until now).
-- Enforced as a DB trigger, not app-layer, because the actual insert on
-- `inquiries` happens straight from the browser client (ItemDetailClient.tsx)
-- under RLS, not through a server API route — a trigger is the only place
-- this can be reliably enforced regardless of insert path.

create or replace function enforce_inquiry_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_daily_cap constant integer := 10;
begin
  select count(*) into v_count
  from inquiries
  where receiver_id = new.receiver_id
    and created_at >= date_trunc('day', now());

  if v_count >= v_daily_cap then
    raise exception 'Daily inquiry limit reached (% per day) — try again tomorrow.', v_daily_cap;
  end if;

  return new;
end;
$$;

create trigger inquiries_rate_limit
  before insert on inquiries
  for each row execute function enforce_inquiry_rate_limit();
