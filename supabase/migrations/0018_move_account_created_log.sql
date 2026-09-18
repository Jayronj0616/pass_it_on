-- Move the account_created admin_events log into handle_new_user() (0003)
-- itself, right after the profiles insert, where the FK it needs
-- (admin_events.actor_id -> profiles.id) is guaranteed satisfied.
--
-- 0017 made log_account_created_event() swallow the FK violation so
-- signup would stop failing outright. But on_account_created_log_event
-- always fires before on_auth_user_created (same-table/event triggers run
-- in alphabetical order by trigger name, confirmed via 0015/0016's
-- introspection, and this role can create triggers on auth.users but not
-- rename/drop the existing one to fix the ordering directly) — so that
-- swallow would silently no-op on *every* signup, forever. The
-- "account_created" event would never be logged again, just quietly and
-- permanently gone from admin_events / the dashboard's recent activity.
--
-- Logging it here instead, inside the trigger that actually creates the
-- profiles row, guarantees correct ordering without depending on trigger
-- name sorting at all.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );

  perform log_admin_event(
    'account_created',
    new.id,
    new.id,
    jsonb_build_object(
      'display_name',
      coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
    )
  );

  return new;
end;
$$;

-- log_account_created_event() is still called by the un-renameable
-- on_account_created_log_event trigger (fires first, every time) but no
-- longer needs to do anything — the log above now covers it, correctly
-- ordered. Left as a no-op rather than trying to drop the trigger that
-- calls it, which this role still can't do.
create or replace function public.log_account_created_event()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return new;
end;
$function$;
