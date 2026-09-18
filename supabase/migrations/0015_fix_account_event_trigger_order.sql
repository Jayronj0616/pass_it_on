-- Original approach (ALTER TRIGGER ... RENAME ... ON auth.users) cannot
-- work: Postgres requires table ownership to rename/drop a trigger, and
-- Supabase reserves ownership of auth.users for its own internal role.
-- The migration role can CREATE triggers there (that's how the broken one
-- got made) but not rename/drop existing ones — confirmed via
-- `supabase db push`, which failed with "must be owner of table users"
-- (SQLSTATE 42501) on the rename statement.
--
-- Read-only introspection instead, no schema change: dump the current
-- source of log_admin_event() (the function the un-renameable trigger
-- calls) and the trigger/admin_events shapes, so the real fix — making
-- that function tolerant of a missing profiles row, since the function
-- lives in the public schema and CAN be modified — preserves its existing
-- behavior exactly instead of guessing at it.
do $$
declare
  def text;
begin
  select pg_get_functiondef(oid) into def
  from pg_proc
  where proname = 'log_admin_event';
  raise notice 'FUNC_DEF_START%FUNC_DEF_END', coalesce(def, '(not found)');
end $$;

do $$
declare
  def text;
begin
  select pg_get_triggerdef(oid) into def
  from pg_trigger
  where tgname = 'on_account_created_log_event';
  raise notice 'TRIGGER_DEF_START%TRIGGER_DEF_END', coalesce(def, '(not found)');
end $$;

do $$
declare
  cols text;
begin
  select string_agg(column_name || ' ' || data_type || case when is_nullable = 'NO' then ' not null' else '' end, ', ')
  into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'admin_events';
  raise notice 'ADMIN_EVENTS_COLS_START%ADMIN_EVENTS_COLS_END', coalesce(cols, '(not found)');
end $$;
