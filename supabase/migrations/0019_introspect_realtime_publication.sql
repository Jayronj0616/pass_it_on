-- Read-only introspection, no schema change. Messaging's realtime INSERT
-- events are never reaching subscribed clients (confirmed: DB insert
-- succeeds every time, channel reports SUBSCRIBED, but the postgres_changes
-- callback never fires for any sender/receiver). Check whether `messages`
-- is actually still in the supabase_realtime publication and whether RLS
-- is enabled on it, before guessing at a fix.
do $$
declare
  result text;
begin
  select string_agg(schemaname || '.' || tablename, ', ')
  into result
  from pg_publication_tables
  where pubname = 'supabase_realtime';
  raise notice 'PUBLICATION_TABLES_START%PUBLICATION_TABLES_END', coalesce(result, '(none)');
end $$;

do $$
declare
  result text;
begin
  select relrowsecurity::text || ' / forced=' || relforcerowsecurity::text
  into result
  from pg_class
  where relname = 'messages' and relnamespace = 'public'::regnamespace;
  raise notice 'MESSAGES_RLS_START%MESSAGES_RLS_END', coalesce(result, '(not found)');
end $$;

do $$
declare
  result text;
begin
  select string_agg(polname || ': ' || pg_get_expr(polqual, polrelid), E'\n')
  into result
  from pg_policy
  where polrelid = 'public.messages'::regclass;
  raise notice 'MESSAGES_POLICIES_START%MESSAGES_POLICIES_END', coalesce(result, '(none)');
end $$;
