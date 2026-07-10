-- Storage policies for the item-photos bucket
-- Restricts uploads so a user can only write/update/delete inside their own
-- folder path: item-photos/{auth.uid()}/filename. Bucket itself is public
-- for read (set when creating the bucket), so no SELECT policy is needed
-- for viewing — this file only governs writes.

create policy "item_photos_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "item_photos_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "item_photos_delete_own_folder"
  on storage.objects for delete
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
