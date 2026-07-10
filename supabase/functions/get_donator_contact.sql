-- get_donator_contact — SYSTEM.md §5
-- Returns the donator's email (and phone, if shared) for a given inquiry,
-- but only if the inquiry is approved and the caller is its receiver.
-- Called via RPC from the client (or from an API route) instead of ever
-- letting the client SELECT profiles.email/phone directly.

create or replace function get_donator_contact(inquiry_id uuid)
returns table (email text, phone text)
language sql
security definer
set search_path = public
as $$
  select p.email, case when p.share_phone then p.phone else null end as phone
  from inquiries i
  join items it on it.id = i.item_id
  join profiles p on p.id = it.donator_id
  where i.id = inquiry_id
    and i.status = 'approved'
    and i.receiver_id = auth.uid();
$$;

-- security definer: runs with the privileges of the function owner, so it
-- can read profiles.email/phone despite the table's RLS policy only
-- allowing self-select. The WHERE clause above is what actually enforces
-- "approved inquiry + caller is the receiver" — that check is the entire
-- point of this function, don't remove it.

revoke all on function get_donator_contact(uuid) from public;
grant execute on function get_donator_contact(uuid) to authenticated;
