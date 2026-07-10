-- Keeps items.inquiry_count in sync with actual inquiries rows.
-- Increments on every successful inquiry insert (that's the point where a
-- user has "sent" an inquiry — approve/reject/closed later don't change
-- this count, it's just a running total of how many people have inquired).

create or replace function increment_item_inquiry_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update items set inquiry_count = inquiry_count + 1 where id = new.item_id;
  return new;
end;
$$;

create trigger on_inquiry_created
  after insert on inquiries
  for each row execute function increment_item_inquiry_count();
