-- Read-only introspection, no schema change. Follow-up to 0015: the
-- trigger actually calls log_account_created_event(), not log_admin_event()
-- directly. Need its source and the actor_id FK definition before writing
-- the real fix.
do $$
declare
  def text;
begin
  select pg_get_functiondef(oid) into def
  from pg_proc
  where proname = 'log_account_created_event';
  raise notice 'FUNC2_DEF_START%FUNC2_DEF_END', coalesce(def, '(not found)');
end $$;

do $$
declare
  def text;
begin
  select pg_get_constraintdef(oid) into def
  from pg_constraint
  where conname = 'admin_events_actor_id_fkey';
  raise notice 'FK_DEF_START%FK_DEF_END', coalesce(def, '(not found)');
end $$;
