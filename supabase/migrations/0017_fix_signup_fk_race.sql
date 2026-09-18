-- Real fix for signup being completely broken (0015/0016 were the
-- investigation: the original fix, renaming the trigger so it fires after
-- on_auth_user_created, is impossible — Postgres requires ownership of
-- auth.users to rename/drop a trigger there, and Supabase reserves that
-- for its own internal role; only CREATE is allowed, confirmed by 0015's
-- failed push).
--
-- Root cause, confirmed via 0015/0016's introspection: on_account_created_
-- log_event (AFTER INSERT on auth.users) calls log_account_created_event(),
-- which calls log_admin_event('account_created', new.id, new.id, ...).
-- admin_events.actor_id has a FK to profiles(id) — but the profiles row for
-- the brand-new user doesn't exist yet, since it's created by a *separate*
-- trigger (on_auth_user_created) that, per Postgres's alphabetical same-
-- table/same-event trigger firing order, runs after this one. Every
-- signup hit that FK violation and failed.
--
-- Since the trigger itself can't be reordered, make the function it calls
-- tolerant of the race instead: this is an activity-log side effect, not
-- part of what makes a signup valid, so a logging failure here should
-- never abort account creation. Same signature, same SECURITY DEFINER,
-- same search_path, same logged event shape — only change is catching the
-- specific FK violation this one call is exposed to.
create or replace function public.log_account_created_event()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  begin
    perform log_admin_event(
      'account_created',
      new.id,
      new.id,
      jsonb_build_object(
        'display_name',
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
      )
    );
  exception when foreign_key_violation then
    -- profiles row for this user doesn't exist yet (on_auth_user_created
    -- hasn't run yet in this same-event trigger batch) — skip the log
    -- rather than fail the signup over it.
    null;
  end;
  return new;
end;
$function$;
