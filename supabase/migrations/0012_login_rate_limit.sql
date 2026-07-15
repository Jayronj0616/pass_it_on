-- Account-based login rate limiting (SYSTEM.md §8, deferred until now).
-- Supabase Auth's own rate limiting is IP-based (token bucket across auth
-- endpoints generally) and does NOT protect a single account from
-- unlimited wrong-password attempts — confirmed via current docs/community
-- reports before building this, not assumed. This closes that gap.
--
-- 5 failed attempts within a 15-minute sliding window locks the account
-- for 5 minutes. Self-healing (time-based unlock), not a hard lock needing
-- manual/admin intervention — a permanent lock would let anyone lock a
-- stranger out of their own account by deliberately failing their login.
--
-- Design: single RPC (record_login_attempt) does double duty — call it
-- before attempting supabase.auth.signInWithPassword. It returns whether
-- the account is CURRENTLY locked (skip the Supabase call entirely if so)
-- and, going forward, the app calls it again after a failed Supabase
-- attempt to actually record the failure. This keeps the common case
-- (correct password, first try) to one cheap query with no added latency,
-- rather than checking lock status on every login unconditionally.

alter table profiles add column if not exists failed_login_count int not null default 0;
alter table profiles add column if not exists locked_until timestamptz;
alter table profiles add column if not exists last_failed_login_at timestamptz;

-- profiles had no index on email at all before this migration — every
-- lookup below (check/record/reset, called on every login attempt) would
-- otherwise be a sequential scan. Case-insensitive to match how these
-- functions query (lower(email) = lower(p_email)).
create unique index if not exists profiles_email_lower_idx on profiles (lower(email));

-- Called with the account's email BEFORE attempting sign-in. Returns
-- whether the account is currently locked. If the lock has expired
-- (locked_until is in the past), clears it and resets the count — the
-- sliding window naturally "forgets" old failures this way, no separate
-- cron/scheduled job needed.
create or replace function check_login_locked(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked_until timestamptz;
begin
  select locked_until into v_locked_until
  from profiles
  where lower(email) = lower(p_email);

  if v_locked_until is null then
    return false;
  end if;

  if v_locked_until <= now() then
    -- Lock has expired — clear it so the next failed attempt starts a
    -- fresh window instead of instantly re-locking.
    update profiles
    set locked_until = null, failed_login_count = 0
    where lower(email) = lower(p_email);
    return false;
  end if;

  return true;
end;
$$;

-- Called AFTER a failed supabase.auth.signInWithPassword attempt, to
-- actually record the failure and lock the account if the threshold is
-- hit. Not called on success — the app resets the count separately via
-- reset_login_attempts() once sign-in actually succeeds.
create or replace function record_failed_login(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window constant interval := interval '15 minutes';
  v_lock_duration constant interval := interval '5 minutes';
  v_max_attempts constant int := 5;
  v_last_failed_at timestamptz;
  v_new_count int;
begin
  select last_failed_login_at into v_last_failed_at
  from profiles
  where lower(email) = lower(p_email);

  if not found then
    -- No matching account — nothing to record. Deliberately silent, not
    -- an error: don't leak whether an email exists via this path either.
    return;
  end if;

  -- Sliding window: if the most recent failure was outside the window,
  -- this failure starts a fresh count instead of adding to a stale one.
  -- Uses a dedicated last_failed_login_at column, not the shared
  -- updated_at column — updated_at can be touched by unrelated profile
  -- edits (display name, phone, the email-confirm-sync trigger from
  -- §10), which would corrupt this window if reused.
  update profiles
  set failed_login_count = case
        when v_last_failed_at is null or v_last_failed_at < now() - v_window then 1
        else failed_login_count + 1
      end,
      last_failed_login_at = now()
  where lower(email) = lower(p_email)
  returning failed_login_count into v_new_count;

  if v_new_count >= v_max_attempts then
    update profiles
    set locked_until = now() + v_lock_duration
    where lower(email) = lower(p_email);
  end if;
end;
$$;

-- Called after a SUCCESSFUL sign-in, to clear the slate.
create or replace function reset_login_attempts(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
  set failed_login_count = 0, locked_until = null
  where lower(email) = lower(p_email);
end;
$$;

-- All three are called before a session exists (login isn't complete yet),
-- so anon needs execute — not just authenticated. security definer above
-- means these run with elevated privilege regardless of caller, but the
-- caller still needs grant to invoke the function at all.
grant execute on function check_login_locked(text) to anon, authenticated;
grant execute on function record_failed_login(text) to anon, authenticated;
grant execute on function reset_login_attempts(text) to anon, authenticated;
