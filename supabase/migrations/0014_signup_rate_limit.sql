-- IP-based signup rate limiting — signup had no cap of its own. Unlike
-- login lockout (0012) or inquiry capping (0007), there's no account or
-- receiver_id to key off before an account exists, so this is scoped by
-- requesting IP instead.
--
-- This function must only ever be called from a server route
-- (app/api/auth/check-signup-limit/route.ts) using the service-role
-- client, never directly from the browser — a self-reported IP argument
-- from an untrusted caller would be trivial to spoof. The route reads the
-- real IP from request headers server-side and passes that trusted value
-- in. Deliberately NOT granted to anon/authenticated (unlike 0012's
-- functions, which have to be callable pre-session from the browser)
-- since service_role can call any function without an explicit grant.

create table signup_attempts (
  id            bigint generated always as identity primary key,
  ip            text not null,
  attempted_at  timestamptz not null default now()
);

create index signup_attempts_ip_attempted_at_idx on signup_attempts (ip, attempted_at);

-- Cap: 5 signups per IP per hour. Returns true and records the attempt if
-- under the cap; returns false without recording if at/over it. One
-- check-and-record call, made right before supabase.auth.signUp.
create or replace function check_and_record_signup_attempt(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_window constant interval := interval '1 hour';
  v_cap constant integer := 5;
begin
  select count(*) into v_count
  from signup_attempts
  where ip = p_ip
    and attempted_at >= now() - v_window;

  if v_count >= v_cap then
    return false;
  end if;

  insert into signup_attempts (ip) values (p_ip);
  return true;
end;
$$;
