-- =============================================================================
-- R'SPACE — storage bucket for user-uploaded audio
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

-- Anyone can stream audio (Spaces are public), but a user may only write
-- into their own "<uid>/..." folder inside the bucket.
create policy "audio_public_read" on storage.objects for select
  using (bucket_id = 'audio');

create policy "audio_owner_insert" on storage.objects for insert
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "audio_owner_update" on storage.objects for update
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "audio_owner_delete" on storage.objects for delete
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
