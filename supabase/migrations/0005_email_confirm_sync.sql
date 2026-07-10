-- Keeps profiles.email in sync with auth.users.email, but only after a
-- change is actually confirmed. supabase.auth.updateUser({ email }) does
-- NOT touch auth.users.email immediately — it stores the pending address
-- separately and only writes it into auth.users.email once the user clicks
-- the confirmation link. So this trigger firing (new.email <> old.email)
-- only happens post-confirmation, which is exactly the point where
-- profiles.email should catch up. Until then, profiles.email intentionally
-- stays on the old address — see SYSTEM.md §11 for why (contact-reveal in
-- §5 must never hand out an unconfirmed email).

create or replace function sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_confirmed
  after update on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute function sync_profile_email();
