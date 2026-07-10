-- One-off seed for local/dev test accounts. Not a migration — don't run
-- this in production. Directly inserting into auth.users is not Supabase's
-- officially documented path (dashboard "Add user" / Admin API is), but
-- works on current Supabase Postgres. If this errors, use the dashboard
-- instead.

-- Admin account
with new_admin as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin123@gmail.com',
    crypt('jayronjavier0616!', gen_salt('bf')),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Admin"}',
    now(), now(),
    '', '', '', ''
  )
  returning id, email
)
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email', id::text, now(), now(), now()
from new_admin;

-- Regular user account
with new_user as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'user123@gmail.com',
    crypt('jayronjavier0616!', gen_salt('bf')),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Test User"}',
    now(), now(),
    '', '', '', ''
  )
  returning id, email
)
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email', id::text, now(), now(), now()
from new_user;

-- Promote the admin account (profiles row already exists via the
-- on_auth_user_created trigger by this point in the same transaction)
update profiles set is_admin = true where email = 'admin123@gmail.com';
