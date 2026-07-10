-- Auto-create a profiles row whenever a new auth.users row is created.
-- Without this, signup would need a separate client-side insert into
-- profiles right after supabase.auth.signUp(), which is fragile if email
-- confirmation is enabled (session/auth.uid() may not be established yet,
-- and the profiles_insert_own RLS policy requires auth.uid() = id).
-- A trigger runs server-side regardless of confirmation state.

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
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
