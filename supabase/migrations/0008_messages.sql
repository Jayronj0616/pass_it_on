-- Chat feature: real-time messaging per inquiry (donator <-> receiver).
-- Threads are scoped 1:1 to an inquiry, not a generic user-to-user DM system
-- — you can only chat with someone once an inquiry has been sent. Chat is
-- available as soon as an inquiry is sent (not gated on approval), since
-- the donator needs to be able to screen/vet inquirers via chat BEFORE
-- approving one — locking chat until after approval would defeat that
-- purpose. A thread only freezes (no new sends) once its inquiry is
-- rejected or closed; approved threads stay open through pickup so donator
-- and receiver can still coordinate logistics.
--
-- This coexists with, and does not replace, the §5 contact-reveal
-- mechanism — that stays as a separate, narrower path for exchanging
-- actual email/phone once approved.

-- ============================================================
-- messages
-- ============================================================
create table messages (
  id           uuid primary key default gen_random_uuid(),
  inquiry_id   uuid not null references inquiries(id) on delete cascade,
  sender_id    uuid not null references profiles(id) on delete cascade,
  body         text,
  image_path   text,  -- path inside the private `chat-images` storage bucket, not a public URL — see lib/utils/chatImages.ts
  created_at   timestamptz not null default now(),

  constraint messages_body_or_image check (body is not null or image_path is not null)
);

create index messages_inquiry_id_created_at_idx on messages (inquiry_id, created_at);

-- ============================================================
-- message_reads — one row per (inquiry, user), tracks last-viewed time
-- for unread-badge computation. Not a full read-receipt system (no
-- per-message read state), just "have you opened this thread since X".
-- ============================================================
create table message_reads (
  inquiry_id    uuid not null references inquiries(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  last_read_at  timestamptz not null default now(),

  primary key (inquiry_id, user_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table messages enable row level security;
alter table message_reads enable row level security;

-- A user is a "participant" of an inquiry if they're the receiver or the
-- donator of the item it's on — same shape as inquiries_select_own_or_on_own_item
-- in 0001_init.sql, just also needing the item's donator_id, so it's spelled
-- out with a join here rather than reusing that policy's subquery directly.

create policy "messages_select_participant"
  on messages for select
  using (
    exists (
      select 1
      from inquiries i
      join items it on it.id = i.item_id
      where i.id = messages.inquiry_id
        and (i.receiver_id = auth.uid() or it.donator_id = auth.uid())
    )
  );

create policy "messages_insert_participant"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from inquiries i
      join items it on it.id = i.item_id
      where i.id = messages.inquiry_id
        and i.status in ('pending', 'approved')  -- frozen once rejected/closed
        and (i.receiver_id = auth.uid() or it.donator_id = auth.uid())
    )
  );

create policy "message_reads_select_own"
  on message_reads for select
  using (user_id = auth.uid());

create policy "message_reads_insert_own"
  on message_reads for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from inquiries i
      join items it on it.id = i.item_id
      where i.id = message_reads.inquiry_id
        and (i.receiver_id = auth.uid() or it.donator_id = auth.uid())
    )
  );

create policy "message_reads_update_own"
  on message_reads for update
  using (user_id = auth.uid());

-- ============================================================
-- Realtime — messages needs to broadcast INSERTs to subscribed clients.
-- Supabase Realtime respects RLS for authenticated subscribers (postgres_changes
-- re-evaluates the SELECT policy per subscriber), so this doesn't widen
-- access beyond the messages_select_participant policy above.
-- ============================================================
alter publication supabase_realtime add table messages;

-- ============================================================
-- Storage — chat-images bucket
-- Bucket itself must be created MANUALLY (Supabase dashboard → Storage →
-- New bucket → name "chat-images" → Public bucket UNCHECKED) — this project
-- doesn't create buckets via migration (item-photos wasn't either, see
-- 0002_storage_policies.sql's header comment). Unlike item-photos, this
-- bucket is PRIVATE: chat images are only meant for the two people in that
-- inquiry, not the whole internet, so they're read via short-lived signed
-- URLs (lib/utils/chatImages.ts), never getPublicUrl(). Path convention:
-- {inquiry_id}/{uuid}.{ext}.
-- ============================================================

create policy "chat_images_select_participant"
  on storage.objects for select
  using (
    bucket_id = 'chat-images'
    and exists (
      select 1
      from inquiries i
      join items it on it.id = i.item_id
      where i.id::text = (storage.foldername(name))[1]
        and (i.receiver_id = auth.uid() or it.donator_id = auth.uid())
    )
  );

create policy "chat_images_insert_participant"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-images'
    and exists (
      select 1
      from inquiries i
      join items it on it.id = i.item_id
      where i.id::text = (storage.foldername(name))[1]
        and i.status in ('pending', 'approved')
        and (i.receiver_id = auth.uid() or it.donator_id = auth.uid())
    )
  );
