-- Per-sender message rate limiting — messaging had no cap at all, unlike
-- inquiries (0007) and login attempts (0012). Same trigger shape as 0007:
-- sends go straight from the browser client (MessagesPageClient.tsx) under
-- RLS, not through a server API route, so a trigger is the only place this
-- can be reliably enforced regardless of insert path.
--
-- Window is hourly, not daily like inquiries — an active back-and-forth
-- conversation is legitimately higher-frequency than sending a new inquiry,
-- so a daily cap would be too tight for normal use. 60/hour allows a real
-- conversation while still stopping a flood.

create or replace function enforce_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_hourly_cap constant integer := 60;
begin
  select count(*) into v_count
  from messages
  where sender_id = new.sender_id
    and created_at >= now() - interval '1 hour';

  if v_count >= v_hourly_cap then
    raise exception 'Message limit reached (% per hour) — try again shortly.', v_hourly_cap;
  end if;

  return new;
end;
$$;

create trigger messages_rate_limit
  before insert on messages
  for each row execute function enforce_message_rate_limit();
